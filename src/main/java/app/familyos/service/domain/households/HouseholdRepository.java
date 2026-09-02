package app.familyos.service.domain.households;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface HouseholdRepository extends MongoRepository<Household, String> {
    Optional<Household> findByOwnerUserId(String ownerUserId);
}
