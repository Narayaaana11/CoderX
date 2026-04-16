from dataclasses import dataclass


@dataclass
class IdeaAnalysis:
    normalized_prompt: str
    intent: str


class IdeaAgent:
    """Lightweight pre-planning normalizer."""

    def analyze(self, user_prompt: str) -> IdeaAnalysis:
        prompt = " ".join(user_prompt.strip().split())
        intent = "build_project" if prompt else "unknown"
        return IdeaAnalysis(normalized_prompt=prompt, intent=intent)
