package app.familyos.service.domain.proposals;

import app.familyos.service.domain.households.ActionClass;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Action {
    @Builder.Default
    private String id = "act_" + UUID.randomUUID().toString().substring(0, 8);
    private ActionClass cls;
    private String title;
    private String detail;
    private String agent;
    private Double amount;
    private String payee;
    @Builder.Default
    private Map<String, Object> payload = new HashMap<>();

    public String payloadString(String key) {
        Object v = payload.get(key);
        return v == null ? null : String.valueOf(v);
    }
}
