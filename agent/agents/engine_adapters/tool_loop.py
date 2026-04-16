from __future__ import annotations

from .default import fallback_builder_run, fallback_quick_action
from .proxy_utils import is_proxy_integration_available, run_via_proxy_sse
from .types import OrchestrationCallbacks, RunOptions


class ToolLoopEngineAdapter:
    id = "tool-loop"
    label = "Tool-Loop Agent"
    description = "Agentic tool-use loop (SWE-agent/AutoGen style) via optional backend proxy."

    def __init__(self, base_url: str = "http://localhost:3001") -> None:
        self._base_url = base_url.rstrip("/")

    def run(self, opts: RunOptions, cb: OrchestrationCallbacks) -> None:
        cb.on_pipeline("researching", "researcher", "Tool-Loop: checking backend...")
        status_url = f"{self._base_url}/api/tool-loop/status"
        run_url = f"{self._base_url}/api/tool-loop/run"

        if is_proxy_integration_available(status_url):
            run_via_proxy_sse(run_url, opts, cb)
            return

        cb.on_pipeline("researching", "researcher", "Tool-Loop backend unavailable - using Python fallback")
        fallback_builder_run(opts, cb)

    def run_quick_action(self, opts: RunOptions, cb: OrchestrationCallbacks, agent: str) -> None:
        fallback_quick_action(opts, cb, agent)


tool_loop_engine_adapter = ToolLoopEngineAdapter()
