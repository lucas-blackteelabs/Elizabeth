# AI Agents

Three model-backed agents, all through Spring AI's `ChatClient`, all optional.

| Agent | Prompt | Output | Used by |
|---|---|---|---|
| `IntakeExtractor` | `prompts/intake-extractor.md` | `IntakeCompletion` | `OrchestratorService.parse` refines the rules parser's `Extracted` |
| `HouseholdDraftAgent` | `prompts/household-draft.md` | `HouseholdDraftCompletion` | Onboarding: a paragraph becomes the household graph |
| `BriefScriptWriter` | `prompts/brief-script.md` | text | `BriefService.script` for the spoken brief |

The specialist agents in `application/pipeline` (scheduler, logistics, procurement, development, comms, guardian) are deterministic. Keeping decisions deterministic and using the model only for reading is what keeps the trust ladder honest: a parent can always see exactly why an action was taken.

## Provider

`spring.ai.openai.*` is configured for Google's OpenAI-compatible endpoint by default (`gemini-2.5-flash`). Override `AI_BASE_URL`, `AI_COMPLETIONS_PATH`, `AI_MODEL` and the key to use OpenAI, exactly as bondai-service does.
