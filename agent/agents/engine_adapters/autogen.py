from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


autogen_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="autogen",
        label="AutoGen",
        description="Microsoft AutoGen multi-agent orchestration via optional backend proxy.",
        api_path="/api/autogen",
        availability_label="AutoGen",
        fallback_label="AutoGen backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
