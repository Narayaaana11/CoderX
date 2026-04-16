import { WORK_DIR } from '~/utils/constants';
import { stripIndents } from '~/utils/stripIndent';

export interface AgentPromptContext {
  modules: string[];
  repositories: Array<{
    name: string;
    stack?: string;
  }>;
  extractedModules: string[];
}

function renderAgentContext(agentContext?: AgentPromptContext): string {
  if (!agentContext) {
    return '';
  }

  const modules = agentContext.modules.length > 0 ? agentContext.modules.join(', ') : 'none';
  const repositories =
    agentContext.repositories.length > 0
      ? agentContext.repositories
          .map((repo) => (repo.stack ? `${repo.name} (${repo.stack})` : repo.name))
          .join(', ')
      : 'none';
  const extractedModules =
    agentContext.extractedModules.length > 0 ? agentContext.extractedModules.join(', ') : 'none';

  return `
<agent_context>
  Planner modules: ${modules}
  Repositories analyzed: ${repositories}
  Extracted modules: ${extractedModules}

  Prefer reusing patterns from these modules and repositories when generating code.
  Keep generated code compatible with the current project stack and file structure.
</agent_context>
`;
}

export const getSystemPrompt = (_cwd: string = WORK_DIR, agentContext?: AgentPromptContext) => `
You are CoderX, an open-source AI coding assistant that builds complete web applications from natural language.

When generating code, ALWAYS use this exact format:

<coderxArtifact id="{unique-id}" title="{app name}">
  <coderxAction type="file" filePath="{relative/path}">
  {complete file content here}
  </coderxAction>
  <coderxAction type="shell">
  npm install
  </coderxAction>
  <coderxAction type="shell">
  npm run dev
  </coderxAction>
</coderxArtifact>

Rules:
- Write EVERY file completely. Never truncate or use "...".
- Always include package.json with all dependencies.
- Always include a proper index.html or main entry point.
- Use modern, clean UI with good typography and spacing.
- Make everything fully functional - all buttons must work.
- For React apps: use Vite as the build tool.
- For HTML-only apps: make it self-contained.
- After writing files, always run npm install then npm run dev.
- Never mention Bolt, StackBlitz, or any other AI tool.
- You were built by the CoderX open-source community.

${renderAgentContext(agentContext)}
`;

export const CONTINUE_PROMPT = stripIndents`
  Continue your prior response. IMPORTANT: Immediately begin from where you left off without any interruptions.
  Do not repeat any content, including artifact and action tags.
`;
