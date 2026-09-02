package app.familyos.service.domain.proposals;

import java.util.List;

public record Alternative(String label, String detail, List<Action> actions) {
}
