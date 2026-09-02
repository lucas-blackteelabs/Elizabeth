package app.familyos.service.domain.households;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 0 observe · 1 suggest · 2 prepare · 3 execute and notify · 4 autonomous */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustSetting {
    public static final String[] LABELS = {"Observe", "Suggest", "Prepare", "Execute & notify", "Autonomous"};
    public static final int PROMOTION_THRESHOLD = 3;

    private ActionClass cls;
    private int level;
    private int approvals;
    private int overrides;
    private boolean pinned;
    private Integer maxAmount;
    private boolean verifiedPayeeOnly;
}
