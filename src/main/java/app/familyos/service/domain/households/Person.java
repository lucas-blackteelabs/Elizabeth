package app.familyos.service.domain.households;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Person {
    private String id;
    private String name;
    @Builder.Default
    private List<String> aliases = new ArrayList<>();
    private Role role;
    private String householdId;
    private Integer age;
    private String birthDate;
    private String yearLevel;
    private String school;
    @Builder.Default
    private List<String> allergies = new ArrayList<>();
    @Builder.Default
    private List<String> interests = new ArrayList<>();
    @Builder.Default
    private Map<String, SizeRecord> sizes = new HashMap<>();
    @Builder.Default
    private List<AvailabilityBlock> unavailable = new ArrayList<>();
    @Builder.Default
    private boolean canDrive = true;
    private String phone;
    private String email;
    private String custodyPattern;

    public record SizeRecord(String size, String recordedOn) {
    }

    public record AvailabilityBlock(int day, String start, String end, String label, boolean flexible) {
    }
}
