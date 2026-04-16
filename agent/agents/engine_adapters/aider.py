from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


aider_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="aider",
        label="Aider",
        description="Aider-style repo-aware coding backend via optional proxy.",
        api_path="/api/aider",
        availability_label="Aider",
        fallback_label="Aider backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
