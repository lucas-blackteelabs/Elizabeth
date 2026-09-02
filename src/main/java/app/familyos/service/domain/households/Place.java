package app.familyos.service.domain.households;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Place {
    private String id;
    private String name;
    private String suburb;
    @Builder.Default
    private List<String> aliases = new ArrayList<>();
    private int travelMinutesFromHome;
    private boolean verifiedPayee;
}
