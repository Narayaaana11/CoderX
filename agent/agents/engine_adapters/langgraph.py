from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


langgraph_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="langgraph",
        label="LangGraph",
        description="LangGraph integration with optional backend proxy and compatibility fallback.",
        api_path="/api/langgraph",
        availability_label="LangGraph",
        fallback_label="LangGraph backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
