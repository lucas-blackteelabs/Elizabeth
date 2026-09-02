package app.familyos.service.application.pipeline;

import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.proposals.Action;
import app.familyos.service.domain.proposals.Disposition;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** The brief speaks in the first person, like a person who did the work would. */
public final class Narrator {
    private static final String[] WORDS = {"no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"};

    private Narrator() {
    }

    public static String word(int n) {
        return n >= 0 && n < WORDS.length ? WORDS[n] : String.valueOf(n);
    }

    private static String lower(String s) {
        return s.isEmpty() ? s : Character.toLowerCase(s.charAt(0)) + s.substring(1);
    }

    private static String list(List<String> xs) {
        if (xs.isEmpty()) return "";
        if (xs.size() == 1) return xs.get(0);
        return String.join(", ", xs.subList(0, xs.size() - 1)) + " and " + xs.get(xs.size() - 1);
    }

    static String did(Action a) {
        String t = a.getTitle();
        return switch (a.getCls()) {
            case CALENDAR_WRITE -> t.startsWith("Add ") ? "put " + lower(t.substring(4)) + " on the calendar"
                    : t.startsWith("Move ") ? "moved " + lower(t.substring(5))
                    : t.contains(" drives instead of ") ? t.replace(" drives instead of ", " is driving instead of ")
                    : t.endsWith(" drives") ? t.replaceAll(" drives$", " is driving") : lower(t);
            case REMINDER -> t.startsWith("Pack: ") ? "set a reminder to pack " + t.substring(6) : t.startsWith("Pack ") ? "set a reminder to " + lower(t) : "set a reminder (" + lower(t) + ")";
            case PAYMENT -> {
                Matcher m = Pattern.compile(" to (.+)$").matcher(t);
                yield "paid $" + fmt(a.getAmount()) + (m.find() ? " to " + m.group(1) : "");
            }
            case PURCHASE -> "ordered " + lower(t);
            case OUTBOUND_MESSAGE, COPARENT_REPLY -> "sent the " + (t.toLowerCase().contains("rsvp") ? "RSVP" : "reply");
            case ENROLMENT -> lower(t).replaceFirst("^enrol ", "enrolled ");
            case SIGN_FORM -> "signed the note";
        };
    }

    static String need(Action a) {
        String t = a.getTitle();
        return switch (a.getCls()) {
            case SIGN_FORM -> "your signature";
            case PAYMENT -> "a tap to pay $" + fmt(a.getAmount());
            case PURCHASE -> t.toLowerCase().contains("uniform") ? "a tap to order the uniforms (about $" + fmt(a.getAmount()) + ")" : "a yes on the " + lower(t.replaceAll(":.*$", ""));
            case OUTBOUND_MESSAGE -> t.toLowerCase().contains("rsvp") ? "your OK to send the RSVP" : t.toLowerCase().contains("confirm") ? "your OK to confirm" : "your OK to send it";
            case COPARENT_REPLY -> "you to read the draft and send it";
            case ENROLMENT -> "your call on " + lower(t).replaceFirst("^enrol ", "enrolling ");
            case CALENDAR_WRITE -> "a yes to " + lower(t);
            case REMINDER -> "nothing";
        };
    }

    private static String fmt(Double d) {
        return d == null ? "0" : d == Math.floor(d) ? String.valueOf(d.longValue()) : String.valueOf(d);
    }

    public static String narrate(List<Action> actions, java.util.function.Function<String, Disposition> dispositionOf, String fallback) {
        List<String> done = actions.stream().filter(a -> dispositionOf.apply(a.getId()) == Disposition.EXECUTED).map(Narrator::did).toList();
        List<String> pending = actions.stream().filter(a -> {
            Disposition d = dispositionOf.apply(a.getId());
            return d == Disposition.STAGED || d == Disposition.SUGGESTED;
        }).map(Narrator::need).filter(n -> !n.equals("nothing")).toList();
        StringBuilder sb = new StringBuilder();
        if (!done.isEmpty()) sb.append("I've ").append(list(done)).append(".");
        if (!pending.isEmpty()) sb.append(done.isEmpty() ? "" : " ").append(done.isEmpty() ? "I need " : "I just need ").append(list(pending)).append(".");
        if (done.isEmpty() && pending.isEmpty()) sb.append(fallback == null ? "" : fallback);
        return sb.toString();
    }

    public static String headline(int decide, int automated, int later) {
        if (decide == 0) return automated > 0 ? "Nothing needs you tonight. I've handled " + word(automated) + " thing" + (automated == 1 ? "" : "s") + " quietly." : "Nothing needs you tonight.";
        String a = decide == 1 ? "One thing needs you tonight." : cap(word(decide)) + " things need you tonight.";
        String b = automated > 0 ? " I've handled " + word(automated) + " already" : "";
        String c = later > 0 ? (b.isEmpty() ? " I've" : " and") + " parked " + word(later) + " for later." : b.isEmpty() ? "" : ".";
        return a + b + c;
    }

    private static String cap(String s) {
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    public static boolean hasLabelClass(ActionClass c) {
        return c != null;
    }
}
