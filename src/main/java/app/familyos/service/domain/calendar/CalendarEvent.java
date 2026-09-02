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
@Document(collection = "calendar_events")
public class CalendarEvent {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private String title;
    @Builder.Default
    private List<String> personIds = new ArrayList<>();
    private LocalDateTime start;
    private LocalDateTime end;
    private String placeId;
    private String locationText;
    private String driverId;
    private Source source;
    private String sourceId;
    @Builder.Default
    private List<String> notes = new ArrayList<>();

    public enum Source {STANDING, SIGNAL, ICS}

    public boolean overlaps(LocalDateTime s, LocalDateTime e) {
        return start.isBefore(e) && s.isBefore(end);
    }
}
