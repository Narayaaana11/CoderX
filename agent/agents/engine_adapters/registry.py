from __future__ import annotations

from typing import Dict, List

from .aider import aider_engine_adapter
from .autogen import autogen_engine_adapter
from .continue_dev import continue_engine_adapter
from .crewai import crewai_engine_adapter
from .default import coderx_engine_adapter
from .dify import dify_engine_adapter
from .gpt_engineer import gpt_engineer_adapter
from .langgraph import langgraph_engine_adapter
from .openhands import openhands_engine_adapter
from .swe_agent import swe_agent_engine_adapter
from .tool_loop import tool_loop_engine_adapter


_ADAPTERS: Dict[str, object] = {
    coderx_engine_adapter.id: coderx_engine_adapter,
    langgraph_engine_adapter.id: langgraph_engine_adapter,
    crewai_engine_adapter.id: crewai_engine_adapter,
    openhands_engine_adapter.id: openhands_engine_adapter,
    gpt_engineer_adapter.id: gpt_engineer_adapter,
    tool_loop_engine_adapter.id: tool_loop_engine_adapter,
    autogen_engine_adapter.id: autogen_engine_adapter,
    swe_agent_engine_adapter.id: swe_agent_engine_adapter,
    aider_engine_adapter.id: aider_engine_adapter,
    continue_engine_adapter.id: continue_engine_adapter,
    dify_engine_adapter.id: dify_engine_adapter,
}


def get_engine_adapter(backend: str):
    return _ADAPTERS.get(backend, coderx_engine_adapter)


def list_engine_adapters() -> List[object]:
    return list(_ADAPTERS.values())
