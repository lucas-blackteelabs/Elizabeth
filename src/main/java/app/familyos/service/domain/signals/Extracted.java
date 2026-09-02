package app.familyos.service.domain.signals;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Extracted {
    private String title;
    @Builder.Default
    private List<String> childIds = new ArrayList<>();
    private TimeWindow when;
    private TimeWindow previousWhen;
    private LocalDateTime deadline;
    private String locationText;
    private String placeId;
    private Integer travelMinutes;
    private Double amount;
    private String payee;
    @Builder.Default
    private List<Requirement> requires = new ArrayList<>();
    @Builder.Default
    private List<String> items = new ArrayList<>();
    private String contactName;
    private String contactPhone;
    @Builder.Default
    private List<String> interestTags = new ArrayList<>();
    private Integer ageMin;
    private Integer ageMax;
    private Tone tone;
    @Builder.Default
    private List<LocalDateTime> otherDates = new ArrayList<>();
    @Builder.Default
    private List<String> notes = new ArrayList<>();

    public record TimeWindow(LocalDateTime start, LocalDateTime end, boolean allDay) {
    }

    public record Tone(boolean hostile, int score, List<String> facts, String neutralised) {
    }

    public boolean requires(Requirement r) {
        return requires.contains(r);
    }
}
