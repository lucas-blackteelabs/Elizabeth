package app.familyos.service.application.pipeline;

import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.proposals.Alternative;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.Requirement;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Drafts every outbound word: RSVPs, confirmations, and the calm reply to the co-parent. */
public final class CommsAgent {
    private static final String AGENT = "comms";

    private CommsAgent() {
    }

    public static AgentOutput run(PipelineContext ctx, Signal signal, SchedulerAgent.Plan plan) {
        AgentOutput out = new AgentOutput();
        Extracted ex = signal.getExtracted();
        Household h = ctx.getHousehold();
        String parent = h.parents().stream().map(Person::getName).findFirst().orElse("");
        List<Person> kids = ex.getChildIds().stream().map(h::person).flatMap(Optional::stream).toList();
        Person kid = kids.isEmpty() ? null : kids.get(0);
        String kidName = kid == null ? "our child" : kid.getName();
        String channel = signal.getRaw().channel().name().toLowerCase();

        if (signal.getKind() == SignalKind.PERMISSION_REQUEST) {
            out.getActions().add(AgentOutput.action(AGENT, ActionClass.SIGN_FORM, "Sign permission note for " + kidName, "Pre-filled from the school portal. Emergency contact and medical details carried over.", Map.of("form", String.valueOf(signal.getRaw().subject()))));
        }
        if (signal.getKind() == SignalKind.INVITATION && ex.getWhen() != null) {
            String allergy = kid != null && !kid.getAllergies().isEmpty() ? " One thing to flag: " + kid.getName() + " has a " + String.join(" and ", kid.getAllergies()) + " allergy, so we'll send some safe snacks and I'll double-check the pizza and cake. " : " ";
            Matcher hm = Pattern.compile("\\b([A-Z][a-z]+) is turning").matcher(signal.getRaw().body());
            String host = hm.find() ? hm.group(1) : ex.getContactName() != null ? ex.getContactName() : "the birthday child";
            String to = ex.getContactPhone() != null ? ex.getContactPhone() : signal.getRaw().from();
            String text = "Hi " + (ex.getContactName() == null ? "there" : ex.getContactName()) + "! " + kidName + " would love to come to " + host + "'s party on " + Times.fmtDay(ex.getWhen().start()) + ", " + Times.fmtTime(ex.getWhen().start()) + "–" + Times.fmtTime(ex.getWhen().end() == null ? ex.getWhen().start() : ex.getWhen().end()) + "." + allergy + "Thanks so much for the invite! " + parent;
            out.getActions().add(AgentOutput.action(AGENT, ActionClass.OUTBOUND_MESSAGE, "RSVP yes to " + (ex.getContactName() == null ? signal.getRaw().from() : ex.getContactName()), text, Map.of("to", to, "channel", channel, "text", text)));
            String no = "Hi " + (ex.getContactName() == null ? "there" : ex.getContactName()) + ", thank you so much for thinking of " + kidName + ". Sadly we can't make it that day, but we hope " + host + " has the best birthday! " + parent;
            out.getAlternatives().add(new Alternative("Send a warm no", "Decline the invitation kindly.", List.of(AgentOutput.action(AGENT, ActionClass.OUTBOUND_MESSAGE, "RSVP no", no, Map.of("to", to, "channel", channel, "text", no)))));
        }
        if (signal.getKind() == SignalKind.APPOINTMENT && ex.requires(Requirement.REPLY)) {
            Matcher rm = Pattern.compile("reply\\s+([A-Z])\\b", Pattern.CASE_INSENSITIVE).matcher(signal.getRaw().body());
            String reply = rm.find() ? rm.group(1).toUpperCase() : "Y";
            out.getActions().add(AgentOutput.action(AGENT, ActionClass.OUTBOUND_MESSAGE, "Confirm appointment (reply \"" + reply + "\")", "\"" + reply + "\" to " + signal.getRaw().from() + " by " + channel.toUpperCase(), Map.of("to", signal.getRaw().from(), "channel", channel, "text", reply)));
        }
        if (signal.getKind() == SignalKind.COPARENT_MESSAGE) {
            Person cop = h.coparent().orElse(null);
            String copName = cop == null ? signal.getRaw().from() : cop.getName();
            String to = cop != null && cop.getPhone() != null ? cop.getPhone() : signal.getRaw().from();
            List<String> facts = ex.getTone() == null ? List.of() : ex.getTone().facts();
            String requested = ex.getWhen() == null ? null : Times.fmtTime(ex.getWhen().start());
            String feasible = plan.getEarliestFeasible() == null ? null : Times.fmtTime(plan.getEarliestFeasible());
            String busy = plan.getRationale().stream().filter(r -> r.contains("until")).findFirst().orElse(null);
            boolean folder = Pattern.compile("folder|homework", Pattern.CASE_INSENSITIVE).matcher(signal.getRaw().body()).find();
            List<String> lines = new ArrayList<>();
            lines.add("Hi " + copName + ".");
            if (folder) lines.add("Noted on the maths folder. It will be in " + kidName + "'s bag on Friday.");
            boolean counter = requested != null && feasible != null && !feasible.equals(requested);
            if (counter) {
                String has = busy == null ? kidName + " has an activity" : busy.replaceAll(";.*$", "").replaceFirst("^\\w+ has ", kidName + " has ");
                lines.add("Friday: " + has + ", so the earliest I can have " + kidName + " at yours is " + feasible + ". Does " + feasible + " work?");
            } else if (requested != null) {
                lines.add(requested + " on Friday works. See you then.");
            }
            lines.add(parent);
            String text = String.join(" ", lines);
            out.getActions().add(AgentOutput.action(AGENT, ActionClass.COPARENT_REPLY, "Reply to " + copName + (counter ? " proposing " + feasible : ""), text, Map.of("to", to, "channel", channel, "text", text)));
            if (counter) {
                String accept = "Hi " + copName + ". " + requested + " Friday is fine; " + kidName + " will skip her lesson this week. The maths folder will be in her bag. " + parent;
                String hold = "Hi " + copName + ". This Friday I can't do earlier than the usual 6pm, sorry. The maths folder will be in her bag. " + parent;
                out.getAlternatives().add(new Alternative("Accept " + requested + " and skip the activity", "Tell the studio " + kidName + " will miss this week.", List.of(AgentOutput.action(AGENT, ActionClass.COPARENT_REPLY, "Reply accepting " + requested, accept, Map.of("to", to, "channel", channel, "text", accept)))));
                out.getAlternatives().add(new Alternative("Keep the usual time", "Politely hold the agreed handover.", List.of(AgentOutput.action(AGENT, ActionClass.COPARENT_REPLY, "Reply keeping the usual handover", hold, Map.of("to", to, "channel", channel, "text", hold)))));
            }
            if (folder && ex.getWhen() != null) {
                Map<String, Object> p = new HashMap<>();
                p.put("at", ex.getWhen().start().toLocalDate().atTime(7, 30).toString());
                p.put("text", kidName + ": maths homework folder in bag for " + copName + "'s");
                p.put("personIds", h.parents().stream().map(Person::getId).toList());
                out.getActions().add(AgentOutput.action(AGENT, ActionClass.REMINDER, "Pack " + kidName + "'s maths homework folder", "Reminder the morning of handover.", p));
            }
            out.say("Original message stripped to facts: " + String.join(" ", facts));
            out.setSummary(String.join(" ", facts));
        }
        if (!out.getActions().isEmpty()) ctx.trace(signal.getId(), AGENT, "draft", String.join("; ", out.getActions().stream().map(a -> a.getTitle()).toList()));
        return out;
    }
}
