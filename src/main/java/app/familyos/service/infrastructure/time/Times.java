package app.familyos.service.infrastructure.time;

import app.familyos.service.domain.households.Household;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/** Household-local time helpers. All pipeline times are naive local datetimes in the household's timezone. */
public final class Times {
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEE d MMM");

    private Times() {
    }

    public static LocalDateTime now(Household h) {
        if (h.getDemoNow() != null) return h.getDemoNow();
        return LocalDateTime.now(ZoneId.of(h.getTimezone() == null ? "Australia/Sydney" : h.getTimezone())).truncatedTo(ChronoUnit.MINUTES);
    }

    /** 0 = Sunday … 6 = Saturday, the convention the household graph and the clients use. */
    public static int weekday(LocalDateTime t) {
        return t.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : t.getDayOfWeek().getValue();
    }

    public static int weekday(LocalDate d) {
        return weekday(d.atStartOfDay());
    }

    public static boolean isWeekend(LocalDateTime t) {
        int w = weekday(t);
        return w == 0 || w == 6;
    }

    public static LocalDateTime withTime(LocalDateTime day, String hhmm) {
        return day.toLocalDate().atTime(LocalTime.parse(hhmm));
    }

    public static long daysBetween(LocalDateTime a, LocalDateTime b) {
        return ChronoUnit.DAYS.between(a.toLocalDate(), b.toLocalDate());
    }

    public static boolean overlaps(LocalDateTime aStart, LocalDateTime aEnd, LocalDateTime bStart, LocalDateTime bEnd) {
        return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
    }

    public static String fmtDay(LocalDateTime t) {
        return t.format(DAY);
    }

    public static String fmtTime(LocalDateTime t) {
        int h = t.getHour();
        int m = t.getMinute();
        String suffix = h >= 12 ? "pm" : "am";
        int hh = h % 12 == 0 ? 12 : h % 12;
        return m == 0 ? hh + suffix : String.format("%d:%02d%s", hh, m, suffix);
    }

    public static String fmtWhen(LocalDateTime start, LocalDateTime end, boolean allDay) {
        if (allDay) return fmtDay(start);
        return end == null ? fmtDay(start) + " " + fmtTime(start) : fmtDay(start) + " " + fmtTime(start) + "–" + fmtTime(end);
    }

    public static String month(LocalDateTime t) {
        return String.format("%04d-%02d", t.getYear(), t.getMonthValue());
    }
}
