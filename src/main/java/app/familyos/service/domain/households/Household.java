package app.familyos.service.domain.households;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * The household graph: people, places, standing commitments, the family's own
 * rules and how much autonomy the agents have earned. One document per family.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "households")
public class Household {
    @Id
    private String id;
    @Indexed
    private String ownerUserId;
    private String name;
    private String homeSuburb;
    @Builder.Default
    private String timezone = "Australia/Sydney";
    @Builder.Default
    private List<Person> people = new ArrayList<>();
    @Builder.Default
    private List<Place> places = new ArrayList<>();
    @Builder.Default
    private List<StandingCommitment> standing = new ArrayList<>();
    @Builder.Default
    private List<Policy> policies = new ArrayList<>();
    @Builder.Default
    private List<TrustSetting> trust = new ArrayList<>();
    @Builder.Default
    private List<String> values = new ArrayList<>();
    @Builder.Default
    private List<String> giftIdeas = new ArrayList<>();
    @Builder.Default
    private List<String> promotionsOffered = new ArrayList<>();
    @Builder.Default
    private List<IcsFeed> icsFeeds = new ArrayList<>();
    private boolean demo;
    private boolean onboarded;
    /** When set, the household runs on a frozen clock (the seeded demo). */
    private LocalDateTime demoNow;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

    public Optional<Person> person(String id) {
        return people.stream().filter(p -> p.getId().equals(id)).findFirst();
    }

    public String personName(String id) {
        return person(id).map(Person::getName).orElse("someone");
    }

    public Optional<Place> place(String id) {
        return id == null ? Optional.empty() : places.stream().filter(p -> p.getId().equals(id)).findFirst();
    }

    public String placeName(String id) {
        return place(id).map(Place::getName).orElse(null);
    }

    public List<Person> children() {
        return people.stream().filter(p -> p.getRole() == Role.CHILD).toList();
    }

    public List<Person> parents() {
        return people.stream().filter(p -> p.getRole() == Role.PARENT).toList();
    }

    public Optional<Person> coparent() {
        return people.stream().filter(p -> p.getRole() == Role.COPARENT).findFirst();
    }

    public Optional<Policy> policy(PolicyKind kind) {
        return policies.stream().filter(p -> p.getKind() == kind && p.isEnabled()).findFirst();
    }

    public TrustSetting trust(ActionClass cls) {
        return trust.stream().filter(t -> t.getCls() == cls).findFirst()
                .orElseThrow(() -> new IllegalStateException("No trust setting for " + cls));
    }

    public Optional<StandingCommitment> standing(String id) {
        return standing.stream().filter(s -> s.getId().equals(id)).findFirst();
    }
}
