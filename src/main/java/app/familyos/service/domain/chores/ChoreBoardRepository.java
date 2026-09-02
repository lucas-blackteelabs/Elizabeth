package app.familyos.service.domain.chores;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ChoreBoardRepository extends MongoRepository<ChoreBoard, String> {
    Optional<ChoreBoard> findByHouseholdId(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
