"""Minimal API-style handlers for planner -> GitHub agent integration."""

from typing import Any

from agents.github_agent import GithubAgent
from agents.planner_agent import PlannerAgent


def build_project(user_prompt: str, workspace: str = "workspace") -> dict[str, Any]:
    planner_agent = PlannerAgent()
    planner_output: dict[str, Any] = planner_agent.analyze(user_prompt)

    github_agent = GithubAgent(workspace=workspace)
    result: dict[str, Any] = github_agent.run_with_plan(
        planner_output=planner_output,
        project_description=user_prompt,
    )

    return {
        "planner_output": planner_output,
        "repositories": result.get("repositories_selected", []),
        "component_registry": result.get("component_registry", {}),
        "extracted_modules": result.get("extracted_modules", []),
    }
