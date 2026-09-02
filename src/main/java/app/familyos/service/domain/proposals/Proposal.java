package app.familyos.service.domain.proposals;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "proposals")
public class Proposal {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private String signalId;
    private String title;
    private String summary;
    @Builder.Default
    private List<Action> actions = new ArrayList<>();
    @Builder.Default
    private List<Alternative> alternatives = new ArrayList<>();
    private Urgency urgency;
    private LocalDateTime dueAt;
    @Builder.Default
    private List<Flag> flags = new ArrayList<>();
    @Builder.Default
    private List<String> rationale = new ArrayList<>();

    public boolean blocked() {
        return flags.stream().anyMatch(f -> f.level() == Flag.Level.BLOCK);
    }
}
