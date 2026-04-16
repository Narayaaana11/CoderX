from pathlib import Path

from agent.extractor import CodeExtractor
from config.settings import Settings


class ExtractorAgent:
    def __init__(self, workspace: str = "workspace"):
        self._extractor = CodeExtractor(Settings(workspace=workspace))

    def extract(self, cloned_paths: dict[str, str], analyses: dict[str, dict]) -> dict:
        normalized = {repo: Path(path) for repo, path in cloned_paths.items()}
        return self._extractor.extract_all(normalized, analyses)
