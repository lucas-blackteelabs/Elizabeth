package app.familyos.service.domain.trace;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/** Every step every agent took, so a parent can always answer "why did it do that?". */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "trace_steps")
public class TraceStep {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private LocalDateTime at;
    private String signalId;
    private String agent;
    private String step;
    private String detail;
}
