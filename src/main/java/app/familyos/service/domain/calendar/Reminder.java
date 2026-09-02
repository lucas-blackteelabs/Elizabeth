package app.familyos.service.domain.calendar;

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
@Document(collection = "reminders")
public class Reminder {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private LocalDateTime at;
    @Builder.Default
    private List<String> personIds = new ArrayList<>();
    private String text;
    private String sourceId;
}
