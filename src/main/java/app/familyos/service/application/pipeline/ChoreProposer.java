package app.familyos.service.application.pipeline;

import app.familyos.service.domain.chores.ChoreBoard;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;

import java.util.regex.Pattern;

/** Turns what is coming up into something a child can own. One per signal at most, and only for children old enough. */
public final class ChoreProposer {
    private static final String[] DAYS = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};

    private ChoreProposer() {
    }

    public static void propose(PipelineContext ctx, Signal signal) {
        Extracted ex = signal.getExtracted();
        if (ex.getWhen() == null || ctx.getBoard() == null) return;
        for (String cid : ex.getChildIds()) {
            Person kid = ctx.getHousehold().person(cid).orElse(null);
            if (kid == null || kid.getAge() == null || kid.getAge() < 7) continue;
            String title = null;
            int points = 5;
            String plain = ex.getTitle().replaceFirst("^[^:]+:\\s*", "").toLowerCase();
            if (signal.getKind() == SignalKind.PERMISSION_REQUEST && !ex.getItems().isEmpty()) {
                title = "Pack your own bag for " + plain + ": " + String.join(", ", ex.getItems());
                points = 8;
            } else if (signal.getKind() == SignalKind.INVITATION) {
                title = "Write the birthday card and wrap the present";
            } else if (signal.getKind() == SignalKind.COPARENT_MESSAGE && Pattern.compile("folder|homework|bag", Pattern.CASE_INSENSITIVE).matcher(signal.getRaw().body()).find()) {
                title = "Put your homework folder in your bag for the weekend";
            } else if (signal.getKind() == SignalKind.SCHEDULE_CHANGE || signal.getKind() == SignalKind.EVENT) {
                title = "Get your kit ready for " + DAYS[Times.weekday(ex.getWhen().start())];
                points = 4;
            }
            if (title == null) continue;
            String id = "ch_" + signal.getId() + "_" + cid;
            if (ctx.getBoard().getChores().stream().anyMatch(c -> c.getId().equals(id))) continue;
            ctx.getBoard().getChores().add(ChoreBoard.Chore.builder().id(id).childId(cid).title(title).points(points).cadence(ChoreBoard.Cadence.ONCE)
                    .dueAt(Times.withTime(ex.getWhen().start().minusDays(1), "19:00")).source("agent").sourceId(signal.getId()).build());
            ctx.markBoardChanged();
            ctx.trace(signal.getId(), "chores", "propose", kid.getName() + ": \"" + title + "\" (+" + points + ")");
        }
    }
}
