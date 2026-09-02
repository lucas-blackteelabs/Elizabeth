package app.familyos.service.domain.proposals;

public record Flag(Level level, String policyId, String message) {
    public enum Level {INFO, WARN, BLOCK}

    public static Flag info(String message) {
        return new Flag(Level.INFO, null, message);
    }

    public static Flag warn(String message) {
        return new Flag(Level.WARN, null, message);
    }

    public static Flag block(String message) {
        return new Flag(Level.BLOCK, null, message);
    }
}
