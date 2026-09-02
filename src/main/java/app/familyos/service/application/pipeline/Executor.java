package app.familyos.service.application.pipeline;

import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.calendar.OutboundMessage;
import app.familyos.service.domain.calendar.Reminder;
import app.familyos.service.domain.calendar.SpendEntry;
import app.familyos.service.domain.households.ActivityCategory;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.StandingCommitment;
import app.familyos.service.domain.proposals.Action;
import app.familyos.service.infrastructure.time.Times;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Applies an action to household state. Everything here is reversible from the ledger. */
public final class Executor {
    private Executor() {
    }

    @SuppressWarnings("unchecked")
    public static void execute(PipelineContext ctx, Action a, String signalId, CalendarEvent candidate) {
        var p = a.getPayload();
        switch (a.getCls()) {
            case CALENDAR_WRITE -> {
                String op = a.payloadString("op");
                if ("add".equals(op)) {
                    if (candidate != null && ctx.getCalendar().stream().noneMatch(e -> e.getId().equals(candidate.getId()))) ctx.touch(candidate);
                } else if ("move".equals(op)) {
                    find(ctx, a.payloadString("eventId")).ifPresent(ev -> {
                        ev.getNotes().add("Moved from " + Times.fmtTime(ev.getStart()));
                        ev.setStart(LocalDateTime.parse(a.payloadString("start")));
                        ev.setEnd(LocalDateTime.parse(a.payloadString("end")));
                        if (candidate != null && candidate.getPlaceId() != null) ev.setPlaceId(candidate.getPlaceId());
                        ctx.touch(ev);
                    });
                } else if ("assign_driver".equals(op)) {
                    Optional<CalendarEvent> ev = find(ctx, a.payloadString("eventId"));
                    if (ev.isEmpty() && candidate != null && candidate.getId().equals(a.payloadString("eventId"))) {
                        ctx.touch(candidate);
                        ev = Optional.of(candidate);
                    }
                    ev.ifPresent(e -> {
                        e.setDriverId(a.payloadString("driverId"));
                        ctx.touch(e);
                    });
                }
            }
            case REMINDER -> ctx.getNewReminders().add(Reminder.builder().id("rem_" + UUID.randomUUID().toString().substring(0, 8)).householdId(ctx.getHousehold().getId())
                    .at(LocalDateTime.parse(a.payloadString("at"))).text(a.payloadString("text")).personIds(p.get("personIds") instanceof List<?> l ? new ArrayList<>((List<String>) l) : new ArrayList<>()).sourceId(signalId).build());
            case PAYMENT, PURCHASE -> ctx.getNewSpend().add(SpendEntry.builder().id("sp_" + UUID.randomUUID().toString().substring(0, 8)).householdId(ctx.getHousehold().getId())
                    .month(Times.month(ctx.getNow())).amount(a.getAmount() == null ? 0 : a.getAmount()).label(a.getTitle()).signalId(signalId).build());
            case ENROLMENT -> {
                String childId = a.payloadString("childId");
                ctx.getHousehold().getStanding().add(StandingCommitment.builder().id("s_" + UUID.randomUUID().toString().substring(0, 8)).personId(childId).title(a.payloadString("title"))
                        .category(ActivityCategory.valueOf(a.payloadString("category"))).day(((Number) p.get("day")).intValue()).start(a.payloadString("start")).end(a.payloadString("end"))
                        .placeId(a.payloadString("placeId")).seasonFrom(a.payloadString("seasonFrom")).seasonTo(a.payloadString("seasonTo"))
                        .costPerTerm(a.getAmount() == null ? null : a.getAmount().intValue())
                        .usualDriverId(ctx.getHousehold().parents().stream().map(Person::getId).findFirst().orElse(null)).build());
                ctx.markHouseholdChanged();
                if (a.getAmount() != null) ctx.getNewSpend().add(SpendEntry.builder().id("sp_" + UUID.randomUUID().toString().substring(0, 8)).householdId(ctx.getHousehold().getId())
                        .month(a.payloadString("seasonFrom").substring(0, 7)).amount(a.getAmount()).label(a.getTitle()).signalId(signalId).build());
            }
            case OUTBOUND_MESSAGE, COPARENT_REPLY -> ctx.getNewMessages().add(OutboundMessage.builder().id("msg_" + UUID.randomUUID().toString().substring(0, 8)).householdId(ctx.getHousehold().getId())
                    .to(a.payloadString("to") == null ? "" : a.payloadString("to")).channel(a.payloadString("channel") == null ? "sms" : a.payloadString("channel"))
                    .text(a.payloadString("text") == null ? a.getDetail() : a.payloadString("text")).status("sent").signalId(signalId).at(ctx.getNow()).build());
            case SIGN_FORM -> {
            }
        }
    }

    private static Optional<CalendarEvent> find(PipelineContext ctx, String id) {
        return ctx.getCalendar().stream().filter(e -> e.getId().equals(id)).findFirst();
    }
}
