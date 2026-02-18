"""AI 服务配置管理"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class HTTPClientConfig:
    """HTTP 客户端配置"""
    connect_timeout: float = 90.0
    read_timeout: float = 300.0
    write_timeout: float = 90.0
    pool_timeout: float = 90.0
    max_keepalive_connections: int = 50
    max_connections: int = 100
    keepalive_expiry: float = 60.0


@dataclass
class RetryConfig:
    """重试配置"""
    max_retries: int = 3
    base_delay: float = 0.2
    max_delay: float = 10.0
    exponential_base: int = 2
    non_retryable_status_codes: tuple = field(default_factory=lambda: (401, 403, 404))


@dataclass
class RateLimitConfig:
    """限流配置"""
    max_concurrent_requests: int = 5
    request_delay: float = 0.2


@dataclass
class CacheConfig:
    """API 缓存配置"""
    # Anthropic 原生协议 Prompt Caching（api_provider=anthropic）
    # 对 system prompt 加 cache_control + 发送 anthropic-beta header
    enable_prompt_cache: bool = True
    # 触发缓存的最小 system prompt 字符数（过短的提示词缓存收益极低）
    prompt_cache_min_length: int = 1024

    # OpenAI 兼容协议的 system prompt 缓存（api_provider=openai）
    # 适用于 NEW-API、OpenRouter 等支持透传 cache_control 的中转站
    # 启用后将 system 消息内容改为数组格式并附带 cache_control
    # ⚠️ 注意：仅在中转站后端为 Anthropic 模型时有效；纯 OpenAI 模型无需开启
    enable_openai_prompt_cache: bool = False


@dataclass
class AIClientConfig:
    """AI 客户端完整配置"""
    http: HTTPClientConfig = field(default_factory=HTTPClientConfig)
    retry: RetryConfig = field(default_factory=RetryConfig)
    rate_limit: RateLimitConfig = field(default_factory=RateLimitConfig)
    cache: CacheConfig = field(default_factory=CacheConfig)


# 全局默认配置
default_config = AIClientConfig()