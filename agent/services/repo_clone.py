from pathlib import Path

from agent.cloner import RepositoryCloner
from config.settings import Settings


def clone_repositories(repos: list[dict], workspace: str = "workspace") -> dict[str, str]:
    cloner = RepositoryCloner(Settings(workspace=workspace))
    cloned = cloner.clone_all(repos)
    return {name: str(path) for name, path in cloned.items()}


def clone_repository(repo_url: str, workspace: str = "workspace") -> str | None:
    cloner = RepositoryCloner(Settings(workspace=workspace))
    name = repo_url.rstrip("/").split("/")[-2:]
    repo_name = f"{name[0]}/{name[1].replace('.git', '')}" if len(name) == 2 else repo_url
    fake_repo = {"name": repo_name, "clone_url": repo_url}
    path = cloner.clone_one(fake_repo)
    return str(Path(path)) if path else None
