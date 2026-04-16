"""
config/settings.py
------------------
Centralised configuration for the GitHub Intelligence Agent.
All tuneable parameters live here so other modules stay clean.
"""

import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    # GitHub credentials
    github_token: str | None = None

    # Workspace paths
    workspace: str = "workspace"

    # Search settings
    max_queries: int = 4          # How many derived search queries to fire
    results_per_query: int = 10   # GitHub API results per query
    enable_file_level_search: bool = True
    # GitHub code search requires authentication for reliable usage.
    allow_unauthenticated_code_search: bool = False
    max_file_search_queries: int = 6

    # Selection filters
    min_stars: int = 50
    max_repos_to_clone: int = 5
    # Use a smaller clone budget when running without a GitHub token.
    max_repos_to_clone_no_token: int = 2
    # Repository size from GitHub API (in KB). Large repos slow clone/analyze significantly.
    max_repo_size_kb: int = 120000
    allowed_languages: list = field(default_factory=lambda: ["JavaScript", "TypeScript", "Python", "Go"])
    max_repo_age_days: int = 730  # 2 years
    allowed_licenses: list = field(default_factory=lambda: [
        "MIT",
        "Apache-2.0",
        "BSD-3-Clause",
        "BSD-2-Clause",
        "ISC",
        "MPL-2.0",
    ])

    # Cloning
    clone_depth: int = 1          # Shallow clone for speed
    clone_timeout_seconds: int = 120

    # Extraction
    component_registry_path: str = "component_registry"

    def __post_init__(self):
        # Prefer env var over constructor arg
        if not self.github_token:
            self.github_token = os.getenv("GITHUB_TOKEN")

    @property
    def repos_dir(self) -> str:
        return f"{self.workspace}/github_repos"

    def effective_max_repos_to_clone(self) -> int:
        if self.github_token:
            return self.max_repos_to_clone
        return self.max_repos_to_clone_no_token

    @property
    def github_api_headers(self) -> dict:
        headers = {"Accept": "application/vnd.github+json"}
        if self.github_token:
            headers["Authorization"] = f"Bearer {self.github_token}"
        return headers
