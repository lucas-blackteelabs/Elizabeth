package app.familyos.service.application.intake;

import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.Place;
import app.familyos.service.domain.households.Role;
import app.familyos.service.domain.signals.Channel;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.RawMessage;
import app.familyos.service.domain.signals.Requirement;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The rules-based intake parser. Deliberately boring and inspectable: the
 * household never depends on a model being available to keep the calendar
 * right. The model (IntakeExtractor) refines what this produces.
 */
public final class IntakeRules {
    private IntakeRules() {
    }

    private static final List<String> MONTHS = List.of("jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec");
    private static final String MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
    private static final String WEEKDAY_RE = "(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?)";
    private static final List<String> WEEKDAYS = List.of("sun", "mon", "tue", "wed", "thu", "fri", "sat");
    private static final String TIME = "(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?";

    private record Rule(Pattern re, int weight) {
        static Rule of(String re, int w) {
            return new Rule(Pattern.compile(re, Pattern.CASE_INSENSITIVE), w);
        }
    }

    private static final Map<SignalKind, List<Rule>> KIND_RULES = Map.of(
            SignalKind.PERMISSION_REQUEST, List.of(Rule.of("permission", 3), Rule.of("excursion", 3), Rule.of("consent", 3), Rule.of("field trip", 3)),
            SignalKind.SCHEDULE_CHANGE, List.of(Rule.of("\\bmoved\\b", 3), Rule.of("rescheduled", 3), Rule.of("changed to", 2), Rule.of("\\bnow at\\b", 2), Rule.of("cancelled", 3), Rule.of("postponed", 3), Rule.of("instead of", 1), Rule.of("late notice", 1)),
            SignalKind.INVITATION, List.of(Rule.of("invited?", 3), Rule.of("birthday", 2), Rule.of("\\bparty\\b", 3), Rule.of("rsvp", 2), Rule.of("turning \\d+", 2)),
            SignalKind.APPOINTMENT, List.of(Rule.of("appointment", 4), Rule.of("\\bdr\\.?\\s", 2), Rule.of("dent(ist|al)", 3), Rule.of("paediatric", 2), Rule.of("clinic", 1), Rule.of("check-?up", 3), Rule.of("reply\\s+(yes|y)\\b", 2)),
            SignalKind.PURCHASE_NEED, List.of(Rule.of("uniform", 3), Rule.of("\\border(s|ing)?\\b", 2), Rule.of("sizes?\\b", 2), Rule.of("\\bshop\\b", 1), Rule.of("outgrow", 3)),
            SignalKind.REGISTRATION, List.of(Rule.of("registrations?", 3), Rule.of("\\bregister\\b", 3), Rule.of("enrol", 3), Rule.of("sign[- ]?up", 3), Rule.of("season", 1), Rule.of("trials?", 2)),
            SignalKind.COPARENT_MESSAGE, List.of(Rule.of("\\bat mine\\b", 2), Rule.of("your weekend", 2), Rule.of("my weekend", 2), Rule.of("handover", 2), Rule.of("custody", 3))
    );
    private static final Pattern EVENT_RE = Pattern.compile("\\b(grand final|final|game|match|carnival|concert|performance|rehearsal|assembly|photo day|presentation|graduation|open day|sports day|disco|gala)\\b", Pattern.CASE_INSENSITIVE);
    private static final List<Pattern> HOSTILE = Arrays.stream(new String[]{"\\bagain\\b", "\\btypical\\b", "\\balways\\b", "\\bnever\\b", "ridiculous", "unbelievable", "as usual", "!{1,}", "\\bcan'?t believe\\b", "\\byour fault\\b", "\\buseless\\b"}).map(s -> Pattern.compile(s, Pattern.CASE_INSENSITIVE)).toList();
    private static final Map<String, String> INTERESTS = new java.util.LinkedHashMap<>();

    static {
        INTERESTS.put("\\b(football|footy|soccer)\\b", "football");
        INTERESTS.put("cricket", "cricket");
        INTERESTS.put("swim", "swimming");
        INTERESTS.put("piano|music", "music");
        INTERESTS.put("netball", "netball");
        INTERESTS.put("\\bart\\b|drawing|painting", "art");
        INTERESTS.put("danc", "dance");
        INTERESTS.put("coding|robotics", "coding");
        INTERESTS.put("chess", "chess");
        INTERESTS.put("tennis", "tennis");
        INTERESTS.put("gymnastics", "gymnastics");
        INTERESTS.put("surf", "surf");
        INTERESTS.put("drama|theatre", "drama");
    }

    public record DateMention(int index, int length, LocalDateTime day, String raw, boolean explicit) {
    }

    public record TimeMention(int index, int length, LocalTime start, LocalTime end, String raw) {
    }

    public record Moved(int index, LocalTime from, LocalTime to) {
    }

    public record Times2(List<TimeMention> times, Moved moved) {
    }

    public record Parsed(SignalKind kind, double confidence, Extracted extracted) {
    }

    public static Parsed parse(RawMessage raw, Household h, LocalDateTime now) {
        String text = raw.text();
        SignalKind kind = classify(text, raw.from(), h);
        List<Person> children = detectChildren(text, raw.from(), h, kind);
        List<DateMention> dates = extractDates(text, now);
        Times2 t = extractTimes(text);
        DateMention deadline = findDeadline(text, dates);
        List<DateMention> eventDates = dates.stream().filter(d -> d != deadline).toList();
        Extracted.TimeWindow[] win = buildWindow(text, eventDates, t.times(), t.moved(), kind);
        Optional<Place> place = detectPlace(text, h);
        String locationText = place.map(Place::getName).orElseGet(() -> genericLocation(text, h));
        List<Double> amounts = new ArrayList<>();
        Matcher am = Pattern.compile("\\$\\s?(\\d+(?:\\.\\d{2})?)").matcher(text);
        while (am.find()) amounts.add(Double.parseDouble(am.group(1)));
        List<String> items = extractItems(text);
        String[] contact = extractContact(text, raw.from());
        List<String> tags = INTERESTS.entrySet().stream().filter(e -> Pattern.compile(e.getKey(), Pattern.CASE_INSENSITIVE).matcher(text).find()).map(Map.Entry::getValue).toList();
        int[] ageRange = extractAgeRange(text);
        Extracted.Tone tone = kind == SignalKind.COPARENT_MESSAGE
                ? analyseTone(text, h.coparent().map(Person::getName).orElse("the other parent"), children.isEmpty() ? "the child" : children.get(0).getName())
                : null;

        Extracted ex = Extracted.builder()
                .title(makeTitle(kind, raw, children, locationText, tags))
                .childIds(children.stream().map(Person::getId).toList())
                .when(win[0])
                .previousWhen(win[1])
                .deadline(deadline == null ? null : deadline.day())
                .locationText(locationText)
                .placeId(place.map(Place::getId).orElse(null))
                .travelMinutes(place.map(Place::getTravelMinutesFromHome).orElse(null))
                .amount(amounts.isEmpty() ? null : amounts.get(0))
                .payee(payeeFor(kind, raw.from(), h, place.orElse(null)))
                .requires(requirementsFor(kind, amounts.isEmpty() ? null : amounts.get(0), items, Pattern.compile("reply\\s+[a-z]\\b|reply to confirm|confirm", Pattern.CASE_INSENSITIVE).matcher(text).find()))
                .items(items)
                .contactName(contact[0])
                .contactPhone(contact[1])
                .interestTags(tags)
                .ageMin(ageRange == null ? null : ageRange[0])
                .ageMax(ageRange == null ? null : ageRange[1])
                .tone(tone)
                .otherDates(eventDates.stream().filter(d -> d.explicit() && (win[0] == null || !d.day().toLocalDate().equals(win[0].start().toLocalDate()))).map(DateMention::day).toList())
                .build();
        if (amounts.size() > 1) ex.getNotes().add("Prices mentioned: " + amounts.stream().map(a -> "$" + fmt(a)).reduce((a, b) -> a + ", " + b).orElse("") + ".");
        if (children.isEmpty()) ex.getNotes().add("Could not tell which child this is about.");
        if (win[0] == null && kind != SignalKind.PURCHASE_NEED && kind != SignalKind.FYI) ex.getNotes().add("No date found; treating as undated.");
        double confidence = Math.min(0.98, (kind == SignalKind.FYI ? 0.6 : 0.7) + (children.isEmpty() ? 0 : 0.1) + (win[0] == null ? 0 : 0.1) + (deadline == null ? 0 : 0.05));
        return new Parsed(kind, confidence, ex);
    }

    public static String fmt(double a) {
        return a == Math.floor(a) ? String.valueOf((long) a) : String.valueOf(a);
    }

    // ───────────────────────────── classification ─────────────────────────────

    public static SignalKind classify(String text, String from, Household h) {
        Optional<Person> cop = h.coparent();
        if (cop.isPresent()) {
            String f = from.toLowerCase(Locale.ROOT);
            boolean byName = f.contains(cop.get().getName().toLowerCase(Locale.ROOT));
            boolean byPhone = cop.get().getPhone() != null && from.replaceAll("\\s", "").contains(cop.get().getPhone().replaceAll("\\s", ""));
            if (byName || byPhone) return SignalKind.COPARENT_MESSAGE;
        }
        SignalKind best = SignalKind.FYI;
        int bestScore = 0;
        for (SignalKind k : List.of(SignalKind.PERMISSION_REQUEST, SignalKind.SCHEDULE_CHANGE, SignalKind.INVITATION, SignalKind.APPOINTMENT, SignalKind.PURCHASE_NEED, SignalKind.REGISTRATION, SignalKind.COPARENT_MESSAGE)) {
            int score = KIND_RULES.get(k).stream().mapToInt(r -> r.re().matcher(text).find() ? r.weight() : 0).sum();
            if (score > bestScore) {
                best = k;
                bestScore = score;
            }
        }
        if (bestScore >= 3) return best;
        return EVENT_RE.matcher(text).find() && !extractTimes(text).times().isEmpty() ? SignalKind.EVENT : SignalKind.FYI;
    }

    static List<Person> detectChildren(String text, String from, Household h, SignalKind kind) {
        List<Person> kids = h.children();
        List<Person> byName = kids.stream().filter(k -> {
            List<String> names = new ArrayList<>(List.of(k.getName()));
            names.addAll(k.getAliases());
            return names.stream().anyMatch(n -> Pattern.compile("\\b" + Pattern.quote(n) + "(?:'s)?\\b", Pattern.CASE_INSENSITIVE).matcher(text).find());
        }).toList();
        if (!byName.isEmpty()) return byName;
        Matcher year = Pattern.compile("\\byear\\s*(\\d{1,2})\\b|\\bY(\\d{1,2})\\b", Pattern.CASE_INSENSITIVE).matcher(text);
        if (year.find()) {
            String n = year.group(1) != null ? year.group(1) : year.group(2);
            List<Person> byYear = kids.stream().filter(k -> k.getYearLevel() != null && k.getYearLevel().equalsIgnoreCase("year " + n)).toList();
            if (!byYear.isEmpty()) return byYear;
        }
        int[] range = extractAgeRange(text);
        if (range != null) {
            List<Person> byRange = kids.stream().filter(k -> k.getAge() != null && k.getAge() >= range[0] && k.getAge() <= range[1]).toList();
            if (!byRange.isEmpty()) return byRange;
        }
        Matcher under = Pattern.compile("\\b(?:u|under[- ]?)(\\d{1,2})s?\\b", Pattern.CASE_INSENSITIVE).matcher(text);
        if (under.find()) {
            int n = Integer.parseInt(under.group(1));
            List<Person> byAge = kids.stream().filter(k -> k.getAge() != null && k.getAge() <= n && k.getAge() >= n - 2).toList();
            if (!byAge.isEmpty()) return byAge;
        }
        if (Pattern.compile("preschool|kindy|daycare", Pattern.CASE_INSENSITIVE).matcher(text + from).find()) {
            List<Person> pk = kids.stream().filter(k -> k.getYearLevel() != null && k.getYearLevel().toLowerCase(Locale.ROOT).contains("preschool")).toList();
            if (!pk.isEmpty()) return pk;
        }
        String fromLower = from.toLowerCase(Locale.ROOT);
        List<Person> bySchool = kids.stream().filter(k -> k.getSchool() != null && (fromLower.contains(k.getSchool().toLowerCase(Locale.ROOT).split(" ")[0])
                || Pattern.compile(initials(k.getSchool()), Pattern.CASE_INSENSITIVE).matcher(from).find())).toList();
        if (!bySchool.isEmpty() && kind != SignalKind.FYI) return bySchool;
        return List.of();
    }

    private static String initials(String s) {
        StringBuilder b = new StringBuilder();
        for (String w : s.split(" ")) if (!w.isEmpty()) b.append(w.charAt(0));
        return Pattern.quote(b.toString());
    }

    static int[] extractAgeRange(String text) {
        Matcher m = Pattern.compile("\\(?ages?\\s*(\\d{1,2})\\s*(?:-|–|to)\\s*(\\d{1,2})\\)?|\\((\\d{1,2})\\s*-\\s*(\\d{1,2})\\)|(\\d{1,2})\\s*(?:-|to)\\s*(\\d{1,2})\\s*year[- ]olds", Pattern.CASE_INSENSITIVE).matcher(text);
        if (!m.find()) return null;
        String a = first(m.group(1), m.group(3), m.group(5));
        String b = first(m.group(2), m.group(4), m.group(6));
        return a == null || b == null ? null : new int[]{Integer.parseInt(a), Integer.parseInt(b)};
    }

    private static String first(String... xs) {
        for (String x : xs) if (x != null) return x;
        return null;
    }

    // ───────────────────────────── dates & times ─────────────────────────────

    public static List<DateMention> extractDates(String text, LocalDateTime now) {
        List<DateMention> out = new ArrayList<>();
        StringBuilder masked = new StringBuilder(text);
        int year = now.getYear();
        Matcher m = Pattern.compile("(?:" + WEEKDAY_RE + "\\.?,?\\s+)?\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+" + MONTH_RE + "\\b\\.?(?:,?\\s+(\\d{4}))?", Pattern.CASE_INSENSITIVE).matcher(masked);
        while (m.find()) {
            push(out, masked, m.start(), m.end(), resolve(m.group(4), MONTHS.indexOf(m.group(3).substring(0, 3).toLowerCase(Locale.ROOT)), Integer.parseInt(m.group(2)), year, now), true);
        }
        m = Pattern.compile("(?:" + WEEKDAY_RE + "\\.?,?\\s+)?\\b" + MONTH_RE + "\\b\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?", Pattern.CASE_INSENSITIVE).matcher(masked);
        while (m.find()) {
            if (m.group().isBlank()) continue;
            push(out, masked, m.start(), m.end(), resolve(m.group(4), MONTHS.indexOf(m.group(2).substring(0, 3).toLowerCase(Locale.ROOT)), Integer.parseInt(m.group(3)), year, now), true);
        }
        m = Pattern.compile("\\b(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?\\b").matcher(masked);
        while (m.find()) {
            int day = Integer.parseInt(m.group(1));
            int month = Integer.parseInt(m.group(2)) - 1;
            if (month < 0 || month > 11 || day < 1 || day > 31) continue;
            push(out, masked, m.start(), m.end(), resolve(m.group(3), month, day, year, now), true);
        }
        m = Pattern.compile("\\b(?:(this|next)\\s+)?" + WEEKDAY_RE + "\\b(?:'s)?", Pattern.CASE_INSENSITIVE).matcher(masked);
        while (m.find()) {
            int target = WEEKDAYS.indexOf(m.group(2).substring(0, 3).toLowerCase(Locale.ROOT));
            int today = Times.weekday(now);
            int ahead = (target - today + 7) % 7;
            if (ahead == 0) ahead = 7;
            if ("next".equalsIgnoreCase(m.group(1)) && ahead < 3) ahead += 7;
            push(out, masked, m.start(), m.end(), now.toLocalDate().plusDays(ahead).atStartOfDay(), false);
        }
        m = Pattern.compile("\\btomorrow\\b", Pattern.CASE_INSENSITIVE).matcher(masked);
        while (m.find()) push(out, masked, m.start(), m.end(), now.toLocalDate().plusDays(1).atStartOfDay(), false);
        m = Pattern.compile("\\btoday\\b|\\btonight\\b", Pattern.CASE_INSENSITIVE).matcher(masked);
        while (m.find()) push(out, masked, m.start(), m.end(), now.toLocalDate().atStartOfDay(), false);
        out.sort((a, b) -> Integer.compare(a.index(), b.index()));
        return out;
    }

    private static void push(List<DateMention> out, StringBuilder masked, int start, int end, LocalDateTime day, boolean explicit) {
        if (day == null) return;
        out.add(new DateMention(start, end - start, day, masked.substring(start, end), explicit));
        for (int i = start; i < end; i++) masked.setCharAt(i, ' ');
    }

    private static LocalDateTime resolve(String y, int month, int day, int year, LocalDateTime now) {
        try {
            int yy = y == null ? year : (y.length() == 2 ? 2000 + Integer.parseInt(y) : Integer.parseInt(y));
            LocalDate d = LocalDate.of(yy, month + 1, day);
            if (y == null && Times.daysBetween(d.atStartOfDay(), now) > 60) d = d.plusYears(1);
            return d.atStartOfDay();
        } catch (Exception e) {
            return null;
        }
    }

    private static LocalTime toTime(String h, String m, String ampm, String inherit) {
        int hh = Integer.parseInt(h);
        String suffix = ampm != null ? ampm.toLowerCase(Locale.ROOT) : inherit == null ? null : inherit.toLowerCase(Locale.ROOT);
        if (suffix == null && m == null) return null;
        if ("pm".equals(suffix) && hh < 12) hh += 12;
        if ("am".equals(suffix) && hh == 12) hh = 0;
        if (hh > 23) return null;
        return LocalTime.of(hh, m == null ? 0 : Integer.parseInt(m));
    }

    public static Times2 extractTimes(String text) {
        List<TimeMention> times = new ArrayList<>();
        StringBuilder masked = new StringBuilder(text);
        Moved moved = null;
        Matcher mm = Pattern.compile("(?:moved|changed|rescheduled|shifted|pushed)\\s+(?:back\\s+|forward\\s+)?from\\s+" + TIME + "\\s+(?:to|→)\\s+" + TIME, Pattern.CASE_INSENSITIVE).matcher(masked);
        if (mm.find()) {
            LocalTime to = toTime(mm.group(4), mm.group(5), mm.group(6), null);
            LocalTime from = toTime(mm.group(1), mm.group(2), mm.group(3), mm.group(6));
            if (from != null && to != null) {
                moved = new Moved(mm.start(), from, to);
                for (int i = mm.start(); i < mm.end(); i++) masked.setCharAt(i, ' ');
            }
        }
        Matcher r = Pattern.compile("\\b" + TIME + "\\s*(?:-|–|to|until|till)\\s*" + TIME + "\\b", Pattern.CASE_INSENSITIVE).matcher(masked);
        List<int[]> spans = new ArrayList<>();
        while (r.find()) {
            LocalTime end = toTime(r.group(4), r.group(5), r.group(6), null);
            LocalTime start = toTime(r.group(1), r.group(2), r.group(3), r.group(6));
            if (start == null || end == null) continue;
            times.add(new TimeMention(r.start(), r.end() - r.start(), start, end, r.group()));
            spans.add(new int[]{r.start(), r.end()});
        }
        for (int[] s : spans) for (int i = s[0]; i < s[1]; i++) masked.setCharAt(i, ' ');
        Matcher s = Pattern.compile("\\b" + TIME + "\\b", Pattern.CASE_INSENSITIVE).matcher(masked);
        while (s.find()) {
            LocalTime t = toTime(s.group(1), s.group(2), s.group(3), null);
            if (t == null) continue;
            times.add(new TimeMention(s.start(), s.end() - s.start(), t, null, s.group()));
        }
        times.sort((a, b) -> Integer.compare(a.index(), b.index()));
        return new Times2(times, moved);
    }

    static DateMention findDeadline(String text, List<DateMention> dates) {
        for (DateMention d : dates) {
            String before = text.substring(Math.max(0, d.index() - 30), d.index()).toLowerCase(Locale.ROOT);
            Matcher m = Pattern.compile("\\b(by|before|due|close[sd]?|no later than|deadline)\\b([^.]*)$").matcher(before);
            if (m.find() && !Pattern.compile("\\d{1,2}(?::\\d{2})?\\s*(am|pm)").matcher(m.group(2)).find()) return d;
        }
        return null;
    }

    static Extracted.TimeWindow[] buildWindow(String text, List<DateMention> dates, List<TimeMention> times, Moved moved, SignalKind kind) {
        Extracted.TimeWindow[] none = new Extracted.TimeWindow[]{null, null};
        if (kind == SignalKind.PURCHASE_NEED) return none;
        if (moved != null) {
            DateMention day = dates.stream().filter(d -> d.index() < moved.index()).reduce((a, b) -> b).orElse(dates.isEmpty() ? null : dates.get(0));
            if (day == null) return none;
            LocalDateTime start = day.day().toLocalDate().atTime(moved.to());
            LocalDateTime prev = day.day().toLocalDate().atTime(moved.from());
            return new Extracted.TimeWindow[]{new Extracted.TimeWindow(start, start.plusMinutes(60), false), new Extracted.TimeWindow(prev, prev.plusMinutes(60), false)};
        }
        DateMention day = dates.stream().filter(DateMention::explicit).findFirst().orElse(dates.isEmpty() ? null : dates.get(0));
        if (day == null) return none;
        int paraEndIdx = text.indexOf("\n\n", day.index());
        int paragraphEnd = paraEndIdx == -1 ? text.length() : paraEndIdx;
        int sentenceStart = Math.max(Math.max(text.lastIndexOf(". ", day.index()), text.lastIndexOf("\n", day.index())), 0);
        int sentenceEndIdx = text.indexOf(". ", day.index());
        int sentenceEnd = sentenceEndIdx == -1 ? text.length() : sentenceEndIdx;
        List<TimeMention> same = times.stream().filter(t -> t.index() >= sentenceStart && t.index() <= sentenceEnd).toList();
        List<TimeMention> after = times.stream().filter(t -> t.index() > day.index() && t.index() < paragraphEnd).toList();
        List<TimeMention> pick = !same.isEmpty() ? same : !after.isEmpty() ? after : times;
        if (pick.isEmpty()) return new Extracted.TimeWindow[]{new Extracted.TimeWindow(day.day(), day.day().plusDays(1).minusMinutes(1), true), null};
        TimeMention first = pick.get(0);
        LocalDateTime start = day.day().toLocalDate().atTime(first.start());
        if (first.end() != null) return new Extracted.TimeWindow[]{new Extracted.TimeWindow(start, day.day().toLocalDate().atTime(first.end()), false), null};
        TimeMention second = pick.size() > 1 ? pick.get(1) : null;
        if (second != null && second.end() == null && second.start().isAfter(first.start()) && kind != SignalKind.COPARENT_MESSAGE) {
            return new Extracted.TimeWindow[]{new Extracted.TimeWindow(start, day.day().toLocalDate().atTime(second.start()), false), null};
        }
        return new Extracted.TimeWindow[]{new Extracted.TimeWindow(start, start.plusMinutes(kind == SignalKind.APPOINTMENT ? 45 : 60), false), null};
    }

    // ───────────────────────────── other fields ─────────────────────────────

    static Optional<Place> detectPlace(String text, Household h) {
        Place best = null;
        int bestIdx = Integer.MAX_VALUE;
        for (Place p : h.getPlaces()) {
            if ("pl_home".equals(p.getId())) continue;
            List<String> names = new ArrayList<>(List.of(p.getName()));
            names.addAll(p.getAliases());
            for (String n : names) {
                Matcher m = Pattern.compile("\\b" + Pattern.quote(n) + "\\b", Pattern.CASE_INSENSITIVE).matcher(text);
                if (m.find() && m.start() < bestIdx) {
                    bestIdx = m.start();
                    best = p;
                }
            }
        }
        return Optional.ofNullable(best);
    }

    private static String genericLocation(String text, Household h) {
        Matcher m = Pattern.compile("\\bat (?:the )?([A-Z][A-Za-z'’]+(?:\\s+[A-Z][A-Za-z'’]+){0,4})").matcher(text);
        if (!m.find()) return null;
        String cand = m.group(1);
        if (Pattern.compile("^" + WEEKDAY_RE + "|^" + MONTH_RE, Pattern.CASE_INSENSITIVE).matcher(cand).find()) return null;
        if (h.getPeople().stream().anyMatch(p -> p.getName().equals(cand))) return null;
        return cand;
    }

    static List<String> extractItems(String text) {
        LinkedHashSet<String> items = new LinkedHashSet<>();
        Matcher m = Pattern.compile("\\bbring\\s+(?:a |an |the |her |his |their |your )?([^.\\n]+)", Pattern.CASE_INSENSITIVE).matcher(text);
        while (m.find()) {
            for (String part : m.group(1).replaceAll("\\s+(and|&)\\s+", ",").split(",")) {
                String s = part.trim().replaceAll("^(a|an|the|her|his|their|your)\\s+", "").trim();
                if (!s.isEmpty()) items.add(s.replaceAll("\\s+", " "));
            }
        }
        m = Pattern.compile("\\b([A-Za-z]+(?:\\s[A-Za-z]+)?)\\s+(?:are|is)?\\s*required\\b", Pattern.CASE_INSENSITIVE).matcher(text);
        while (m.find()) items.add(m.group(1).toLowerCase(Locale.ROOT));
        return new ArrayList<>(items);
    }

    static String[] extractContact(String text, String from) {
        Matcher p = Pattern.compile("\\b(0\\d{1,3}[\\s-]?\\d{3,4}[\\s-]?\\d{3,4})\\b").matcher(text);
        String phone = p.find() ? p.group(1) : null;
        Matcher r = Pattern.compile("rsvp[^.]*?\\bto\\s+([A-Z][a-z]+)", Pattern.CASE_INSENSITIVE).matcher(text);
        String name = r.find() ? r.group(1) : from.contains("@") ? null : from.replaceAll("\\s*\\(.*\\)\\s*$", "");
        return new String[]{name, phone};
    }

    public static Extracted.Tone analyseTone(String text, String speaker, String childName) {
        Matcher caps = Pattern.compile("\\b[A-Z]{3,}\\b").matcher(text);
        int capsCount = 0;
        while (caps.find()) if (!List.of("RSVP", "PDF", "LEGO", "SMS").contains(caps.group())) capsCount++;
        int score = (int) HOSTILE.stream().filter(re -> re.matcher(text).find()).count() + capsCount;
        Pattern factual = Pattern.compile("\\d|\\b(need|needs|bring|pick|drop|folder|homework|bag|pm|am|friday|monday|tuesday|wednesday|thursday|saturday|sunday|weekend|school|appointment|medic)", Pattern.CASE_INSENSITIVE);
        List<String> facts = new ArrayList<>();
        for (String s : text.split("(?<=[.!?])\\s+|\\n+")) {
            s = s.trim();
            if (s.isEmpty() || !factual.matcher(s).find()) continue;
            String clean = s
                    .replaceAll("(?i)\\byou\\s+(?:again\\s+)?forgot\\s+to\\s+(?:send|pack|bring)\\s+(.+?)(\\s+last\\s+\\w+)?\\.?$", "$1 was not sent$2.")
                    .replaceAll("(?i)\\bat mine\\b", "at " + speaker + "'s")
                    .replaceAll("(?i)\\bI need (her|him|them)\\b", speaker + " needs " + childName)
                    .replaceAll("(?i)\\bnot (\\d{1,2}(?::\\d{2})?(?:am|pm)?)\\b", "(not $1)")
                    .replaceAll("(?i)\\b(again|typical|as usual|always|never|ridiculous|unbelievable)\\b", "")
                    .replaceAll("(?i)\\b(this is|that is|that's)\\s*\\.?", "")
                    .replaceAll("(?i)\\byou\\s+forgot\\b", "the")
                    .replaceAll("(?i)\\bi have plans\\b", "")
                    .replaceAll("(?i)\\bmake sure\\b", "please ensure")
                    .replaceAll("\\s{2,}", " ")
                    .replaceAll("\\s+([,.])", "$1")
                    .replaceAll(",\\s*\\.", ".")
                    .trim();
            if (clean.length() > 3) facts.add(Character.toUpperCase(clean.charAt(0)) + clean.substring(1));
        }
        return new Extracted.Tone(score >= 2, score, facts, String.join(" ", facts));
    }

    static List<Requirement> requirementsFor(SignalKind kind, Double amount, List<String> items, boolean hasReply) {
        List<Requirement> r = new ArrayList<>();
        switch (kind) {
            case PERMISSION_REQUEST -> {
                r.add(Requirement.SIGNATURE);
                if (amount != null) r.add(Requirement.PAYMENT);
                if (!items.isEmpty()) r.add(Requirement.ITEM);
            }
            case SCHEDULE_CHANGE -> r.add(Requirement.TRANSPORT);
            case INVITATION -> {
                r.addAll(List.of(Requirement.RSVP, Requirement.PURCHASE, Requirement.TRANSPORT));
                if (!items.isEmpty()) r.add(Requirement.ITEM);
            }
            case APPOINTMENT -> {
                r.add(Requirement.TRANSPORT);
                if (!items.isEmpty()) r.add(Requirement.ITEM);
                if (hasReply) r.add(Requirement.REPLY);
            }
            case PURCHASE_NEED -> r.add(Requirement.PURCHASE);
            case REGISTRATION -> {
                r.add(Requirement.DECISION);
                if (amount != null) r.add(Requirement.PAYMENT);
            }
            case COPARENT_MESSAGE -> r.addAll(List.of(Requirement.REPLY, Requirement.DECISION));
            case EVENT -> {
                r.add(Requirement.TRANSPORT);
                if (!items.isEmpty()) r.add(Requirement.ITEM);
            }
            case FYI -> {
            }
        }
        return r;
    }

    static String payeeFor(SignalKind kind, String from, Household h, Place place) {
        if (!List.of(SignalKind.PERMISSION_REQUEST, SignalKind.REGISTRATION, SignalKind.PURCHASE_NEED, SignalKind.APPOINTMENT).contains(kind)) return null;
        if (place != null && place.isVerifiedPayee() && kind != SignalKind.PERMISSION_REQUEST) return place.getName();
        Matcher d = Pattern.compile("@([\\w.-]+)").matcher(from);
        String domain = d.find() ? d.group(1) : null;
        if (domain != null) {
            String head = domain.split("\\.")[0].replaceAll("ps$", "");
            Optional<Place> school = h.getPlaces().stream().filter(p -> p.isVerifiedPayee() && p.getName().toLowerCase(Locale.ROOT).split(" ")[0].equals(head)).findFirst();
            if (school.isPresent()) return school.get().getName();
            return domain;
        }
        return from;
    }

    static String makeTitle(SignalKind kind, RawMessage raw, List<Person> children, String location, List<String> tags) {
        String who = children.isEmpty() ? "Family" : String.join(" & ", children.stream().map(Person::getName).toList());
        String subject = raw.subject() == null ? null : raw.subject().replaceAll("\\s+[-–—]\\s+.*$", "").trim();
        return switch (kind) {
            case PERMISSION_REQUEST -> who + ": " + (subject != null ? subject : "permission needed");
            case SCHEDULE_CHANGE -> {
                String noun = !tags.isEmpty() ? tags.get(0) : null;
                if (noun == null) {
                    Matcher m = Pattern.compile("\\b(game|match|practice|training|lesson|rehearsal|class|session)\\b", Pattern.CASE_INSENSITIVE).matcher(raw.body());
                    noun = m.find() ? m.group(1).toLowerCase(Locale.ROOT) : "activity";
                }
                yield who + ": " + noun + " time changed";
            }
            case INVITATION -> who + ": party invitation" + (location != null ? " at " + location : "");
            case APPOINTMENT -> who + ": appointment" + (location != null ? " at " + location : "");
            case PURCHASE_NEED -> who + ": " + (subject != null ? subject : "something to buy");
            case REGISTRATION -> who + ": " + (subject != null ? subject : (tags.isEmpty() ? "activity" : tags.get(0)) + " registration");
            case COPARENT_MESSAGE -> who + ": message from " + raw.from();
            case EVENT -> {
                Matcher m = EVENT_RE.matcher((raw.subject() == null ? "" : raw.subject()) + " " + raw.body());
                String noun = m.find() ? m.group(1).toLowerCase(Locale.ROOT) : "event";
                yield who + ": " + noun + (location != null ? " at " + location : "");
            }
            case FYI -> subject != null ? subject : raw.from() + ": note";
        };
    }
}
