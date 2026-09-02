package app.familyos.service.domain.households;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Policy {
    private String id;
    private PolicyKind kind;
    private String title;
    private String description;
    @Builder.Default
    private Map<String, Object> params = new HashMap<>();
    @Builder.Default
    private boolean enabled = true;

    public int num(String key, int fallback) {
        Object v = params.get(key);
        return v instanceof Number n ? n.intValue() : fallback;
    }

    public String str(String key, String fallback) {
        Object v = params.get(key);
        return v == null ? fallback : String.valueOf(v);
    }

    @SuppressWarnings("unchecked")
    public List<String> list(String key) {
        Object v = params.get(key);
        return v instanceof List<?> l ? (List<String>) l : List.of();
    }
}
