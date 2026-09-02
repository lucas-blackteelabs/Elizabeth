package app.familyos.service.domain.signals;

public record RawMessage(Channel channel, String from, String subject, String body) {
    public String text() {
        return (subject == null ? "" : subject) + "\n" + body;
    }
}
