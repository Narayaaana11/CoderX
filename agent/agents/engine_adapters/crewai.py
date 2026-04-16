from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


crewai_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="crewai",
        label="CrewAI",
        description="Multi-agent crew orchestration via optional backend proxy.",
        api_path="/api/crewai",
        availability_label="CrewAI",
        fallback_label="CrewAI backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
