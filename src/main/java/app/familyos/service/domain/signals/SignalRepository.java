package app.familyos.service.domain.signals;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SignalRepository extends MongoRepository<Signal, String> {
    List<Signal> findAllByHouseholdIdOrderByReceivedAtDesc(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
