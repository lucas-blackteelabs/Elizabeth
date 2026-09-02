package app.familyos.service.application.households;

import app.familyos.service.domain.households.ActivityCategory;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.Place;
import app.familyos.service.domain.households.Policy;
import app.familyos.service.domain.households.PolicyKind;
import app.familyos.service.domain.households.Role;
import app.familyos.service.domain.households.StandingCommitment;
import app.familyos.service.domain.signals.Channel;
import app.familyos.service.domain.signals.RawMessage;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** The seeded Sydney family and one Tuesday evening's inbox. Used for the demo and the tests. */
public final class DemoHousehold {
    public static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 1, 18, 30);

    private DemoHousehold() {
    }

    public static Household seed(String ownerUserId) {
        Household h = Household.builder().id("hh_demo_" + ownerUserId).ownerUserId(ownerUserId).name("The Mahoneys").homeSuburb("Leichhardt").timezone("Australia/Sydney")
                .values(new ArrayList<>(List.of("resilience", "creativity", "unstructured outdoor time", "keeping the co-parent relationship calm")))
                .giftIdeas(new ArrayList<>(List.of("LEGO", "books", "art supplies"))).demo(true).onboarded(true).demoNow(NOW).build();
        h.getPeople().add(Person.builder().id("p_priya").name("Priya").role(Role.PARENT).householdId(h.getId()).email("priya@example.com").unavailable(new ArrayList<>(List.of(
                new Person.AvailabilityBlock(1, "08:30", "17:30", "Work (office)", false), new Person.AvailabilityBlock(2, "08:30", "17:30", "Work (office)", false),
                new Person.AvailabilityBlock(3, "09:00", "15:00", "Work (from home)", true), new Person.AvailabilityBlock(4, "08:30", "17:30", "Work (office)", false),
                new Person.AvailabilityBlock(5, "08:30", "15:00", "Work (from home)", true)))).build());
        h.getPeople().add(Person.builder().id("p_tom").name("Tom").role(Role.PARENT).householdId(h.getId()).email("tom@example.com").unavailable(new ArrayList<>(List.of(
                new Person.AvailabilityBlock(1, "07:30", "18:00", "Work", false), new Person.AvailabilityBlock(2, "07:30", "18:00", "Work", false), new Person.AvailabilityBlock(3, "07:30", "18:00", "Work", false),
                new Person.AvailabilityBlock(4, "07:30", "18:00", "Work", false), new Person.AvailabilityBlock(5, "07:30", "18:00", "Work", false), new Person.AvailabilityBlock(6, "07:00", "08:30", "Gym", true)))).build());
        h.getPeople().add(Person.builder().id("p_daniel").name("Daniel").role(Role.COPARENT).householdId("hh_daniel").phone("0412 000 111").custodyPattern("Ava with Daniel alternate weekends, Friday 6pm to Sunday 5pm. Next: Fri 4 Sep.").build());
        h.getPeople().add(Person.builder().id("c_ava").name("Ava").role(Role.CHILD).householdId(h.getId()).age(11).birthDate("2015-03-14").yearLevel("Year 6").school("Leichhardt Public School")
                .interests(new ArrayList<>(List.of("piano", "netball", "drawing"))).sizes(new java.util.HashMap<>(Map.of("school uniform", new Person.SizeRecord("12", "2026-02-01")))).build());
        h.getPeople().add(Person.builder().id("c_leo").name("Leo").role(Role.CHILD).householdId(h.getId()).age(8).birthDate("2018-06-22").yearLevel("Year 3").school("Leichhardt Public School")
                .allergies(new ArrayList<>(List.of("tree nuts", "peanuts"))).interests(new ArrayList<>(List.of("football", "cricket", "LEGO", "dinosaurs")))
                .sizes(new java.util.HashMap<>(Map.of("school uniform", new Person.SizeRecord("8", "2026-02-01"), "football boots", new Person.SizeRecord("US 2", "2026-04-10")))).build());
        h.getPeople().add(Person.builder().id("c_maya").name("Maya").role(Role.CHILD).householdId(h.getId()).age(4).birthDate("2022-01-30").yearLevel("Preschool").school("Little Wonders Preschool")
                .interests(new ArrayList<>(List.of("swimming", "painting", "dancing"))).sizes(new java.util.HashMap<>(Map.of("school uniform", new Person.SizeRecord("4", "2026-02-01")))).build());
        h.getPlaces().addAll(List.of(
                place("pl_home", "Home", "Leichhardt", 0, false),
                place("pl_lps", "Leichhardt Public School", "Leichhardt", 6, true, "LPS"),
                place("pl_preschool", "Little Wonders Preschool", "Lilyfield", 8, true),
                place("pl_jubilee", "Jubilee Oval", "Glebe", 12, false, "Jubilee"),
                place("pl_pool", "Ashfield Aquatic Centre", "Ashfield", 14, true, "Ashfield pool", "the pool"),
                place("pl_piano", "Inner West Music Studio", "Petersham", 10, true),
                place("pl_netball", "Balmain Netball Courts", "Balmain", 12, false),
                place("pl_clinic", "Balmain Paediatrics", "Balmain", 13, false, "Dr Chen"),
                place("pl_flipout", "Flip Out Trampoline Park", "Castle Hill", 45, false, "Flip Out"),
                place("pl_zoo", "Taronga Zoo", "Mosman", 40, false),
                place("pl_daniel", "Daniel's place", "Marrickville", 15, false, "Daniel's", "mine"),
                place("pl_cricket", "Petersham Oval", "Petersham", 9, false)));
        h.getStanding().addAll(List.of(
                StandingCommitment.builder().id("s_footy").personId("c_leo").title("U8s football").category(ActivityCategory.SPORT).day(6).start("09:00").end("10:00").placeId("pl_jubilee").seasonFrom("2026-04-01").seasonTo("2026-09-13").costPerTerm(140).usualDriverId("p_priya").build(),
                StandingCommitment.builder().id("s_swim").personId("c_maya").title("Swimming lesson").category(ActivityCategory.SPORT).day(6).start("10:30").end("11:00").placeId("pl_pool").costPerTerm(190).usualDriverId("p_priya").build(),
                StandingCommitment.builder().id("s_piano").personId("c_ava").title("Piano lesson").category(ActivityCategory.CREATIVE).day(5).start("16:30").end("17:15").placeId("pl_piano").costPerTerm(420).usualDriverId("p_priya").build(),
                StandingCommitment.builder().id("s_netball").personId("c_ava").title("Netball training").category(ActivityCategory.SPORT).day(3).start("16:30").end("17:30").placeId("pl_netball").seasonFrom("2026-04-01").seasonTo("2026-09-13").costPerTerm(160).usualDriverId("p_priya").build(),
                StandingCommitment.builder().id("s_art").personId("c_leo").title("Art club").category(ActivityCategory.CREATIVE).day(4).start("15:30").end("16:30").placeId("pl_lps").costPerTerm(90).build()));
        h.getPolicies().addAll(List.of(
                policy("pol_radius", PolicyKind.TRANSIT_RADIUS, "Weekend activities within 30 minutes", "Recurring weekend programs must be within a 30-minute drive of home.", Map.of("maxMinutes", 30, "appliesTo", "recurring")),
                policy("pol_evening", PolicyKind.EVENING_CUTOFF, "Under-6s home by 6:30pm on school nights", "No commitments for children under 6 that end after 6:30pm Sunday to Thursday.", Map.of("maxAge", 5, "cutoff", "18:30")),
                policy("pol_nuts", PolicyKind.ALLERGEN, "Nut allergy is non-negotiable", "Any food-adjacent event for Leo must carry an allergy note; the RSVP must state it.", Map.of("childId", "c_leo", "allergens", List.of("tree nuts", "peanuts"))),
                policy("pol_max", PolicyKind.MAX_ACTIVITIES, "At most two structured activities per child per season", "Protects unstructured time.", Map.of("max", 2)),
                policy("pol_creative", PolicyKind.ONE_PER_CATEGORY, "One creative program per child per term", "Each child has at least one creative activity each term.", Map.of("category", "creative", "min", 1)),
                policy("pol_budget", PolicyKind.BUDGET, "Activities budget $600 per month", "Registrations and fees across the household.", Map.of("monthly", 600)),
                policy("pol_autopay", PolicyKind.AUTO_PAY_CAP, "Auto-pay verified payees under $50", "School, club and clinic fees under the cap are paid without asking.", Map.of("maxAmount", 50)),
                policy("pol_gift", PolicyKind.GIFT_CAP, "Birthday gifts up to $30", "Default gift budget for children's parties.", Map.of("maxAmount", 30)),
                policy("pol_sunday", PolicyKind.QUIET_BLOCK, "Sunday mornings unplugged", "Keep Sunday before noon free of scheduled commitments where possible.", Map.of("day", 0, "until", "12:00")),
                policy("pol_custody", PolicyKind.CUSTODY, "Ava's custody schedule", "Ava is with Daniel alternate weekends from Friday 6pm. Handover changes need both parents' agreement and go through the ledger.", Map.of("childId", "c_ava", "coparentId", "p_daniel", "handoverDay", 5, "handoverTime", "18:00", "nextHandover", "2026-09-04"))));
        return h;
    }

    private static Place place(String id, String name, String suburb, int mins, boolean verified, String... aliases) {
        return Place.builder().id(id).name(name).suburb(suburb).travelMinutesFromHome(mins).verifiedPayee(verified).aliases(new ArrayList<>(List.of(aliases))).build();
    }

    private static Policy policy(String id, PolicyKind kind, String title, String description, Map<String, Object> params) {
        return Policy.builder().id(id).kind(kind).title(title).description(description).params(new java.util.HashMap<>(params)).enabled(true).build();
    }

    public static List<RawMessage> inbox() {
        return List.of(
                new RawMessage(Channel.EMAIL, "office@leichhardtps.nsw.edu.au", "Year 6 Excursion – Taronga Zoo – Thursday 10 September",
                        "Dear Parents and Carers,\n\nYear 6 will visit Taronga Zoo on Thursday 10 September as part of the Living World unit. Students depart school at 8:15am and return by 3:00pm. The cost is $38 per student.\n\nPlease complete the permission note and payment via the school portal by Friday 4 September. Students should bring a packed lunch, a hat and a refillable water bottle. As we are a nut-free school, please do not include nut products.\n\nKind regards,\nMs Patel, Year 6 Coordinator"),
                new RawMessage(Channel.WHATSAPP, "Coach Sam (U8 Lions)", null, "Hi all, sorry for the late notice. This Saturday's U8s game is moved from 9am to 10:30am at Jubilee Oval due to ground works on the top field. Same 15 min early arrival please. Cheers, Sam"),
                new RawMessage(Channel.WHATSAPP, "Jess (Harper's mum)", null, "Hi Priya! Harper is turning 8 and would love Leo to come to her party 🎉 Sunday 13 September, 2-4pm at Flip Out Trampoline Park, Castle Hill. Pizza and cake provided. RSVP by Tuesday 8 September to Jess on 0433 222 333. Grip socks required at Flip Out!"),
                new RawMessage(Channel.SMS, "Balmain Paediatrics", null, "Reminder: Maya Mahoney has an appointment with Dr Chen on Wed 9 Sep at 3:15pm at Balmain Paediatrics, 12 Darling St. Please bring her Blue Book and Medicare card. Reply Y to confirm or call 9555 0100 to reschedule."),
                new RawMessage(Channel.EMAIL, "uniformshop@leichhardtps.nsw.edu.au", "Summer uniform orders – order by 25 September",
                        "Hi families,\n\nTerm 4 starts Monday 12 October and students move to summer uniform. To guarantee delivery before term starts, please place orders by Friday 25 September. Polo shirts $28, shorts $24, dresses $42. Order online via the uniform shop portal. Sizes run small; most students need a size up from last year."),
                new RawMessage(Channel.SMS, "Daniel", null, "You AGAIN forgot to send Ava's maths homework folder last weekend. This is typical. I need her at mine by 5pm this Friday not 6, I have plans. Make sure the folder is in her bag."),
                new RawMessage(Channel.EMAIL, "registrations@innerwestcricket.com.au", "Summer cricket registrations now open",
                        "Milo Blast (ages 5-8) runs Saturday mornings 8:30-10am at Petersham Oval from Saturday 17 October to Saturday 12 December. $180 per player including shirt and bat. Register by Thursday 1 October. Under 11s Friday nights 5-7pm also open."),
                new RawMessage(Channel.EMAIL, "newsletter@leichhardtps.nsw.edu.au", "LPS Newsletter Week 7",
                        "Book Week photos are now on the school website. Congratulations to the Year 3 debating team. Reminder that the P&C meeting is Tuesday 15 September at 7pm in the library; all welcome. Canteen specials this week: sushi Wednesday."));
    }

    public static final String SAMPLE_INTRO = "Hi, I'm Priya and my partner is Tom. We live in Leichhardt in Sydney. Three kids: Ava is 11 and in Year 6 at Leichhardt Public School, she does piano on Fridays at 4:30 in Petersham and netball training Wednesdays. Leo is 8, Year 3 at the same school, football on Saturday mornings at 9 at Jubilee Oval and art club Thursdays after school; Leo is allergic to nuts. Maya is 4 at Little Wonders Preschool in Lilyfield and has swimming Saturdays at 10:30 at Ashfield pool. Ava's dad Daniel lives in Marrickville and has her every second weekend from Friday 6pm. I work from home Wednesdays and Fridays, in the office the other days; Tom works full time. We care about the kids being resilient, creative, and having proper unstructured time outdoors. Keep things calm with Daniel.";
}
