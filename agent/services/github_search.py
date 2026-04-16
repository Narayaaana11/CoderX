from agent.searcher import GitHubSearcher
from config.settings import Settings


def search_repositories(project_description: str, modules: list[str] | None = None, workspace: str = "workspace") -> list[dict]:
    settings = Settings(workspace=workspace)
    searcher = GitHubSearcher(settings)
    return searcher.search(project_description, modules=modules or [])
