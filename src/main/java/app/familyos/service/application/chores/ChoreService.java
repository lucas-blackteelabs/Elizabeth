package app.familyos.service.application.chores;

import app.familyos.service.application.exception.BadRequestException;
import app.familyos.service.domain.chores.ChoreBoard;
import app.familyos.service.domain.chores.ChoreBoardRepository;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.infrastructure.time.Times;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChoreService {
    private final ChoreBoardRepository choreBoardRepository;

    public ChoreBoard ensureBoard(Household h) {
        return choreBoardRepository.findByHouseholdId(h.getId()).orElseGet(() -> choreBoardRepository.save(defaults(h)));
    }

    public record ChildSummary(String childId, String name, int balance, int week, int streak, List<String> due, List<String> doneToday) {
    }

    public record BoardView(ChoreBoard board, List<ChildSummary> perChild) {
    }

    public BoardView view(Household h) {
        ChoreBoard board = ensureBoard(h);
        LocalDate day = Times.now(h).toLocalDate();
        List<ChildSummary> per = h.children().stream().map(k -> new ChildSummary(k.getId(), k.getName(), board.balance(k.getId()), board.earnedThisWeek(k.getId(), day), board.streak(k.getId(), day),
                board.getChores().stream().filter(c -> c.getChildId().equals(k.getId()) && ChoreBoard.isDue(c, day)).map(ChoreBoard.Chore::getId).toList(),
                board.getChores().stream().filter(c -> c.getChildId().equals(k.getId()) && c.getDoneOn().contains(day.toString())).map(ChoreBoard.Chore::getId).toList())).toList();
        return new BoardView(board, per);
    }

    public ChoreBoard complete(Household h, String choreId) {
        ChoreBoard board = ensureBoard(h);
        LocalDate day = Times.now(h).toLocalDate();
        board.getChores().stream().filter(c -> c.getId().equals(choreId) && ChoreBoard.isDue(c, day)).findFirst().ifPresent(c -> {
            c.getDoneOn().add(day.toString());
            board.getPoints().add(new ChoreBoard.PointEvent(id("pt"), c.getChildId(), Times.now(h), c.getPoints(), c.getTitle()));
        });
        return choreBoardRepository.save(board);
    }

    public ChoreBoard undo(Household h, String choreId) {
        ChoreBoard board = ensureBoard(h);
        String day = Times.now(h).toLocalDate().toString();
        board.getChores().stream().filter(c -> c.getId().equals(choreId)).findFirst().ifPresent(c -> {
            int i = c.getDoneOn().lastIndexOf(day);
            if (i == -1) return;
            c.getDoneOn().remove(i);
            for (int j = board.getPoints().size() - 1; j >= 0; j--) {
                ChoreBoard.PointEvent p = board.getPoints().get(j);
                if (p.childId().equals(c.getChildId()) && p.reason().equals(c.getTitle()) && p.at().toLocalDate().toString().equals(day)) {
                    board.getPoints().remove(j);
                    break;
                }
            }
        });
        return choreBoardRepository.save(board);
    }

    public ChoreBoard add(Household h, String childId, String title, int points, ChoreBoard.Cadence cadence) {
        ChoreBoard board = ensureBoard(h);
        board.getChores().add(ChoreBoard.Chore.builder().childId(childId).title(title).points(points).cadence(cadence).source("family").build());
        return choreBoardRepository.save(board);
    }

    public ChoreBoard remove(Household h, String choreId) {
        ChoreBoard board = ensureBoard(h);
        board.getChores().removeIf(c -> c.getId().equals(choreId));
        return choreBoardRepository.save(board);
    }

    public ChoreBoard claim(Household h, String childId, String rewardId) {
        ChoreBoard board = ensureBoard(h);
        ChoreBoard.Reward reward = board.getRewards().stream().filter(r -> r.id().equals(rewardId)).findFirst().orElseThrow(() -> new BadRequestException("No such reward"));
        if (board.balance(childId) < reward.cost()) throw new BadRequestException("Not enough points yet.");
        board.getPoints().add(new ChoreBoard.PointEvent(id("pt"), childId, Times.now(h), -reward.cost(), "Reward: " + reward.title()));
        board.getClaims().add(ChoreBoard.Claim.builder().id(id("cl")).childId(childId).rewardId(rewardId).at(Times.now(h)).approved(false).build());
        return choreBoardRepository.save(board);
    }

    public ChoreBoard approve(Household h, String claimId) {
        ChoreBoard board = ensureBoard(h);
        board.getClaims().stream().filter(c -> c.getId().equals(claimId)).findFirst().ifPresent(c -> c.setApproved(true));
        return choreBoardRepository.save(board);
    }

    public ChoreBoard addReward(Household h, String title, int cost) {
        ChoreBoard board = ensureBoard(h);
        board.getRewards().add(new ChoreBoard.Reward(id("rw"), title, cost));
        return choreBoardRepository.save(board);
    }

    private static String id(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /** Age-appropriate defaults. Deliberately few: the board should feel doable, not like a rota. */
    public static ChoreBoard defaults(Household h) {
        ChoreBoard board = ChoreBoard.builder().householdId(h.getId()).build();
        for (Person kid : h.children()) {
            int age = kid.getAge() == null ? 8 : kid.getAge();
            List<Object[]> defs = age <= 5 ? List.of(new Object[]{"Put toys away", 2, ChoreBoard.Cadence.DAILY}, new Object[]{"Help set the table", 3, ChoreBoard.Cadence.DAILY}, new Object[]{"Books back on the shelf", 2, ChoreBoard.Cadence.WEEKLY})
                    : age <= 9 ? List.of(new Object[]{"Pack your school bag", 5, ChoreBoard.Cadence.DAILY}, new Object[]{"Feed the pet or water the plants", 3, ChoreBoard.Cadence.DAILY}, new Object[]{"Tidy your room", 8, ChoreBoard.Cadence.WEEKLY}, new Object[]{"Set the table", 3, ChoreBoard.Cadence.DAILY})
                    : List.of(new Object[]{"Pack your own bag and lunchbox", 5, ChoreBoard.Cadence.DAILY}, new Object[]{"Unload the dishwasher", 6, ChoreBoard.Cadence.DAILY}, new Object[]{"Homework done before screens", 5, ChoreBoard.Cadence.DAILY}, new Object[]{"Clean your room properly", 10, ChoreBoard.Cadence.WEEKLY});
            for (Object[] d : defs) board.getChores().add(ChoreBoard.Chore.builder().childId(kid.getId()).title((String) d[0]).points((Integer) d[1]).cadence((ChoreBoard.Cadence) d[2]).source("family").build());
        }
        board.setRewards(new ArrayList<>(List.of(new ChoreBoard.Reward(id("rw"), "Pick Friday movie night", 30), new ChoreBoard.Reward(id("rw"), "Stay up 30 minutes later", 40), new ChoreBoard.Reward(id("rw"), "$5 pocket money", 50), new ChoreBoard.Reward(id("rw"), "Choose Sunday breakfast", 25))));
        return board;
    }
}
