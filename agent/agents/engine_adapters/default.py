from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from .types import OrchestrationCallbacks, RunFn, RunOptions, RunQuickActionFn


def fallback_builder_run(opts: RunOptions, cb: OrchestrationCallbacks) -> None:
    cb.on_pipeline("researching", "researcher", "Running Python fallback builder pipeline")
    cb.on_token("[python-engine] Fallback pipeline selected. Provide concrete builder implementation to execute generation.\n", "researcher")
    cb.on_pipeline("complete")
    cb.on_complete()


def fallback_quick_action(opts: RunOptions, cb: OrchestrationCallbacks, agent: str) -> None:
    cb.on_pipeline("researching", agent or "coder", f"Quick action '{agent}' via Python fallback")
    cb.on_token("[python-engine] Quick action fallback executed.\n", agent or "coder")
    cb.on_pipeline("complete")
    cb.on_complete()


@dataclass
class CoderXEngineAdapter:
    id: str = "coderx"
    label: str = "CoderX Native (Python)"
    description: str = "Built-in orchestrator pipeline placeholder for Python runtime."
    run_fn: RunFn = fallback_builder_run
    run_quick_action_fn: RunQuickActionFn = fallback_quick_action

    def run(self, opts: RunOptions, cb: OrchestrationCallbacks) -> None:
        self.run_fn(opts, cb)

    def run_quick_action(self, opts: RunOptions, cb: OrchestrationCallbacks, agent: str) -> None:
        self.run_quick_action_fn(opts, cb, agent)


coderx_engine_adapter = CoderXEngineAdapter()


def run_coderx_by_mode(
    mode: str,
    opts: RunOptions,
    cb: OrchestrationCallbacks,
    mode_runners: Dict[str, RunFn] | None = None,
) -> None:
    runners = mode_runners or {}
    runner = runners.get(mode, runners.get("clarify", fallback_builder_run))
    runner(opts, cb)
