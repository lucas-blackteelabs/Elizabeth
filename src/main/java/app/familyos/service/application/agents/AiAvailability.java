package app.familyos.service.application.agents;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** The agents are optional: with no key configured the rules parser and templates carry the household. */
@Component
public class AiAvailability {
    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @Value("${spring.ai.openai.chat.options.model:gemini-2.5-flash}")
    private String model;

    public boolean ready() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String model() {
        return model;
    }
}
