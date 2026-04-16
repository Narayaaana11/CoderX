import re
from typing import Any


class PlannerAgent:
    """Extracts likely modules from a project prompt.

    This is a pragmatic fallback planner. In production, replace with your LLM planner.
    """

    MODULE_HINTS = {
        "auth": ["auth", "authentication", "login", "signup", "register", "jwt"],
        "jobs": ["job", "listing", "career", "portal"],
        "dashboard": ["dashboard", "admin", "analytics"],
        "payments": ["payment", "stripe", "billing"],
        "chat": ["chat", "realtime", "socket", "websocket"],
        "profile": ["profile", "account", "user"],
    }

    def analyze(self, user_prompt: str) -> dict[str, Any]:
        lower = user_prompt.lower()
        modules: list[str] = []

        for module, signals in self.MODULE_HINTS.items():
            if any(signal in lower for signal in signals):
                modules.append(module)

        if not modules:
            tokens = re.findall(r"[a-zA-Z]{4,}", lower)
            modules = list(dict.fromkeys(tokens[:4]))

        return {
            "prompt": user_prompt,
            "modules": modules,
        }
