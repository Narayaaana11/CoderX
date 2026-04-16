"""
agent/extractor.py
------------------
Extracts reusable modules from cloned repositories and builds a
structured component registry for downstream CoderX agents.
"""

import json
import logging
import shutil
from pathlib import Path
from typing import Any

from config.settings import Settings

logger = logging.getLogger("GitHubAgent.Extractor")


# ── Component category rules ────────────────────────────────────────────────

COMPONENT_RULES: dict[str, dict] = {
    # Frontend components
    "login_form":          {"keywords": ["login", "signin", "sign-in"],       "exts": [".jsx", ".tsx", ".vue", ".html"]},
    "register_form":       {"keywords": ["register", "signup", "sign-up"],    "exts": [".jsx", ".tsx", ".vue"]},
    "dashboard_layout":    {"keywords": ["dashboard"],                         "exts": [".jsx", ".tsx", ".vue"]},
    "sidebar":             {"keywords": ["sidebar", "side-bar", "sidenav"],    "exts": [".jsx", ".tsx", ".vue", ".css"]},
    "navbar":              {"keywords": ["navbar", "nav", "header", "topbar"], "exts": [".jsx", ".tsx", ".vue"]},
    "job_listing_card":    {"keywords": ["job", "listing", "card"],            "exts": [".jsx", ".tsx", ".vue"]},
    "data_table":          {"keywords": ["table", "datagrid", "datatable"],    "exts": [".jsx", ".tsx", ".vue"]},
    "modal":               {"keywords": ["modal", "dialog", "popup"],          "exts": [".jsx", ".tsx", ".vue"]},
    "profile_page":        {"keywords": ["profile", "account", "user"],        "exts": [".jsx", ".tsx", ".vue"]},
    "search_bar":          {"keywords": ["search"],                            "exts": [".jsx", ".tsx", ".vue"]},
    "file_upload":         {"keywords": ["upload", "file"],                    "exts": [".jsx", ".tsx", ".vue"]},
    "chart_widget":        {"keywords": ["chart", "graph", "analytics"],       "exts": [".jsx", ".tsx"]},
}

BACKEND_RULES: dict[str, dict] = {
    "auth_controller":    {"keywords": ["auth", "login", "register", "jwt"],  "exts": [".js", ".ts", ".py", ".java"]},
    "user_model":         {"keywords": ["user", "account", "profile"],        "exts": [".js", ".ts", ".py", ".java"]},
    "job_api":            {"keywords": ["job"],                                "exts": [".js", ".ts", ".py"]},
    "middleware":         {"keywords": ["middleware", "protect", "guard"],     "exts": [".js", ".ts", ".py"]},
    "db_config":          {"keywords": ["database", "db", "mongoose", "pool"],"exts": [".js", ".ts", ".py"]},
    "email_service":      {"keywords": ["email", "mail", "nodemailer"],        "exts": [".js", ".ts", ".py"]},
    "file_storage":       {"keywords": ["storage", "s3", "cloudinary", "multer"], "exts": [".js", ".ts", ".py"]},
    "payment_gateway":    {"keywords": ["payment", "stripe", "paypal"],        "exts": [".js", ".ts", ".py"]},
    "socket_handler":     {"keywords": ["socket", "ws", "websocket"],          "exts": [".js", ".ts", ".py"]},
}

CONFIG_RULES: dict[str, dict] = {
    "env_template":       {"keywords": [".env.example", ".env.sample"],       "exts": [""]},
    "docker_config":      {"keywords": ["dockerfile", "docker-compose"],      "exts": [".yml", ".yaml", ""]},
    "ci_config":          {"keywords": [".github/workflows", ".travis", "ci"],"exts": [".yml", ".yaml"]},
}


class CodeExtractor:
    """
    Scans cloned repositories, matches files against component rules,
    copies matching files to the component registry, and returns a
    structured registry dict.
    """

    def __init__(self, settings: Settings):
        self.settings      = settings
        self.registry_root = Path(settings.component_registry_path)
        self.registry_root.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def extract_all(
        self,
        cloned_paths: dict[str, Path],
        analyses: dict[str, dict],
    ) -> dict[str, Any]:
        """
        Iterate over all cloned repos, extract components, and return the
        merged component registry.
        """
        registry: dict[str, Any] = {
            "components":      {},
            "backend_modules": {},
            "config_files":    {},
            "component_index": {},
        }

        for repo_name, repo_path in cloned_paths.items():
            logger.info("  Extracting from %s", repo_name)
            analysis = analyses.get(repo_name, {})
            self._extract_repo(repo_name, repo_path, analysis, registry)

        # Save registry manifest
        manifest_path = self.registry_root / "registry.json"
        with open(manifest_path, "w") as f:
            json.dump(registry, f, indent=2, default=str)

        # Compatibility manifest for direct generator lookup.
        components_manifest_path = self.registry_root / "components.json"
        with open(components_manifest_path, "w") as f:
            json.dump(registry.get("component_index", {}), f, indent=2, default=str)

        logger.info(
            "Component registry: %d components, %d backend modules, %d configs",
            len(registry["components"]),
            len(registry["backend_modules"]),
            len(registry["config_files"]),
        )
        return registry

    def extract_one(
        self, repo_name: str, repo_path: Path, analysis: dict
    ) -> dict:
        """Extract from a single repository (public API)."""
        registry: dict[str, Any] = {"components": {}, "backend_modules": {}, "config_files": {}, "component_index": {}}
        self._extract_repo(repo_name, repo_path, analysis, registry)
        return registry

    # ------------------------------------------------------------------
    # Private
    # ------------------------------------------------------------------

    def _extract_repo(
        self,
        repo_name: str,
        repo_path: Path,
        analysis: dict,
        registry: dict,
    ) -> None:
        safe_name = repo_name.replace("/", "__")

        if analysis.get("safety", {}).get("safe_to_extract") is False:
            logger.warning("  Skipping unsafe repository: %s", repo_name)
            return

        # Frontend components
        for component_key, rule in COMPONENT_RULES.items():
            matches = self._find_matches(repo_path, rule)
            if matches:
                dest_dir = self.registry_root / "components" / component_key
                dest_dir.mkdir(parents=True, exist_ok=True)
                copied = self._copy_files(matches, dest_dir, safe_name)
                if copied:
                    entry = registry["components"].setdefault(component_key, {})
                    entry[safe_name] = {
                        "source_repo":  repo_name,
                        "files":        [str(c.relative_to(self.registry_root)) for c in copied],
                        "framework":    analysis.get("frameworks", []),
                    }
                    self._add_component_index_entries(
                        registry,
                        category=component_key,
                        repo_name=repo_name,
                        framework=self._first_framework(analysis.get("frameworks", [])),
                        copied=copied,
                        matches=matches,
                    )

        # Backend modules
        for module_key, rule in BACKEND_RULES.items():
            matches = self._find_matches(repo_path, rule)
            if matches:
                dest_dir = self.registry_root / "backend_modules" / module_key
                dest_dir.mkdir(parents=True, exist_ok=True)
                copied = self._copy_files(matches, dest_dir, safe_name)
                if copied:
                    entry = registry["backend_modules"].setdefault(module_key, {})
                    entry[safe_name] = {
                        "source_repo": repo_name,
                        "files":       [str(c.relative_to(self.registry_root)) for c in copied],
                    }
                    self._add_component_index_entries(
                        registry,
                        category=module_key,
                        repo_name=repo_name,
                        framework=self._first_framework(analysis.get("frameworks", [])),
                        copied=copied,
                        matches=matches,
                    )

        # Config / infra files
        for config_key, rule in CONFIG_RULES.items():
            matches = self._find_matches(repo_path, rule)
            if matches:
                dest_dir = self.registry_root / "config_files" / config_key
                dest_dir.mkdir(parents=True, exist_ok=True)
                copied = self._copy_files(matches, dest_dir, safe_name)
                if copied:
                    entry = registry["config_files"].setdefault(config_key, {})
                    entry[safe_name] = {
                        "source_repo": repo_name,
                        "files":       [str(c.relative_to(self.registry_root)) for c in copied],
                    }

    def _find_matches(self, repo_path: Path, rule: dict) -> list[Path]:
        keywords = rule["keywords"]
        exts     = rule["exts"]
        results: list[Path] = []

        for f in repo_path.rglob("*"):
            if not f.is_file():
                continue
            name_lower = f.name.lower()
            # Skip minified / lock / node_modules
            if any(skip in str(f) for skip in ["node_modules", ".git", "dist/", "build/", ".min."]):
                continue
            name_match = any(kw in name_lower for kw in keywords)
            ext_match  = not exts or any(name_lower.endswith(e) for e in exts if e)
            if name_match and ext_match:
                results.append(f)
            if len(results) >= 5:  # cap per rule per repo
                break

        return results

    def _copy_files(self, sources: list[Path], dest_dir: Path, prefix: str) -> list[Path]:
        copied: list[Path] = []
        for src in sources:
            dst = dest_dir / f"{prefix}__{src.name}"
            try:
                shutil.copy2(src, dst)
                copied.append(dst)
            except Exception as e:
                logger.debug("Could not copy %s → %s: %s", src, dst, e)
        return copied

    @staticmethod
    def _first_framework(frameworks: list[str]) -> str:
        return frameworks[0] if frameworks else "unknown"

    def _add_component_index_entries(
        self,
        registry: dict,
        category: str,
        repo_name: str,
        framework: str,
        copied: list[Path],
        matches: list[Path],
    ) -> None:
        for idx, copied_file in enumerate(copied):
            source_path = str(matches[idx]).replace("\\", "/") if idx < len(matches) else ""
            key = f"{category}_{idx + 1}"
            if key in registry["component_index"]:
                key = f"{key}_{repo_name.replace('/', '_')}"

            registry["component_index"][key] = {
                "source_repo": repo_name,
                "path": source_path,
                "framework": framework,
                "extracted_path": str(copied_file.relative_to(self.registry_root)).replace("\\", "/"),
                "category": category,
            }
