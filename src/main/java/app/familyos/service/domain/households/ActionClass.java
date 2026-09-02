package app.familyos.service.domain.households;

public enum ActionClass {
    CALENDAR_WRITE("Calendar changes"),
    REMINDER("Reminders"),
    SIGN_FORM("Signing forms"),
    PAYMENT("Payments"),
    OUTBOUND_MESSAGE("Messages to coaches, schools, other parents"),
    COPARENT_REPLY("Replies to co-parent"),
    PURCHASE("Purchases"),
    ENROLMENT("Enrolments and registrations");

    public final String label;

    ActionClass(String label) {
        this.label = label;
    }
}
