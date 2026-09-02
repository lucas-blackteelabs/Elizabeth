package app.familyos.service.application.agents;

import app.familyos.service.infrastructure.file.MarkdownFileReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Optional;

/** Turns the template brief into something a warm voice can read in under two minutes. */
@Slf4j
@Service
@RequiredArgsConstructor
public class BriefScriptWriter {
    private static final String SYSTEM_PROMPT = MarkdownFileReader.readFileContent("prompts/brief-script.md");
    private final ChatClient chatClient;
    private final AiAvailability ai;

    public Optional<String> write(String notes) {
        if (!ai.ready()) return Optional.empty();
        try {
            String out = chatClient.prompt().system(SYSTEM_PROMPT).user(notes).call().content();
            return Optional.ofNullable(out).map(String::trim).filter(s -> !s.isEmpty());
        } catch (Exception e) {
            log.warn("BriefScriptWriter failed, template used: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
