package app.familyos.service.domain.calendar;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface OutboundMessageRepository extends MongoRepository<OutboundMessage, String> {
    List<OutboundMessage> findAllByHouseholdIdOrderByAtDesc(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
