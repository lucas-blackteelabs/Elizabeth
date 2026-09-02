package app.familyos.service.domain.chores;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Chores, points, rewards. Kids see a board; parents see a nudge in the brief. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chore_boards")
public class ChoreBoard {
    @Id
    private String id;
    @Indexed(unique = true)
    private String householdId;
    @Builder.Default
    private List<Chore> chores = new ArrayList<>();
    @Builder.Default
    private List<Reward> rewards = new ArrayList<>();
    @Builder.Default
    private List<PointEvent> points = new ArrayList<>();
    @Builder.Default
    private List<Claim> claims = new ArrayList<>();

    public enum Cadence {DAILY, WEEKLY, ONCE}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Chore {
        @Builder.Default
        private String id = "ch_" + UUID.randomUUID().toString().substring(0, 8);
        private String childId;
        private String title;
        private int points;
        private Cadence cadence;
        private LocalDateTime dueAt;
        @Builder.Default
        private List<String> doneOn = new ArrayList<>();
        private String source; // family | agent
        private String sourceId;
    }

    public record Reward(String id, String title, int cost) {
    }

    public record PointEvent(String id, String childId, LocalDateTime at, int delta, String reason) {
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Claim {
        private String id;
        private String childId;
        private String rewardId;
        private LocalDateTime at;
        private boolean approved;
    }

    public int balance(String childId) {
        return points.stream().filter(p -> p.childId().equals(childId)).mapToInt(PointEvent::delta).sum();
    }

    public int earnedThisWeek(String childId, LocalDate day) {
        String week = weekKey(day);
        return points.stream()
                .filter(p -> p.childId().equals(childId) && p.delta() > 0 && weekKey(p.at().toLocalDate()).equals(week))
                .mapToInt(PointEvent::delta).sum();
    }

    public int streak(String childId, LocalDate day) {
        List<Chore> daily = chores.stream().filter(c -> c.getChildId().equals(childId) && c.getCadence() == Cadence.DAILY).toList();
        if (daily.isEmpty()) return 0;
        LocalDate d = day;
        if (!allDone(daily, d)) d = d.minusDays(1);
        int n = 0;
        while (allDone(daily, d)) {
            n++;
            d = d.minusDays(1);
        }
        return n;
    }

    private static boolean allDone(List<Chore> daily, LocalDate d) {
        return daily.stream().allMatch(c -> c.getDoneOn().contains(d.toString()));
    }

    public static boolean isDue(Chore chore, LocalDate day) {
        return switch (chore.getCadence()) {
            case ONCE -> chore.getDoneOn().isEmpty() && (chore.getDueAt() == null || !chore.getDueAt().toLocalDate().isBefore(day));
            case DAILY -> !chore.getDoneOn().contains(day.toString());
            case WEEKLY -> chore.getDoneOn().stream().noneMatch(x -> weekKey(LocalDate.parse(x)).equals(weekKey(day)));
        };
    }

    public static String weekKey(LocalDate day) {
        return day.minusDays((day.getDayOfWeek().getValue() + 6) % 7).toString();
    }
}
