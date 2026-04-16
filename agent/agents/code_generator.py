class CodeGeneratorAgent:
    """Adapter point for downstream generation stage.

    This class intentionally stays simple: it demonstrates how to consume the
    component registry produced by the GitHub agent.
    """

    def build_inputs(self, planner_output: dict, component_registry: dict) -> dict:
        return {
            "modules": planner_output.get("modules", []),
            "component_registry": component_registry,
        }
