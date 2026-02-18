"""OpenAI 客户端"""
import json
from typing import Any, AsyncGenerator, Dict, Optional

from app.logger import get_logger
from .base_client import BaseAIClient

logger = get_logger(__name__)


class OpenAIClient(BaseAIClient):
    """OpenAI API 客户端"""

    def __init__(self, api_key: str, base_url: str, config=None):
        super().__init__(api_key, base_url, config)
        cache_cfg = self.config.cache
        # OpenAI 兼容协议的 system prompt 缓存（用于 NEW-API 等中转站）
        self.enable_openai_prompt_cache = cache_cfg.enable_openai_prompt_cache
        self._openai_cache_min_length = cache_cfg.prompt_cache_min_length
        if self.enable_openai_prompt_cache:
            logger.info(f"🗂️ OpenAI 兼容协议 system prompt 缓存已启用 (min_length={self._openai_cache_min_length})")

    def _build_headers(self) -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.enable_openai_prompt_cache:
            # Required by Anthropic prompt caching; ignored by pure OpenAI endpoints.
            headers["anthropic-beta"] = "prompt-caching-2024-07-31"
        return headers

    @staticmethod
    def _extract_cache_stats(usage: Any) -> Optional[Dict[str, int]]:
        """Extract cache-related token stats from OpenAI-compatible usage payload."""
        if not isinstance(usage, dict):
            return None

        prompt_details = usage.get("prompt_tokens_details")
        if not isinstance(prompt_details, dict):
            prompt_details = {}

        has_cache_keys = (
            "cache_read_input_tokens" in usage
            or "cache_creation_input_tokens" in usage
            or "cached_tokens" in prompt_details
        )
        if not has_cache_keys:
            return None

        def to_int(value: Any) -> int:
            try:
                return int(value)
            except (TypeError, ValueError):
                return 0

        cached_tokens = to_int(prompt_details.get("cached_tokens"))
        cache_read_tokens = to_int(usage.get("cache_read_input_tokens")) or cached_tokens
        cache_write_tokens = to_int(usage.get("cache_creation_input_tokens"))

        return {
            "cache_read_tokens": cache_read_tokens,
            "cache_write_tokens": cache_write_tokens,
            "cached_tokens": cached_tokens,
        }

    def _build_payload(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
        stream: bool = False,
    ) -> Dict[str, Any]:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if stream:
            payload["stream"] = True
        if tools:
            # 清理 $schema 字段
            cleaned = []
            for t in tools:
                tc = t.copy()
                if "function" in tc and "parameters" in tc["function"]:
                    tc["function"]["parameters"] = {
                        k: v for k, v in tc["function"]["parameters"].items() if k != "$schema"
                    }
                cleaned.append(tc)
            payload["tools"] = cleaned
            if tool_choice:
                payload["tool_choice"] = tool_choice
        return payload

    async def chat_completion(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
    ) -> Dict[str, Any]:
        payload = self._build_payload(messages, model, temperature, max_tokens, tools, tool_choice)
        
        logger.debug(f"📤 OpenAI 请求 payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
        
        data = await self._request_with_retry("POST", "/chat/completions", payload)
        
        # 调试日志：输出原始响应
        logger.debug(f"📥 OpenAI 原始响应: {json.dumps(data, ensure_ascii=False, indent=2)}")

        choices = data.get("choices", [])
        if not choices or len(choices) == 0:
            raise ValueError("API 返回空 choices 或 choices 为空列表")

        choice = choices[0]
        message = choice.get("message", {})
        usage = data.get("usage")
        cache = self._extract_cache_stats(usage)
        if cache is not None:
            logger.info(
                "OpenAI-compatible cache stats: read=%s write=%s cached_tokens=%s",
                cache["cache_read_tokens"],
                cache["cache_write_tokens"],
                cache["cached_tokens"],
            )
        return {
            "content": message.get("content", ""),
            "tool_calls": message.get("tool_calls"),
            "finish_reason": choice.get("finish_reason"),
            "usage": usage,
            "cache": cache,
        }

    async def chat_completion_stream(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
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
        payload = self._build_payload(messages, model, temperature, max_tokens, tools, tool_choice, stream=True)
        
        tool_calls_buffer = {}  # 收集工具调用块
        
        try:
            async with await self._request_with_retry("POST", "/chat/completions", payload, stream=True) as response:
                response.raise_for_status()
                try:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                # 流结束，检查是否有工具调用需要处理
                                if tool_calls_buffer:
                                    yield {"tool_calls": list(tool_calls_buffer.values()), "done": True}
                                yield {"done": True}
                                break
                            try:
                                data = json.loads(data_str)
                                usage = data.get("usage")
                                cache = self._extract_cache_stats(usage)
                                if cache is not None:
                                    logger.info(
                                        "OpenAI-compatible stream cache stats: read=%s write=%s cached_tokens=%s",
                                        cache["cache_read_tokens"],
                                        cache["cache_write_tokens"],
                                        cache["cached_tokens"],
                                    )
                                choices = data.get("choices", [])
                                if choices and len(choices) > 0:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    
                                    # 检查工具调用
                                    tc_list = delta.get("tool_calls")
                                    if tc_list:
                                        for tc in tc_list:
                                            index = tc.get("index", 0)
                                            if index not in tool_calls_buffer:
                                                tool_calls_buffer[index] = tc
                                            else:
                                                existing = tool_calls_buffer[index]
                                                # 合并 function.arguments
                                                if "function" in tc and "function" in existing:
                                                    if tc["function"].get("arguments"):
                                                        existing["function"]["arguments"] = (
                                                            existing["function"].get("arguments", "") +
                                                            tc["function"]["arguments"]
                                                        )
                                    
                                    if content:
                                        yield {"content": content}
                                        
                            except json.JSONDecodeError:
                                continue
                except GeneratorExit:
                    # 生成器被关闭，这是正常的清理过程
                    logger.debug("流式响应生成器被关闭(GeneratorExit)")
                    raise
                except Exception as iter_error:
                    logger.error(f"流式响应迭代出错: {str(iter_error)}")
                    raise
        except GeneratorExit:
            # 重新抛出GeneratorExit，让调用方处理
            raise
        except Exception as e:
            logger.error(f"流式请求出错: {str(e)}")
            raise
