package app.familyos.service.domain.households;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandingCommitment {
    private String id;
    private String personId;
    private String title;
    private ActivityCategory category;
    /** 0 = Sunday, matching JavaScript and the mobile app. */
    private int day;
    private String start;
    private String end;
    private String placeId;
    private String seasonFrom;
    private String seasonTo;
    private Integer costPerTerm;
    private String usualDriverId;

    public boolean inSeason(String date) {
        if (seasonFrom == null || seasonTo == null) return true;
        return date.compareTo(seasonFrom) >= 0 && date.compareTo(seasonTo) <= 0;
    }
}
