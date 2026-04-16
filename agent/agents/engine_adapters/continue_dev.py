from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


continue_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="continue",
        label="Continue.dev",
        description="Continue-style context-aware coding backend via optional proxy.",
        api_path="/api/continue",
        availability_label="Continue",
        fallback_label="Continue backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
