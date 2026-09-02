package app.familyos.service.domain.calendar;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReminderRepository extends MongoRepository<Reminder, String> {
    List<Reminder> findAllByHouseholdIdOrderByAt(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
