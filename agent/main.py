import sys
import logging

from agents.idea_agent import IdeaAgent
from agents.planner_agent import PlannerAgent
from agents.github_agent import GithubAgent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)


def main():
    # Accept project description from CLI arg or use the default example
    if len(sys.argv) > 1:
        project_description = " ".join(sys.argv[1:])
    else:
        project_description = (
            "Build a MERN stack job portal with authentication, "
            "user profiles, job listings, and an admin dashboard"
        )

    print("\n" + "═" * 65)
    print("  CoderX — GitHub Intelligence Agent")
    print("═" * 65)
    print(f"  Project: {project_description}")
    print("═" * 65 + "\n")

    # Idea -> Planner -> GitHub Agent pipeline
    idea_agent = IdeaAgent()
    planner_agent = PlannerAgent()
    github_agent = GithubAgent(workspace="workspace")

    idea = idea_agent.analyze(project_description)
    planner_output = planner_agent.analyze(idea.normalized_prompt)
    result = github_agent.run_with_plan(
        planner_output=planner_output,
        project_description=idea.normalized_prompt,
    )

    # Pretty-print summary
    print("\n" + "═" * 65)
    print("  AGENT OUTPUT SUMMARY")
    print("═" * 65)
    print(f"  Planner modules:       {', '.join(planner_output.get('modules', [])) or 'none'}")
    print(f"  Repositories found:    {result['repositories_found']}")
    print(f"  Repositories selected: {len(result['repositories_selected'])}")
    print(f"  Modules extracted:     {len(result['extracted_modules'])}")

    print("\n  Selected Repositories:")
    for repo in result["repositories_selected"]:
        print(f"    • {repo['name']:45s} ★{repo['stars']:<6} [{repo['stack']}]")

    print("\n  Extracted Modules:")
    for mod in result["extracted_modules"]:
        print(f"    • {mod}")

    if result.get("suggested_for_project"):
        print("\n  Suggested for This Project:")
        for sug in result["suggested_for_project"]:
            print(f"    ✔ {sug}")

    print("\n  Full output saved to: workspace/github_agent_output.json")
    print("═" * 65 + "\n")

    return result


if __name__ == "__main__":
    main()


def build_project(user_prompt: str) -> dict:
    """Convenience integration entrypoint used by parent CoderX pipeline."""
    planner_output = PlannerAgent().analyze(user_prompt)
    github_agent = GithubAgent(workspace="workspace")
    result = github_agent.run_with_plan(
        planner_output=planner_output,
        project_description=user_prompt,
    )
    return {
        "planner_output": planner_output,
        "repositories": result.get("repositories_selected", []),
        "component_registry": result.get("component_registry", {}),
        "extracted_modules": result.get("extracted_modules", []),
    }
