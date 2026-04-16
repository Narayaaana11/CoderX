from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


dify_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="dify",
        label="Dify",
        description="Dify workflow/app backend via optional proxy.",
        api_path="/api/dify",
        availability_label="Dify",
        fallback_label="Dify backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
