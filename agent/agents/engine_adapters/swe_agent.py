from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


swe_agent_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="swe-agent",
        label="SWE-agent",
        description="SWE-agent Agent-Computer Interface via optional backend proxy.",
        api_path="/api/swe-agent",
        availability_label="SWE-agent",
        fallback_label="SWE-agent backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
