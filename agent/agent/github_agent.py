"""
CoderX GitHub Intelligence Agent
=================================
Orchestrates search, selection, cloning, analysis, and extraction
of GitHub repositories for AI-driven application generation.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Any

from agent.searcher import GitHubSearcher
from agent.selector import RepositorySelector
from agent.cloner import RepositoryCloner
from agent.analyzer import RepositoryAnalyzer
from agent.extractor import CodeExtractor
from config.settings import Settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("GitHubAgent")


class GitHubAgent:
    """
    Top-level agent that coordinates all sub-modules to discover,
    analyze, and extract reusable code from GitHub repositories.

    Usage
    -----
    agent = GitHubAgent(github_token="ghp_...")
    result = agent.run("Build a MERN job portal with auth and admin dashboard")
    """

    def __init__(self, github_token: str | None = None, workspace: str = "workspace"):
        self.settings = Settings(github_token=github_token, workspace=workspace)
        self.searcher  = GitHubSearcher(self.settings)
        self.selector  = RepositorySelector(self.settings)
        self.cloner    = RepositoryCloner(self.settings)
        self.analyzer  = RepositoryAnalyzer(self.settings)
        self.extractor = CodeExtractor(self.settings)
        logger.info("GitHubAgent initialised — workspace: %s", workspace)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, project_description: str) -> dict[str, Any]:
        """
        Full pipeline: search → select → clone → analyse → extract.

        Parameters
        ----------
        project_description : str
            Natural-language description of the project (from Planning Agent).

        Returns
        -------
        dict  Structured output ready for the Code Generator Agent.
        """
        logger.info("▶ Starting GitHub Agent pipeline")
        logger.info("Project: %s", project_description)

        return self.run_with_plan(
            planner_output={"modules": []},
            project_description=project_description,
        )

    def run_with_plan(self, planner_output: dict[str, Any], project_description: str = "") -> dict[str, Any]:
        """
        Planner-integrated pipeline entrypoint.

        Parameters
        ----------
        planner_output : dict
            Expected shape: {"modules": ["auth", "jobs", ...]}.
        project_description : str
            Full project description from Idea/Planner stage.
        """
        modules = self._extract_modules(planner_output)
        if not project_description:
            project_description = " ".join(modules)

        logger.info("▶ Starting GitHub Agent pipeline")
        logger.info("Project: %s", project_description)
        logger.info("Planner modules: %s", modules)

        # 1. Search
        logger.info("── Step 1/5: Searching GitHub repositories …")
        all_repos = self.search_repositories(modules, project_description)
        logger.info("   Found %d repositories", len(all_repos))

        # 2. Select
        logger.info("── Step 2/5: Filtering & ranking repositories …")
        selected_repos = self.rank_repositories(all_repos, modules, project_description)
        logger.info("   Selected %d repositories", len(selected_repos))

        # 3. Clone
        logger.info("── Step 3/5: Cloning repositories …")
        cloned_paths = self.cloner.clone_all(selected_repos)
        logger.info("   Cloned %d repositories", len(cloned_paths))

        # 4. Analyse
        logger.info("── Step 4/5: Analysing repository structures …")
        analyses = {}
        for repo, path in cloned_paths.items():
            analyses[repo] = self.analyzer.analyze(path)

        # 5. Extract
        logger.info("── Step 5/5: Extracting reusable modules …")
        registry = self.extractor.extract_all(cloned_paths, analyses)

        # Build structured output
        output = self._build_output(
            project_description,
            all_repos,
            selected_repos,
            cloned_paths,
            analyses,
            registry,
            modules,
        )

        # Persist to disk
        out_path = Path(self.settings.workspace) / "github_agent_output.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(output, f, indent=2, default=str)

        logger.info("✔ Pipeline complete — output saved to %s", out_path)
        return output

    def search_repositories(self, modules: list[str], project_description: str = "") -> list[dict]:
        query_seed = project_description or " ".join(modules)
        return self.searcher.search(query_seed, modules=modules)

    def rank_repositories(
        self,
        repos: list[dict],
        modules: list[str],
        project_description: str = "",
    ) -> list[dict]:
        return self.selector.select(
            repos,
            required_modules=modules,
            project_description=project_description,
        )

    def clone(self, repo_url: str) -> str | None:
        """Clone a single repository URL and return local path."""
        fake_repo = {
            "name": self._repo_name_from_url(repo_url),
            "clone_url": repo_url,
        }
        path = self.cloner.clone_one(fake_repo)
        return str(path) if path else None

    def extract_components(self, repos: list[dict], project_description: str = "") -> dict[str, Any]:
        """Search/rank/clone/analyze/extract from a repository candidate list."""
        selected = self.rank_repositories(repos, modules=[], project_description=project_description)
        cloned_paths = self.cloner.clone_all(selected)
        analyses = {repo: self.analyzer.analyze(path) for repo, path in cloned_paths.items()}
        return self.extractor.extract_all(cloned_paths, analyses)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_output(
        self,
        description: str,
        all_repos: list,
        selected_repos: list,
        cloned_paths: dict,
        analyses: dict,
        registry: dict,
        modules: list[str],
    ) -> dict[str, Any]:
        return {
            "meta": {
                "project_description": description,
                "planner_modules": modules,
                "generated_at": datetime.utcnow().isoformat(),
                "agent_version": "1.0.0",
            },
            "repositories_found": len(all_repos),
            "repositories_selected": [
                {
                    "name": r["name"],
                    "stars": r["stars"],
                    "forks": r["forks"],
                    "language": r["language"],
                    "description": r.get("description", ""),
                    "clone_url": r["clone_url"],
                    "stack": r.get("detected_stack", "unknown"),
                    "local_path": str(cloned_paths.get(r["name"], "")),
                }
                for r in selected_repos
            ],
            "repository_analyses": analyses,
            "component_registry": registry,
            "extracted_modules": list(registry.get("components", {}).keys())
            + list(registry.get("backend_modules", {}).keys()),
            "suggested_for_project": self._suggest(registry, description),
        }

    @staticmethod
    def _extract_modules(planner_output: dict[str, Any]) -> list[str]:
        raw = planner_output.get("modules", []) if isinstance(planner_output, dict) else []
        modules: list[str] = []
        for item in raw:
            if isinstance(item, str):
                modules.append(item)
            elif isinstance(item, dict):
                name = item.get("name")
                if isinstance(name, str) and name.strip():
                    modules.append(name.strip())
        return modules

    @staticmethod
    def _repo_name_from_url(url: str) -> str:
        clean = url.rstrip("/")
        if clean.endswith(".git"):
            clean = clean[:-4]
        parts = clean.split("/")
        if len(parts) >= 2:
            return f"{parts[-2]}/{parts[-1]}"
        return parts[-1] if parts else "unknown/unknown"

    def _suggest(self, registry: dict, description: str) -> list[str]:
        """Heuristic: return module names that overlap with description keywords."""
        keywords = set(description.lower().split())
        suggestions = []
        for category in registry.values():
            if isinstance(category, dict):
                for name in category:
                    if any(kw in name for kw in keywords):
                        suggestions.append(name)
        return suggestions or list(registry.get("components", {}).keys())[:3]
