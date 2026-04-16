from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Optional, cast

import requests

from .types import OrchestrationCallbacks, RunFn, RunOptions, RunQuickActionFn


def _emit_sse_event(event: Dict[str, Any], cb: OrchestrationCallbacks) -> bool:
    event_type = str(event.get("type") or event.get("event") or "").lower()

    if event_type in {"token", "answer", "message"}:
        cb.on_token(
            str(event.get("content") or event.get("answer") or event.get("message") or ""),
            str(event.get("agent") or "coder"),
        )
        return False

    if event_type in {"observation", "log"}:
        cb.on_token(f"\n> {str(event.get('content') or event.get('message') or '')}\n", "researcher")
        return False

    if event_type == "files" and isinstance(event.get("files"), list):
        cb.on_files(event["files"])
        return False

    if event_type == "stage":
        cb.on_pipeline(
            str(event.get("stage") or "iterating"),
            str(event.get("agent")) if event.get("agent") else None,
            str(event.get("progress")) if event.get("progress") else None,
        )
        return False

    if event_type == "error":
        cb.on_error(str(event.get("message") or event.get("content") or "Unknown integration error"))
        return True

    if event_type in {"complete", "done", "message_end"}:
        cb.on_pipeline("complete")
        cb.on_complete()
        return True

    return False


def is_proxy_integration_available(status_url: str, timeout_seconds: float = 1.5) -> bool:
    try:
        response = requests.get(status_url, timeout=timeout_seconds)
        if not response.ok:
            return False
        payload = cast(Dict[str, Any], response.json() if response.content else {})
        available = payload.get("available", True)
        return bool(available)
    except Exception:
        return False


def run_via_proxy_sse(
    run_url: str,
    opts: RunOptions,
    cb: OrchestrationCallbacks,
    extra_body: Optional[Dict[str, Any]] = None,
    timeout_seconds: float = 120.0,
) -> None:
    body: Dict[str, Any] = {
        "prompt": opts.prompt,
        "projectFiles": opts.project_files,
        "provider": opts.provider,
        "model": opts.model,
        "apiKey": opts.api_key,
        "conversationHistory": list(opts.conversation_history),
    }
    if extra_body:
        body.update(extra_body)

    response = requests.post(run_url, json=body, stream=True, timeout=timeout_seconds)
    if not response.ok:
        raise RuntimeError(f"Integration backend error ({run_url}): {response.status_code}")

    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue
        if not raw_line.startswith("data: "):
            continue

        raw = raw_line[6:].strip()
        if not raw or raw == "[DONE]":
            cb.on_pipeline("complete")
            cb.on_complete()
            return

        try:
            event = json.loads(raw)
            if isinstance(event, dict):
                completed = _emit_sse_event(cast(Dict[str, Any], event), cb)
                if completed:
                    return
            else:
                cb.on_token(raw, "coder")
        except json.JSONDecodeError:
            cb.on_token(raw, "coder")

    cb.on_pipeline("complete")
    cb.on_complete()


@dataclass
class ProxyAdapterConfig:
    adapter_id: str
    label: str
    description: str
    api_path: str
    availability_label: str
    fallback_label: str
    extra_body: Optional[Dict[str, Any]] = None


class ProxyBackedAdapter:
    def __init__(
        self,
        config: ProxyAdapterConfig,
        fallback_runner: RunFn,
        quick_action_runner: Optional[RunQuickActionFn] = None,
        base_url: str = "http://localhost:3001",
    ) -> None:
        self.id = config.adapter_id
        self.label = config.label
        self.description = config.description
        self._config = config
        self._fallback_runner = fallback_runner
        self._quick_action_runner = quick_action_runner
        self._base_url = base_url.rstrip("/")

    def run(self, opts: RunOptions, cb: OrchestrationCallbacks) -> None:
        status_url = f"{self._base_url}{self._config.api_path}/status"
        run_url = f"{self._base_url}{self._config.api_path}/run"

        cb.on_pipeline("researching", "researcher", f"{self._config.availability_label}: checking backend...")
        available = is_proxy_integration_available(status_url)

        if not available:
            cb.on_pipeline(
                "researching",
                "researcher",
                f"{self._config.fallback_label} - using CoderX builder fallback",
            )
            self._fallback_runner(opts, cb)
            return

        run_via_proxy_sse(run_url, opts, cb, self._config.extra_body)

    def run_quick_action(self, opts: RunOptions, cb: OrchestrationCallbacks, agent: str) -> None:
        if self._quick_action_runner:
            self._quick_action_runner(opts, cb, agent)
            return
        self._fallback_runner(opts, cb)
