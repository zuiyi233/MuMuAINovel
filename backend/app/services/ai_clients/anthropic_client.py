"""Anthropic 客户端"""
from typing import Any, AsyncGenerator, Dict, Optional

from anthropic import AsyncAnthropic

from app.logger import get_logger
from app.services.ai_config import AIClientConfig, default_config

logger = get_logger(__name__)

class AnthropicClient:
    """Anthropic API 客户端"""

    def __init__(self, api_key: str, base_url: Optional[str] = None, config: Optional[AIClientConfig] = None):
        self.config = config or default_config
        cache_cfg = self.config.cache
        self.enable_prompt_cache = cache_cfg.enable_prompt_cache
        self._cache_min_length = cache_cfg.prompt_cache_min_length

        kwargs: Dict[str, Any] = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        # 启用 prompt caching 时追加 beta header（官方及兼容的第三方中转站均支持）
        if self.enable_prompt_cache:
            kwargs["default_headers"] = {"anthropic-beta": "prompt-caching-2024-07-31"}
            logger.info(f"🗂️ Anthropic Prompt Caching 已启用 (min_length={self._cache_min_length})")
        self.client = AsyncAnthropic(**kwargs)

    def _wrap_system_with_cache(self, system_prompt: str) -> Any:
        """将 system_prompt 包装为支持缓存的格式（仅当内容足够长时）"""
        if self.enable_prompt_cache and len(system_prompt) >= self._cache_min_length:
            logger.debug(f"🗂️ system_prompt 长度={len(system_prompt)}，启用 cache_control")
            return [{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}]
        return system_prompt

    @staticmethod
    def _extract_usage_dict(usage_obj: Any) -> Dict[str, int]:
        if usage_obj is None:
            return {}

        usage: Dict[str, int] = {}
        for key in (
            "input_tokens",
            "output_tokens",
            "cache_creation_input_tokens",
            "cache_read_input_tokens",
        ):
            value = getattr(usage_obj, key, None)
            if value is None:
                continue
            try:
                usage[key] = int(value)
            except (TypeError, ValueError):
                continue
        return usage

    @staticmethod
    def _extract_cache_stats(usage: Dict[str, int]) -> Optional[Dict[str, int]]:
        if not isinstance(usage, dict):
            return None
        has_cache_keys = (
            "cache_creation_input_tokens" in usage or "cache_read_input_tokens" in usage
        )
        if not has_cache_keys:
            return None

        return {
            "cache_read_tokens": usage.get("cache_read_input_tokens", 0),
            "cache_write_tokens": usage.get("cache_creation_input_tokens", 0),
        }

    async def chat_completion(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
    ) -> Dict[str, Any]:
        kwargs: Dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
        }
        if system_prompt:
            kwargs["system"] = self._wrap_system_with_cache(system_prompt)
        if tools:
            kwargs["tools"] = tools
            if tool_choice == "required":
                kwargs["tool_choice"] = {"type": "any"}
            elif tool_choice == "auto":
                kwargs["tool_choice"] = {"type": "auto"}

        response = await self.client.messages.create(**kwargs)

        tool_calls = []
        content = ""
        for block in response.content:
            if block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "type": "function",
                    "function": {"name": block.name, "arguments": block.input},
                })
            elif block.type == "text":
                content += block.text

        usage = self._extract_usage_dict(getattr(response, "usage", None))
        cache = self._extract_cache_stats(usage)
        if cache is not None:
            logger.info(
                "Anthropic cache stats: read=%s write=%s",
                cache["cache_read_tokens"],
                cache["cache_write_tokens"],
            )

        return {
            "content": content,
            "tool_calls": tool_calls if tool_calls else None,
            "finish_reason": response.stop_reason,
            "usage": usage if usage else None,
            "cache": cache,
        }

    async def chat_completion_stream(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        流式生成，支持工具调用
        
        Yields:
            Dict with keys:
            - content: str - 文本内容块
            - tool_calls: list - 工具调用列表（如果有）
            - done: bool - 是否结束
        """
        kwargs: Dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
        }
        if system_prompt:
            kwargs["system"] = self._wrap_system_with_cache(system_prompt)
        if tools:
            kwargs["tools"] = tools
            if tool_choice == "required":
                kwargs["tool_choice"] = {"type": "any"}
            elif tool_choice == "auto":
                kwargs["tool_choice"] = {"type": "auto"}

        try:
            async with self.client.messages.stream(**kwargs) as stream:
                try:
                    tool_calls = []
                    async for chunk in stream:
                        # 处理不同类型的块
                        if chunk.type == "text_delta":
                            yield {"content": chunk.text}
                        elif chunk.type == "tool_use_delta":
                            # 工具调用增量
                            if not tool_calls or tool_calls[-1].get("id") != chunk.id:
                                tool_calls.append({
                                    "id": chunk.id,
                                    "type": "function",
                                    "function": {
                                        "name": chunk.name,
                                        "arguments": ""
                                    }
                                })
                            # 追加参数
                            if tool_calls[-1]["function"]["arguments"] is None:
                                tool_calls[-1]["function"]["arguments"] = ""
                            tool_calls[-1]["function"]["arguments"] += chunk.input_gets_new_text or ""
                        elif chunk.type == "message_delta":
                            if chunk.stop_reason:
                                # 流结束
                                if tool_calls:
                                    yield {"tool_calls": tool_calls}
                                yield {"done": True, "finish_reason": chunk.stop_reason}
                except GeneratorExit:
                    # 生成器被关闭，这是正常的清理过程
                    logger.debug("Anthropic 流式响应生成器被关闭(GeneratorExit)")
                    raise
                except Exception as iter_error:
                    logger.error(f"Anthropic 流式响应迭代出错: {str(iter_error)}")
                    raise
        except GeneratorExit:
            # 重新抛出GeneratorExit，让调用方处理
            raise
        except Exception as e:
            logger.error(f"Anthropic 流式请求出错: {str(e)}")
            raise
