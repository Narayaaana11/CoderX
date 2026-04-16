from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Protocol, Sequence, cast


@dataclass
class RunOptions:
    prompt: str
    project_files: Dict[str, str]
    provider: str
    model: str
    api_key: str = ""
    conversation_history: Sequence[Dict[str, str]] = field(
        default_factory=lambda: cast(List[Dict[str, str]], [])
    )
    project_id: Optional[str] = None
    temperature: Optional[float] = None
    max_repair_iterations: Optional[int] = None
    quick_action: Optional[str] = None


class OrchestrationCallbacks(Protocol):
    def on_token(self, token: str, agent_name: Optional[str] = None) -> None: ...

    def on_files(self, files: List[Dict[str, Any]]) -> None: ...

    def on_pipeline(
        self,
        stage: str,
        agent_name: Optional[str] = None,
        progress: Optional[str] = None,
    ) -> None: ...

    def on_complete(self) -> None: ...

    def on_error(self, error: str) -> None: ...


class EngineAdapter(Protocol):
    id: str
    label: str
    description: str

    def run(self, opts: RunOptions, cb: OrchestrationCallbacks) -> None: ...

    def run_quick_action(self, opts: RunOptions, cb: OrchestrationCallbacks, agent: str) -> None: ...


RunFn = Callable[[RunOptions, OrchestrationCallbacks], None]
RunQuickActionFn = Callable[[RunOptions, OrchestrationCallbacks, str], None]
