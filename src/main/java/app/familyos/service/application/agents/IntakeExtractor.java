package app.familyos.service.application.agents;

import app.familyos.service.application.agents.completion.IntakeCompletion;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.signals.RawMessage;
import app.familyos.service.infrastructure.file.MarkdownFileReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.stream.Collectors;

/** Reads any message into structured logistics. The rules parser is the floor; this is the ceiling. */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntakeExtractor {
    private static final String SYSTEM_PROMPT = MarkdownFileReader.readFileContent("prompts/intake-extractor.md");
    private final ChatClient chatClient;
    private final AiAvailability ai;

    public Optional<IntakeCompletion> extract(RawMessage raw, Household h, LocalDateTime now) {
        if (!ai.ready()) return Optional.empty();
        String kids = h.children().stream().map(c -> c.getName() + " (" + c.getAge() + ", " + c.getYearLevel() + (c.getSchool() != null ? ", " + c.getSchool() : "") + ")").collect(Collectors.joining("; "));
        String system = SYSTEM_PROMPT
                .replace("{{now}}", now.toString())
                .replace("{{timezone}}", h.getTimezone())
                .replace("{{children}}", kids.isEmpty() ? "unknown" : kids)
                .replace("{{places}}", h.getPlaces().stream().map(p -> p.getName()).collect(Collectors.joining("; ")))
                .replace("{{coparent}}", h.coparent().map(Person::getName).orElse("none"));
        String user = "Channel: " + raw.channel() + "\nFrom: " + raw.from() + "\nSubject: " + (raw.subject() == null ? "" : raw.subject()) + "\n\n" + raw.body();
        long start = System.currentTimeMillis();
        log.info("[AI-AGENT-START] IntakeExtractor");
        try {
            IntakeCompletion c = chatClient.prompt().system(system).user(user).call().entity(IntakeCompletion.class);
            log.info("[AI-AGENT-END] IntakeExtractor in {}ms", System.currentTimeMillis() - start);
            return Optional.ofNullable(c);
        } catch (Exception e) {
            log.warn("IntakeExtractor failed, rules parser only: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
