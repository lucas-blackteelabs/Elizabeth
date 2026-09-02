package app.familyos.service.domain.ledger;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LedgerEntryRepository extends MongoRepository<LedgerEntry, String> {
    List<LedgerEntry> findAllByHouseholdId(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
