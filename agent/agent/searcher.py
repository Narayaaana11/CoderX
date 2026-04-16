"""
agent/searcher.py
-----------------
Derives smart search queries from a project description and calls
the GitHub Search API to retrieve candidate repositories.
"""

import re
import time
import logging
import requests

from config.settings import Settings

logger = logging.getLogger("GitHubAgent.Searcher")

# ── Keyword mappings for common stacks / features ──────────────────────────
STACK_KEYWORDS = {
    "mern":       ["mern stack", "mongo express react node"],
    "mean":       ["mean stack", "angular node express"],
    "django":     ["django rest framework", "django backend"],
    "fastapi":    ["fastapi python", "fastapi rest api"],
    "nextjs":     ["nextjs fullstack", "next.js app"],
    "flutter":    ["flutter mobile app", "flutter dart"],
    "react":      ["react frontend", "react app"],
    "vue":        ["vue.js frontend", "vuejs application"],
    "spring":     ["spring boot java", "spring rest api"],
}

FEATURE_KEYWORDS = {
    "auth":           ["authentication jwt", "login register system"],
    "authentication": ["auth system", "jwt authentication"],
    "dashboard":      ["admin dashboard", "analytics dashboard"],
    "admin":          ["admin panel", "admin dashboard"],
    "payment":        ["stripe payment", "payment gateway integration"],
    "chat":           ["realtime chat", "websocket chat"],
    "job":            ["job board", "job portal"],
    "ecommerce":      ["ecommerce store", "online shop react"],
    "blog":           ["blog platform", "cms blog"],
    "social":         ["social network", "social media app"],
}


class GitHubSearcher:
    """
    Derives search queries from a natural-language project description
    and queries the GitHub Search API.
    """

    BASE_REPO_URL = "https://api.github.com/search/repositories"
    BASE_CODE_URL = "https://api.github.com/search/code"

    def __init__(self, settings: Settings):
        self.settings = settings

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def search(
        self,
        project_description: str,
        modules: list[str] | None = None,
    ) -> list[dict]:
        """
        Generate queries, hit the GitHub API, deduplicate, and return
        a flat list of repository dicts sorted by stars.
        """
        queries = self._derive_queries(project_description, modules or [])
        logger.info("Derived %d search queries: %s", len(queries), queries)

        seen_ids: set[int] = set()
        all_repos: list[dict] = []

        for query in queries[: self.settings.max_queries]:
            repos = self._api_search(query)
            for repo in repos:
                if repo["id"] not in seen_ids:
                    seen_ids.add(repo["id"])
                    all_repos.append(self._normalise(repo))
            time.sleep(0.5)  # be polite to the API

        can_use_code_search = self.settings.github_token or self.settings.allow_unauthenticated_code_search
        if self.settings.enable_file_level_search and can_use_code_search:
            file_queries = self._derive_file_queries(project_description, modules or [])
            logger.info("Derived %d file-level queries: %s", len(file_queries), file_queries)
            for query in file_queries[: self.settings.max_file_search_queries]:
                repos = self._api_code_search(query)
                for repo in repos:
                    if repo["id"] not in seen_ids:
                        seen_ids.add(repo["id"])
                        all_repos.append(self._normalise(repo))
                time.sleep(0.5)
        elif self.settings.enable_file_level_search and not can_use_code_search:
            logger.info("Skipping file-level code search (no GitHub token configured)")

        all_repos.sort(key=lambda r: r["stars"], reverse=True)
        return all_repos

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _derive_queries(self, description: str, modules: list[str]) -> list[str]:
        lower = description.lower()
        queries: list[str] = []

        for module in modules:
            mod_clean = module.strip().lower()
            if mod_clean:
                queries.append(f"{mod_clean} starter")
                queries.append(f"{mod_clean} implementation")

        # Match known stacks
        for keyword, search_terms in STACK_KEYWORDS.items():
            if keyword in lower:
                queries.extend(search_terms[:1])

        # Match known features
        for keyword, search_terms in FEATURE_KEYWORDS.items():
            if keyword in lower:
                queries.extend(search_terms[:1])

        # Fallback: extract meaningful nouns / noun phrases
        if not queries:
            tokens = re.findall(r"\b[a-z]{3,}\b", lower)
            stop = {"with", "and", "the", "for", "that", "this", "from", "build", "create", "make", "using"}
            keywords = [t for t in tokens if t not in stop][:6]
            queries.append(" ".join(keywords[:4]))
            queries.append(" ".join(keywords[2:6]))

        # Always add a broad combined query
        queries.append(description[:60])
        return list(dict.fromkeys(queries))  # deduplicate while preserving order

    def _derive_file_queries(self, description: str, modules: list[str]) -> list[str]:
        lower = description.lower()
        queries: list[str] = []

        file_hints: list[str] = []
        for module in modules:
            mod = module.lower()
            if "auth" in mod:
                file_hints.extend(["filename:login", "filename:auth", "filename:register"])
            elif "dashboard" in mod:
                file_hints.extend(["filename:dashboard", "filename:sidebar"])
            elif "job" in mod:
                file_hints.extend(["filename:job", "filename:jobs", "filename:listing"])
            else:
                token = re.sub(r"[^a-z0-9_-]", "", mod)
                if token:
                    file_hints.append(f"filename:{token}")

        if "react" in lower or "mern" in lower or "next" in lower:
            file_hints.append("extension:tsx")
        if "python" in lower or "django" in lower or "fastapi" in lower:
            file_hints.append("extension:py")
        if "node" in lower or "express" in lower:
            file_hints.append("extension:js")

        for hint in list(dict.fromkeys(file_hints)):
            queries.append(f"{hint} authentication")
            queries.append(f"{hint} dashboard")

        if not queries:
            queries.append("filename:app extension:ts")
            queries.append("filename:app extension:py")

        return list(dict.fromkeys(queries))

    def _api_search(self, query: str) -> list[dict]:
        params = {
            "q": query,
            "sort": "stars",
            "order": "desc",
            "per_page": self.settings.results_per_query,
        }
        try:
            resp = requests.get(
                self.BASE_REPO_URL,
                headers=self.settings.github_api_headers,
                params=params,
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])
            logger.debug("Query '%s' → %d results", query, len(items))
            return items
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                logger.warning("Rate limit hit — sleeping 60s …")
                time.sleep(60)
                return self._api_search(query)
            logger.error("HTTP error for query '%s': %s", query, e)
            return []
        except requests.exceptions.RequestException as e:
            logger.error("Request failed for query '%s': %s", query, e)
            return []

    def _api_code_search(self, query: str) -> list[dict]:
        if not self.settings.github_token and not self.settings.allow_unauthenticated_code_search:
            return []

        params = {
            "q": query,
            "sort": "indexed",
            "order": "desc",
            "per_page": min(self.settings.results_per_query, 20),
        }
        try:
            resp = requests.get(
                self.BASE_CODE_URL,
                headers=self.settings.github_api_headers,
                params=params,
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])
            repos = []
            for item in items:
                repo = item.get("repository")
                if repo:
                    repos.append(repo)
            logger.debug("Code query '%s' -> %d repos", query, len(repos))
            return repos
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                logger.warning("Code-search rate limit hit — sleeping 60s …")
                time.sleep(60)
                return self._api_code_search(query)
            logger.error("Code-search HTTP error for query '%s': %s", query, e)
            return []
        except requests.exceptions.RequestException as e:
            logger.error("Code-search request failed for query '%s': %s", query, e)
            return []

    @staticmethod
    def _normalise(raw: dict) -> dict:
        return {
            "id":          raw["id"],
            "name":        raw["full_name"],
            "description": raw.get("description") or "",
            "stars":       raw.get("stargazers_count", 0),
            "forks":       raw.get("forks_count", 0),
            "language":    raw.get("language") or "Unknown",
            "clone_url":   raw["clone_url"],
            "html_url":    raw["html_url"],
            "pushed_at":   raw.get("pushed_at", ""),
            "topics":      raw.get("topics", []),
            "license":     (raw.get("license") or {}).get("spdx_id", ""),
        }
