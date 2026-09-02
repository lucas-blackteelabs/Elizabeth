package app.familyos.service.application.agents;

import app.familyos.service.application.agents.completion.HouseholdDraftCompletion;
import app.familyos.service.infrastructure.file.MarkdownFileReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Optional;

/** Onboarding: a parent's paragraph becomes the household graph. */
@Slf4j
@Service
@RequiredArgsConstructor
public class HouseholdDraftAgent {
    private static final String SYSTEM_PROMPT = MarkdownFileReader.readFileContent("prompts/household-draft.md");
    private final ChatClient chatClient;
    private final AiAvailability ai;

    public Optional<HouseholdDraftCompletion> draft(String text) {
        if (!ai.ready()) return Optional.empty();
        long start = System.currentTimeMillis();
        log.info("[AI-AGENT-START] HouseholdDraftAgent");
        try {
            HouseholdDraftCompletion c = chatClient.prompt().system(SYSTEM_PROMPT).user(text).call().entity(HouseholdDraftCompletion.class);
            log.info("[AI-AGENT-END] HouseholdDraftAgent in {}ms", System.currentTimeMillis() - start);
            return Optional.ofNullable(c);
        } catch (Exception e) {
            log.warn("HouseholdDraftAgent failed, rules fallback: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
