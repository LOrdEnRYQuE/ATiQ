import { useConfigStore } from "./configStore";
import { SYSTEM_PROMPT } from "./ai-system-prompt";

export function getActiveSystemPrompt(): string {
  const { prompt } = useConfigStore.getState();
  if (prompt?.active_prompt && typeof prompt.active_prompt === "string") {
    return prompt.active_prompt;
  }
  return SYSTEM_PROMPT;
}

export function getPromptVersion(): string | null {
  const { prompt } = useConfigStore.getState();
  return (prompt?.version && typeof prompt.version === "string") ? prompt.version : null;
}
