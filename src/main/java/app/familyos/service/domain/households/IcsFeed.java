package app.familyos.service.domain.households;

import java.time.LocalDateTime;

public record IcsFeed(String url, String label, String childId, LocalDateTime lastSync, int events) {
}
