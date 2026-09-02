package app.familyos.service.application.pipeline;

import app.familyos.service.domain.households.ActivityCategory;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.Policy;
import app.familyos.service.domain.households.PolicyKind;
import app.familyos.service.domain.households.StandingCommitment;
import app.familyos.service.domain.proposals.Flag;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.infrastructure.time.Times;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** The household's own rules, evaluated against one event or one child's season. */
public final class PolicyRules {
    private PolicyRules() {
    }

    public static List<Flag> forEvent(Household h, Extracted ex, boolean recurring, boolean foodAdjacent) {
        List<Flag> flags = new ArrayList<>();
        h.policy(PolicyKind.TRANSIT_RADIUS).ifPresent(p -> {
            if (ex.getWhen() != null && ex.getTravelMinutes() != null && Times.isWeekend(ex.getWhen().start())) {
                int max = p.num("maxMinutes", 30);
                if (ex.getTravelMinutes() > max) {
                    flags.add(new Flag(recurring ? Flag.Level.WARN : Flag.Level.INFO, p.getId(), recurring
                            ? ex.getTravelMinutes() + " min each way is outside your " + max + "-minute weekend radius."
                            : ex.getTravelMinutes() + " min each way (one-off, so the " + max + "-minute weekend rule is only a heads-up)."));
                }
            }
        });
        h.policy(PolicyKind.EVENING_CUTOFF).ifPresent(p -> {
            if (ex.getWhen() == null || ex.getWhen().end() == null) return;
            String cutoff = p.str("cutoff", "18:30");
            int maxAge = p.num("maxAge", 5);
            int day = Times.weekday(ex.getWhen().start());
            boolean schoolNight = day <= 4;
            for (String cid : ex.getChildIds()) {
                Optional<Person> c = h.person(cid);
                if (c.isPresent() && c.get().getAge() != null && c.get().getAge() <= maxAge && schoolNight && ex.getWhen().end().toLocalTime().toString().compareTo(cutoff) > 0) {
                    flags.add(new Flag(Flag.Level.WARN, p.getId(), c.get().getName() + " would be out past " + cutoff + " on a school night."));
                }
            }
        });
        h.policy(PolicyKind.ALLERGEN).ifPresent(p -> {
            if (foodAdjacent && ex.getChildIds().contains(p.str("childId", ""))) {
                String name = h.personName(p.str("childId", ""));
                flags.add(new Flag(Flag.Level.WARN, p.getId(), name + " has a " + String.join(" and ", p.list("allergens")) + " allergy. Say so wherever food is involved."));
            }
        });
        h.policy(PolicyKind.CUSTODY).ifPresent(p -> {
            if (ex.getWhen() != null && ex.getChildIds().contains(p.str("childId", "")) && isCoparentWeekend(p, ex.getWhen().start())) {
                flags.add(new Flag(Flag.Level.INFO, p.getId(), h.personName(p.str("childId", "")) + " is with " + h.personName(p.str("coparentId", "")) + " that weekend. Coordinate through the shared ledger."));
            }
        });
        return flags;
    }

    public static boolean isCoparentWeekend(Policy custody, LocalDateTime at) {
        String next = custody.str("nextHandover", "");
        if (next.isBlank()) return false;
        int day = Times.weekday(at);
        if (!(day == 5 || day == 6 || day == 0)) return false;
        LocalDate friday = at.toLocalDate().plusDays(day == 5 ? 0 : day == 6 ? -1 : -2);
        long weeks = Math.round(ChronoUnit.DAYS.between(LocalDate.parse(next), friday) / 7.0);
        return weeks % 2 == 0;
    }

    public static List<Flag> forLoad(Household h, String childId, ActivityCategory category, String from, String to) {
        List<Flag> flags = new ArrayList<>();
        List<StandingCommitment> active = h.getStanding().stream().filter(s -> s.getPersonId().equals(childId) && overlaps(s, from, to)).toList();
        h.policy(PolicyKind.MAX_ACTIVITIES).ifPresent(p -> {
            List<StandingCommitment> structured = active.stream().filter(s -> s.getCategory() == ActivityCategory.SPORT || s.getCategory() == ActivityCategory.CREATIVE || s.getCategory() == ActivityCategory.ACADEMIC).toList();
            int cap = p.num("max", 2);
            if (structured.size() + 1 > cap) {
                flags.add(new Flag(Flag.Level.WARN, p.getId(), "Would be activity " + (structured.size() + 1) + " of " + cap + " for the season (" + String.join(", ", structured.stream().map(StandingCommitment::getTitle).toList()) + ")."));
            } else {
                flags.add(new Flag(Flag.Level.INFO, p.getId(), "Fits the " + cap + "-activity cap (" + structured.size() + " already in that season)."));
            }
        });
        h.policy(PolicyKind.ONE_PER_CATEGORY).ifPresent(p -> {
            if (category != ActivityCategory.CREATIVE && active.stream().noneMatch(s -> s.getCategory() == ActivityCategory.CREATIVE)) {
                flags.add(new Flag(Flag.Level.INFO, p.getId(), "No creative program that term yet. Worth balancing."));
            }
        });
        return flags;
    }

    private static boolean overlaps(StandingCommitment s, String from, String to) {
        if (s.getSeasonFrom() == null || s.getSeasonTo() == null) return true;
        return s.getSeasonFrom().compareTo(to) <= 0 && from.compareTo(s.getSeasonTo()) <= 0;
    }

    public static int autoPayCap(Household h) {
        return h.policy(PolicyKind.AUTO_PAY_CAP).map(p -> p.num("maxAmount", 0)).orElse(0);
    }

    public static int giftCap(Household h) {
        return h.policy(PolicyKind.GIFT_CAP).map(p -> p.num("maxAmount", 30)).orElse(30);
    }

    public static Integer monthlyBudget(Household h) {
        return h.policy(PolicyKind.BUDGET).map(p -> p.num("monthly", 0)).filter(n -> n > 0).orElse(null);
    }
}
