from pathlib import Path

from agent.analyzer import RepositoryAnalyzer
from agent.extractor import CodeExtractor
from config.settings import Settings


def analyze_repository(repo_path: str, workspace: str = "workspace") -> dict:
    analyzer = RepositoryAnalyzer(Settings(workspace=workspace))
    return analyzer.analyze(Path(repo_path))


def extract_components(cloned_paths: dict[str, str], analyses: dict[str, dict], workspace: str = "workspace") -> dict:
    extractor = CodeExtractor(Settings(workspace=workspace))
    normalized = {repo: Path(path) for repo, path in cloned_paths.items()}
    return extractor.extract_all(normalized, analyses)
