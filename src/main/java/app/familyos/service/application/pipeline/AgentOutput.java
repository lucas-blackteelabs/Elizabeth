package app.familyos.service.application.pipeline;

import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.proposals.Action;
import app.familyos.service.domain.proposals.Alternative;
import app.familyos.service.domain.proposals.Flag;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** What every specialist hands back to the orchestrator. */
@Data
public class AgentOutput {
    private final List<Action> actions = new ArrayList<>();
    private final List<Alternative> alternatives = new ArrayList<>();
    private final List<Flag> flags = new ArrayList<>();
    private final List<String> rationale = new ArrayList<>();
    private String summary;

    public static Action action(String agent, ActionClass cls, String title, String detail, Map<String, Object> payload) {
        Action a = Action.builder().cls(cls).title(title).detail(detail).agent(agent).build();
        if (payload != null) a.getPayload().putAll(payload);
        return a;
    }

    public AgentOutput merge(AgentOutput other) {
        actions.addAll(other.actions);
        alternatives.addAll(other.alternatives);
        flags.addAll(other.flags);
        rationale.addAll(other.rationale);
        if (other.summary != null) summary = other.summary;
        return this;
    }

    public void say(String s) {
        rationale.add(s);
    }
}
