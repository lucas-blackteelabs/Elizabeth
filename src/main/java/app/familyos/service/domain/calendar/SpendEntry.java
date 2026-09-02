package app.familyos.service.domain.calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "spend_entries")
public class SpendEntry {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private String month; // YYYY-MM
    private double amount;
    private String label;
    private String signalId;
}
