package app.familyos.service.domain.calendar;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CalendarEventRepository extends MongoRepository<CalendarEvent, String> {
    List<CalendarEvent> findAllByHouseholdIdAndStartBetweenOrderByStart(String householdId, LocalDateTime from, LocalDateTime to);

    List<CalendarEvent> findAllByHouseholdId(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
