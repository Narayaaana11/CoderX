from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import ProxyAdapterConfig, ProxyBackedAdapter


openhands_engine_adapter = ProxyBackedAdapter(
    config=ProxyAdapterConfig(
        adapter_id="openhands",
        label="OpenHands",
        description="Autonomous AI engineer backend via optional proxy.",
        api_path="/api/openhands",
        availability_label="OpenHands",
        fallback_label="OpenHands backend unavailable",
    ),
    fallback_runner=fallback_builder_run,
    quick_action_runner=fallback_quick_action,
)
