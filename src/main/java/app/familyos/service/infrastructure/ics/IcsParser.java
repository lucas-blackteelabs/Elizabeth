package app.familyos.service.infrastructure.ics;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * iCalendar subscriptions. Nearly every school platform, sports club system and
 * shared calendar publishes one, which makes this the widest connector we have
 * that needs no OAuth and no scraping.
 */
@Component
public class IcsParser {
    private final RestClient restClient = RestClient.create();

    public record IcsEvent(String uid, String summary, String location, String description, LocalDateTime start, LocalDateTime end, boolean allDay, String rrule) {
    }

    public String fetch(String url) {
        return restClient.get().uri(url.replaceFirst("(?i)^webcal://", "https://")).retrieve().body(String.class);
    }

    public static List<IcsEvent> parse(String text) {
        List<String> lines = unfold(text);
        List<IcsEvent> out = new ArrayList<>();
        Map<String, String[]> cur = null;
        for (String line : lines) {
            if (line.equals("BEGIN:VEVENT")) cur = new HashMap<>();
            else if (line.equals("END:VEVENT") && cur != null) {
                IcsEvent ev = toEvent(cur);
                if (ev != null) out.add(ev);
                cur = null;
            } else if (cur != null) {
                int i = line.indexOf(':');
                if (i == -1) continue;
                String[] nameParams = line.substring(0, i).split(";");
                String value = line.substring(i + 1);
                String params = nameParams.length > 1 ? String.join(";", java.util.Arrays.copyOfRange(nameParams, 1, nameParams.length)) : "";
                cur.put(nameParams[0].toUpperCase(), new String[]{params.toUpperCase(), value});
            }
        }
        return out;
    }

    private static List<String> unfold(String text) {
        List<String> lines = new ArrayList<>();
        for (String l : text.replace("\r\n", "\n").split("\n")) {
            if ((l.startsWith(" ") || l.startsWith("\t")) && !lines.isEmpty()) lines.set(lines.size() - 1, lines.get(lines.size() - 1) + l.substring(1));
            else lines.add(l);
        }
        return lines;
    }

    private static LocalDateTime[] parseDt(String v, String params) {
        Matcher m = Pattern.compile("^(\\d{4})(\\d{2})(\\d{2})(?:T(\\d{2})(\\d{2})(\\d{2})?(Z)?)?$").matcher(v.trim());
        if (!m.find()) return null;
        boolean allDay = params.contains("VALUE=DATE") || m.group(4) == null;
        LocalDate d = LocalDate.of(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3)));
        if (allDay) return new LocalDateTime[]{d.atStartOfDay(), null};
        LocalDateTime t = d.atTime(Integer.parseInt(m.group(4)), Integer.parseInt(m.group(5)), m.group(6) == null ? 0 : Integer.parseInt(m.group(6)));
        if ("Z".equals(m.group(7))) t = LocalDateTime.ofInstant(t.toInstant(java.time.ZoneOffset.UTC), ZoneId.of("Australia/Sydney"));
        return new LocalDateTime[]{t, t};
    }

    private static IcsEvent toEvent(Map<String, String[]> f) {
        String[] ds = f.get("DTSTART");
        if (ds == null) return null;
        LocalDateTime[] start = parseDt(ds[1], ds[0]);
        if (start == null) return null;
        boolean allDay = start[1] == null;
        String[] de = f.get("DTEND");
        LocalDateTime[] end = de == null ? null : parseDt(de[1], de[0]);
        LocalDateTime endAt = end != null ? end[0] : allDay ? start[0].plusDays(1) : start[0].plusMinutes(60);
        return new IcsEvent(
                f.containsKey("UID") ? f.get("UID")[1] : start[0] + "-" + (f.containsKey("SUMMARY") ? f.get("SUMMARY")[1] : ""),
                unescape(f.containsKey("SUMMARY") ? f.get("SUMMARY")[1] : "(untitled)"),
                f.containsKey("LOCATION") ? unescape(f.get("LOCATION")[1]) : null,
                f.containsKey("DESCRIPTION") ? unescape(f.get("DESCRIPTION")[1]) : null,
                start[0], endAt, allDay, f.containsKey("RRULE") ? f.get("RRULE")[1] : null);
    }

    private static String unescape(String s) {
        return s == null ? null : s.replace("\\n", " ").replace("\\,", ",").replace("\\;", ";").trim();
    }

    private static final Map<String, Integer> BYDAY = Map.of("SU", 0, "MO", 1, "TU", 2, "WE", 3, "TH", 4, "FR", 5, "SA", 6);

    public static List<IcsEvent> expand(List<IcsEvent> events, LocalDateTime from, int horizonDays) {
        List<IcsEvent> out = new ArrayList<>();
        LocalDate fromDay = from.toLocalDate();
        LocalDate toDay = fromDay.plusDays(horizonDays);
        for (IcsEvent ev : events) {
            if (ev.rrule() == null) {
                LocalDate d = ev.start().toLocalDate();
                if (!d.isBefore(fromDay) && !d.isAfter(toDay)) out.add(ev);
                continue;
            }
            Map<String, String> rule = new HashMap<>();
            for (String kv : ev.rrule().split(";")) {
                String[] p = kv.split("=");
                if (p.length == 2) rule.put(p[0], p[1]);
            }
            String freq = rule.get("FREQ");
            int interval = Integer.parseInt(rule.getOrDefault("INTERVAL", "1"));
            LocalDateTime[] untilP = rule.containsKey("UNTIL") ? parseDt(rule.get("UNTIL"), "") : null;
            LocalDate until = untilP == null ? null : untilP[0].toLocalDate();
            int count = rule.containsKey("COUNT") ? Integer.parseInt(rule.get("COUNT")) : Integer.MAX_VALUE;
            List<Integer> days = rule.containsKey("BYDAY") ? java.util.Arrays.stream(rule.get("BYDAY").split(",")).map(d -> BYDAY.get(d.substring(d.length() - 2))).filter(d -> d != null).toList()
                    : List.of(app.familyos.service.infrastructure.time.Times.weekday(ev.start()));
            long duration = ChronoUnit.MINUTES.between(ev.start(), ev.end());
            int produced = 0;
            for (int i = 0; i <= horizonDays + 366 && produced < count; i++) {
                LocalDate day = ev.start().toLocalDate().plusDays(i);
                if (until != null && day.isAfter(until)) break;
                if (day.isAfter(toDay)) break;
                int weeksSince = i / 7;
                boolean ok = "DAILY".equals(freq) ? i % interval == 0 : "WEEKLY".equals(freq) ? days.contains(app.familyos.service.infrastructure.time.Times.weekday(day)) && weeksSince % interval == 0 : i == 0;
                if (!ok) continue;
                produced++;
                if (day.isBefore(fromDay)) continue;
                LocalDateTime start = day.atTime(ev.start().toLocalTime());
                out.add(new IcsEvent(ev.uid() + "@" + day, ev.summary(), ev.location(), ev.description(), start, start.plusMinutes(duration), ev.allDay(), null));
            }
        }
        return out;
    }

    static Instant unused() {
        return Instant.EPOCH;
    }
}
