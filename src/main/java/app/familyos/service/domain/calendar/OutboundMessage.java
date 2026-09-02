package app.familyos.service.domain.calendar;

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
@Document(collection = "outbound_messages")
public class OutboundMessage {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private String to;
    private String channel;
    private String text;
    private String status; // draft | sent
    private String signalId;
    private LocalDateTime at;
}
