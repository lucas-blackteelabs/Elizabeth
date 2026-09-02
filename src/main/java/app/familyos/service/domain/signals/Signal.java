package app.familyos.service.domain.signals;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "signals")
public class Signal {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private LocalDateTime receivedAt;
    private RawMessage raw;
    private SignalKind kind;
    private double confidence;
    private Extracted extracted;
    private String parser; // rules | llm
}
