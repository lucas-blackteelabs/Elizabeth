package app.familyos.service.domain.trace;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TraceStepRepository extends MongoRepository<TraceStep, String> {
    List<TraceStep> findAllByHouseholdIdOrderByAt(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
