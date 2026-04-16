"""
agent/selector.py
-----------------
Filters and ranks candidate repositories before cloning.
Applies star threshold, language filter, recency check, and a
composite quality score to select the best candidates.
"""

import logging
from datetime import datetime, timezone

from config.settings import Settings

logger = logging.getLogger("GitHubAgent.Selector")


class RepositorySelector:
    """
    Applies configurable filters and a composite scoring model to
    reduce the raw search results to a shortlist worth cloning.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def select(self, repos: list[dict], required_modules: list[str] | None = None, project_description: str = "") -> list[dict]:
        """
        Filter repositories and return the top-N by quality score.
        Also tags each repo with a `detected_stack` field.
        """
        filtered = [r for r in repos if self._passes_filters(r)]
        logger.info("%d/%d repos pass filters", len(filtered), len(repos))

        relevance_source = " ".join(required_modules or []) + " " + project_description

        for repo in filtered:
            repo["quality_score"]   = self._score(repo)
            repo["detected_stack"]  = self._detect_stack(repo)
            repo["relevance_score"] = self._relevance_score(repo, relevance_source)
            repo["quality_score"] = round(repo["quality_score"] + repo["relevance_score"], 2)

        ranked = sorted(filtered, key=lambda r: r["quality_score"], reverse=True)
        selected = ranked[: self.settings.effective_max_repos_to_clone()]
        logger.info("Top %d repos selected", len(selected))
        for r in selected:
            logger.info(
                "  %-40s  ★%5d  score=%.1f  stack=%s",
                r["name"], r["stars"], r["quality_score"], r["detected_stack"],
            )
        return selected

    # ------------------------------------------------------------------
    # Filters
    # ------------------------------------------------------------------

    def _passes_filters(self, repo: dict) -> bool:
        # Star threshold
        if repo["stars"] < self.settings.min_stars:
            return False

        # Language filter
        lang = repo.get("language", "")
        if lang and lang not in self.settings.allowed_languages:
            return False

        # Recency (pushed_at)
        pushed_at = repo.get("pushed_at", "")
        if pushed_at:
            try:
                pushed = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
                age_days = (datetime.now(timezone.utc) - pushed).days
                if age_days > self.settings.max_repo_age_days:
                    return False
            except ValueError:
                pass  # can't parse date → allow through

        # Repository size guardrail (GitHub API returns size in KB)
        size_kb = repo.get("size", 0)
        if isinstance(size_kb, int) and size_kb > self.settings.max_repo_size_kb:
            return False

        # Allowlist licenses only (if license is provided)
        license_name = (repo.get("license") or "").strip()
        if license_name and license_name not in self.settings.allowed_licenses:
            return False

        return True

    # ------------------------------------------------------------------
    # Scoring model
    # ------------------------------------------------------------------

    def _score(self, repo: dict) -> float:
        """
        Composite quality score (0–100).

        Weights
        -------
        40% stars (log-normalised)
        20% forks ratio
        20% recency
        10% has license
        10% has topics
        """
        import math

        stars  = repo.get("stars", 0)
        forks  = repo.get("forks", 0)
        pushed = repo.get("pushed_at", "")

        # Stars score (log scale, cap at 10 000 stars → full marks)
        star_score = min(math.log1p(stars) / math.log1p(10_000), 1.0) * 40

        # Fork ratio score
        fork_ratio  = forks / max(stars, 1)
        fork_score  = min(fork_ratio * 2, 1.0) * 20

        # Recency score
        recency_score = 0.0
        if pushed:
            try:
                pushed_dt = datetime.fromisoformat(pushed.replace("Z", "+00:00"))
                age_days  = (datetime.now(timezone.utc) - pushed_dt).days
                recency_score = max(0, 1 - age_days / self.settings.max_repo_age_days) * 20
            except ValueError:
                pass

        # License bonus
        license_score = 10.0 if repo.get("license") else 0.0

        # Topics bonus
        topics_score  = min(len(repo.get("topics", [])) * 2, 10.0)

        return round(star_score + fork_score + recency_score + license_score + topics_score, 2)

    def _relevance_score(self, repo: dict, query_text: str) -> float:
        if not query_text.strip():
            return 0.0

        text = " ".join([
            repo.get("name", ""),
            repo.get("description", ""),
            " ".join(repo.get("topics", [])),
        ]).lower()

        tokens = [t for t in query_text.lower().split() if len(t) >= 3]
        if not tokens:
            return 0.0

        matches = sum(1 for token in tokens if token in text)
        ratio = matches / len(tokens)
        return min(ratio * 20, 20)

    # ------------------------------------------------------------------
    # Stack detection
    # ------------------------------------------------------------------

    STACK_SIGNALS = {
        "MERN":    ["mern", "mongo", "mongodb", "express", "react", "node"],
        "MEAN":    ["mean", "angular", "express", "mongo"],
        "NextJS":  ["next.js", "nextjs", "next"],
        "Django":  ["django", "python"],
        "FastAPI": ["fastapi", "fast-api"],
        "Spring":  ["spring", "java"],
        "Flutter": ["flutter", "dart"],
        "Vue":     ["vue", "vuejs"],
        "React":   ["react"],
        "Node":    ["nodejs", "node.js", "express"],
    }

    def _detect_stack(self, repo: dict) -> str:
        text = " ".join([
            repo.get("name", ""),
            repo.get("description", ""),
            " ".join(repo.get("topics", [])),
        ]).lower()

        for stack, signals in self.STACK_SIGNALS.items():
            if any(sig in text for sig in signals):
                return stack
        return repo.get("language", "Unknown")
