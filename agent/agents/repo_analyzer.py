from agent.analyzer import RepositoryAnalyzer
from config.settings import Settings


class RepoAnalyzerAgent:
    def __init__(self, workspace: str = "workspace"):
        self._analyzer = RepositoryAnalyzer(Settings(workspace=workspace))

    def analyze(self, repo_path: str) -> dict:
        from pathlib import Path

        return self._analyzer.analyze(Path(repo_path))
