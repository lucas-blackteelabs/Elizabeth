package app.familyos.service.domain.calendar;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SpendEntryRepository extends MongoRepository<SpendEntry, String> {
    List<SpendEntry> findAllByHouseholdId(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
