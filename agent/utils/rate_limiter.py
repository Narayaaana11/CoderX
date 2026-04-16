"""
utils/rate_limiter.py
----------------------
Simple token-bucket rate limiter and GitHub API rate-limit checker.
"""

import time
import logging
import requests

logger = logging.getLogger("GitHubAgent.RateLimiter")


class RateLimiter:
    """
    Token-bucket rate limiter for controlling GitHub API call frequency.

    Parameters
    ----------
    calls_per_minute : int
        Maximum number of calls allowed per minute.
    """

    def __init__(self, calls_per_minute: int = 30):
        self.min_interval = 60.0 / calls_per_minute
        self._last_call   = 0.0

    def wait(self) -> None:
        """Block until the minimum inter-call interval has elapsed."""
        elapsed = time.monotonic() - self._last_call
        gap     = self.min_interval - elapsed
        if gap > 0:
            time.sleep(gap)
        self._last_call = time.monotonic()


def check_github_rate_limit(headers: dict) -> dict:
    """
    Query the GitHub API rate limit endpoint and return a summary dict.

    Returns
    -------
    dict with keys: limit, remaining, reset_at (ISO string), wait_seconds
    """
    try:
        resp = requests.get(
            "https://api.github.com/rate_limit",
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        data     = resp.json()
        core     = data.get("resources", {}).get("search", data.get("rate", {}))
        reset_ts = core.get("reset", 0)
        remaining = core.get("remaining", 0)
        wait_seconds = max(0, reset_ts - time.time()) if remaining == 0 else 0

        summary = {
            "limit":        core.get("limit", "?"),
            "remaining":    remaining,
            "reset_at":     time.strftime("%H:%M:%S", time.localtime(reset_ts)),
            "wait_seconds": int(wait_seconds),
        }
        logger.info("Rate limit — %d/%d remaining, resets at %s",
                    summary["remaining"], summary["limit"], summary["reset_at"])
        return summary
    except Exception as e:
        logger.warning("Could not fetch rate limit info: %s", e)
        return {}
