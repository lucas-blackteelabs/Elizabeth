package app.familyos.service.application.households;

import app.familyos.service.application.agents.completion.HouseholdDraftCompletion;
import app.familyos.service.domain.households.ActivityCategory;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.Place;
import app.familyos.service.domain.households.Policy;
import app.familyos.service.domain.households.PolicyKind;
import app.familyos.service.domain.households.Role;
import app.familyos.service.domain.households.StandingCommitment;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Onboarding without a model: good enough to keep the flow moving. And the draft-to-household mapping both paths share. */
public final class OnboardingRules {
    private static final List<String> DAYS = List.of("sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday");

    private OnboardingRules() {
    }

    public static HouseholdDraftCompletion draft(String text) {
        List<HouseholdDraftCompletion.Child> children = new ArrayList<>();
        Matcher m = Pattern.compile("\\b([A-Z][a-z]+)\\s*(?:\\(|,\\s*|\\s+is\\s+|\\s+who'?s\\s+|\\s+)(\\d{1,2})\\)?(?:\\s*(?:yo|years? old|y\\.o\\.|,|\\)))?").matcher(text);
        while (m.find()) {
            int age = Integer.parseInt(m.group(2));
            String name = m.group(1);
            if (age < 1 || age > 18 || children.stream().anyMatch(c -> c.name().equals(name))) continue;
            if (Pattern.compile("^(Year|Grade|Term|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$").matcher(name).find()) continue;
            children.add(new HouseholdDraftCompletion.Child(name, age, null, null, new ArrayList<>(), new ArrayList<>()));
        }
        List<HouseholdDraftCompletion.Adult> adults = new ArrayList<>();
        find(text, "\\b(?:I'?m|I am|my name is)\\s+([A-Z][a-z]+)").ifPresent(n -> adults.add(new HouseholdDraftCompletion.Adult(n, "parent", null, true)));
        find(text, "\\b(?:my )?(?:partner|husband|wife)\\s+(?:is\\s+)?([A-Z][a-z]+)").ifPresent(n -> adults.add(new HouseholdDraftCompletion.Adult(n, "parent", null, true)));
        Optional<String> ex = find(text, "\\b(?:my )?(?:ex|ex-husband|ex-wife|ex-partner|co-parent)\\s*(?:,|is)?\\s*([A-Z][a-z]+)");
        if (ex.isEmpty()) ex = find(text, "\\b[A-Z][a-z]+'s (?:dad|mum|mom|father|mother)\\s+(?:is\\s+)?([A-Z][a-z]+)");
        ex.filter(n -> adults.stream().noneMatch(a -> a.name().equals(n))).ifPresent(n -> adults.add(new HouseholdDraftCompletion.Adult(n, "coparent", null, true)));
        Matcher al = Pattern.compile("\\b([A-Z][a-z]+)\\s+(?:is|has)\\s+(?:allergic to|an? [\\w ]*allergy to)\\s+([a-z ]+?)(?:[.,;]|$)", Pattern.CASE_INSENSITIVE).matcher(text);
        List<HouseholdDraftCompletion.Child> withAllergies = new ArrayList<>();
        Map<String, List<String>> allergies = new HashMap<>();
        while (al.find()) allergies.computeIfAbsent(al.group(1).toLowerCase(Locale.ROOT), k -> new ArrayList<>()).addAll(List.of(al.group(2).split(" and |, ")));
        Matcher sm = Pattern.compile("\\b([A-Z][A-Za-z']+(?:\\s+[A-Z][A-Za-z']+)*\\s+(?:Public School|Primary School|Primary|Public|School|College|Grammar|Preschool|Kindergarten|Kindy|Childcare))\\b").matcher(text);
        LinkedHashSet<String> schools = new LinkedHashSet<>();
        while (sm.find()) schools.add(sm.group(1));
        Pattern interestsRe = Pattern.compile("\\b(football|soccer|cricket|swimming|piano|guitar|netball|drawing|art|dance|ballet|coding|chess|tennis|gymnastics|surfing|rugby|basketball|drama|LEGO|reading)\\b", Pattern.CASE_INSENSITIVE);
        for (HouseholdDraftCompletion.Child c : children) {
            String school = null;
            String year = null;
            for (String s : schools) {
                if (Pattern.compile(Pattern.quote(c.name()) + "[^.]*?" + Pattern.quote(s)).matcher(text).find()) {
                    school = s;
                    break;
                }
            }
            Matcher ym = Pattern.compile(Pattern.quote(c.name()) + "[^.]*?\\b(Year \\d{1,2}|Kindy|Kindergarten|Preschool|Prep)\\b", Pattern.CASE_INSENSITIVE).matcher(text);
            if (ym.find()) year = ym.group(1);
            int idx = text.indexOf(c.name());
            String seg = text.substring(idx, Math.min(text.length(), idx + 220));
            LinkedHashSet<String> interests = new LinkedHashSet<>();
            Matcher im = interestsRe.matcher(seg);
            while (im.find()) interests.add(im.group(1).toLowerCase(Locale.ROOT));
            withAllergies.add(new HouseholdDraftCompletion.Child(c.name(), c.age(), year, school, allergies.getOrDefault(c.name().toLowerCase(Locale.ROOT), new ArrayList<>()), new ArrayList<>(interests)));
        }
        String suburb = find(text, "\\b(?:in|from|live in|based in)\\s+([A-Z][a-z]+(?:\\s[A-Z][a-z]+)?)\\b").orElse("");
        String familyName = !adults.isEmpty() ? adults.get(0).name() + "'s family" : !withAllergies.isEmpty() ? withAllergies.get(0).name() + "'s family" : "Our family";
        return new HouseholdDraftCompletion(familyName, suburb, adults, withAllergies, new ArrayList<>(), schools.stream().map(s -> new HouseholdDraftCompletion.PlaceDraft(s, null, null)).toList(), new ArrayList<>(), new ArrayList<>());
    }

    private static Optional<String> find(String text, String re) {
        Matcher m = Pattern.compile(re).matcher(text);
        return m.find() ? Optional.of(m.group(1)) : Optional.empty();
    }

    public static Household toHousehold(HouseholdDraftCompletion d, String ownerUserId) {
        String hid = "hh_" + slug(d.familyName());
        Household h = Household.builder().id(hid + "_" + ownerUserId).ownerUserId(ownerUserId).name(d.familyName()).homeSuburb(d.homeSuburb() == null ? "" : d.homeSuburb())
                .values(new ArrayList<>(d.values() == null ? List.of() : d.values())).giftIdeas(new ArrayList<>(List.of("LEGO", "books", "art supplies"))).onboarded(true).build();
        for (HouseholdDraftCompletion.Adult a : nn(d.adults())) {
            Role role = a.role() == null ? Role.PARENT : Role.valueOf(a.role().toUpperCase(Locale.ROOT));
            h.getPeople().add(Person.builder().id("p_" + slug(a.name())).name(a.name()).role(role).householdId(role == Role.COPARENT ? h.getId() + "_" + slug(a.name()) : h.getId())
                    .canDrive(a.drives() == null || a.drives()).unavailable(workBlocks(a.workPattern())).custodyPattern(role == Role.COPARENT ? a.workPattern() : null).build());
        }
        for (HouseholdDraftCompletion.Child c : nn(d.children())) {
            h.getPeople().add(Person.builder().id("c_" + slug(c.name())).name(c.name()).role(Role.CHILD).householdId(h.getId()).age(c.age()).yearLevel(c.yearLevel()).school(c.school())
                    .allergies(new ArrayList<>(nn(c.allergies()))).interests(new ArrayList<>(nn(c.interests()))).build());
        }
        h.getPlaces().add(Place.builder().id("pl_home").name("Home").suburb(h.getHomeSuburb()).travelMinutesFromHome(0).build());
        for (HouseholdDraftCompletion.Child c : nn(d.children())) if (c.school() != null) addPlace(h, c.school(), null, 8, true);
        for (HouseholdDraftCompletion.PlaceDraft p : nn(d.places())) addPlace(h, p.name(), p.suburb(), p.travelMinutesFromHome(), false);
        for (HouseholdDraftCompletion.Activity a : nn(d.activities())) {
            Optional<Person> kid = h.children().stream().filter(k -> k.getName().equalsIgnoreCase(a.childName())).findFirst();
            if (kid.isEmpty() || a.day() == null || a.start() == null) continue;
            int day = DAYS.indexOf(a.day().toLowerCase(Locale.ROOT));
            if (day == -1) continue;
            Place place = a.place() == null ? h.getPlaces().get(0) : addPlace(h, a.place(), null, null, false);
            ActivityCategory cat = Pattern.compile("piano|music|art|drama|dance|drawing|guitar", Pattern.CASE_INSENSITIVE).matcher(a.title()).find() ? ActivityCategory.CREATIVE
                    : Pattern.compile("tutor|math|reading|kumon", Pattern.CASE_INSENSITIVE).matcher(a.title()).find() ? ActivityCategory.ACADEMIC : ActivityCategory.SPORT;
            h.getStanding().add(StandingCommitment.builder().id("s_" + slug(kid.get().getName()) + "_" + slug(a.title())).personId(kid.get().getId()).title(a.title()).category(cat).day(day)
                    .start(a.start()).end(a.end() == null ? addHour(a.start()) : a.end()).placeId(place.getId()).usualDriverId(h.parents().stream().map(Person::getId).findFirst().orElse(null)).build());
        }
        h.getPolicies().addAll(suggestPolicies(d));
        return h;
    }

    private static Place addPlace(Household h, String name, String suburb, Integer mins, boolean verified) {
        Optional<Place> existing = h.getPlaces().stream().filter(p -> p.getName().equalsIgnoreCase(name)).findFirst();
        if (existing.isPresent()) return existing.get();
        Place p = Place.builder().id("pl_" + slug(name)).name(name).suburb(suburb == null ? h.getHomeSuburb() : suburb).travelMinutesFromHome(mins == null ? 15 : mins).verifiedPayee(verified).build();
        h.getPlaces().add(p);
        return p;
    }

    public static List<Policy> suggestPolicies(HouseholdDraftCompletion d) {
        List<Policy> pol = new ArrayList<>();
        pol.add(pol("pol_autopay", PolicyKind.AUTO_PAY_CAP, "Pay school, club and clinic fees under $50 without asking", "Verified payees only. Everything above the cap waits for a tap.", Map.of("maxAmount", 50), true));
        pol.add(pol("pol_radius", PolicyKind.TRANSIT_RADIUS, "Keep weekend activities within 30 minutes", "Recurring weekend programs further than that get flagged.", Map.of("maxMinutes", 30, "appliesTo", "recurring"), true));
        pol.add(pol("pol_max", PolicyKind.MAX_ACTIVITIES, "At most two structured activities per child per season", "Protects unstructured time.", Map.of("max", 2), true));
        pol.add(pol("pol_budget", PolicyKind.BUDGET, "Activities budget $600 a month", "Registrations, fees and gear across the household.", Map.of("monthly", 600), true));
        pol.add(pol("pol_gift", PolicyKind.GIFT_CAP, "Birthday gifts up to $30", "The default for kids' parties.", Map.of("maxAmount", 30), true));
        pol.add(pol("pol_sunday", PolicyKind.QUIET_BLOCK, "Sunday mornings unplugged", "Keep Sunday before noon free where possible.", Map.of("day", 0, "until", "12:00"), false));
        nn(d.children()).stream().filter(c -> c.age() != null && c.age() <= 5).findFirst().ifPresent(y ->
                pol.add(pol("pol_evening", PolicyKind.EVENING_CUTOFF, y.name() + " home by 6:30pm on school nights", "No commitments for under-6s that end after 6:30pm Sunday to Thursday.", Map.of("maxAge", 5, "cutoff", "18:30"), true)));
        for (HouseholdDraftCompletion.Child c : nn(d.children())) {
            if (c.allergies() != null && !c.allergies().isEmpty()) {
                pol.add(pol("pol_allergy_" + slug(c.name()), PolicyKind.ALLERGEN, c.name() + "'s " + String.join(" and ", c.allergies()) + " allergy is always stated", "Any RSVP or note where food is involved must mention it. The guardian blocks messages that do not.", Map.of("childId", "c_" + slug(c.name()), "allergens", c.allergies()), true));
            }
        }
        nn(d.adults()).stream().filter(a -> "coparent".equalsIgnoreCase(a.role())).findFirst().ifPresent(cop -> pol.add(pol("pol_custody", PolicyKind.CUSTODY, "Handover changes with " + cop.name() + " go through the ledger",
                "Requests are reduced to facts; replies are drafted, never auto-sent; both sides see the record.",
                Map.of("childId", nn(d.children()).isEmpty() ? "" : "c_" + slug(d.children().get(0).name()), "coparentId", "p_" + slug(cop.name()), "handoverDay", 5, "handoverTime", "18:00", "nextHandover", ""), true)));
        if (nn(d.values()).stream().anyMatch(v -> Pattern.compile("creativ|art|music", Pattern.CASE_INSENSITIVE).matcher(v).find())) {
            pol.add(pol("pol_creative", PolicyKind.ONE_PER_CATEGORY, "One creative program per child per term", "Because you said creativity matters.", Map.of("category", "creative", "min", 1), true));
        }
        return pol;
    }

    private static Policy pol(String id, PolicyKind kind, String title, String desc, Map<String, Object> params, boolean enabled) {
        return Policy.builder().id(id).kind(kind).title(title).description(desc).params(new HashMap<>(params)).enabled(enabled).build();
    }

    private static List<Person.AvailabilityBlock> workBlocks(String pattern) {
        if (pattern == null) return new ArrayList<>();
        String p = pattern.toLowerCase(Locale.ROOT);
        List<Integer> days = new ArrayList<>();
        if (Pattern.compile("mon|tue|wed|thu|fri").matcher(p).find()) {
            for (int d = 1; d <= 5; d++) if (p.contains(DAYS.get(d).substring(0, 3))) days.add(d);
        } else if (Pattern.compile("full[- ]?time|9 ?(to|-) ?5|office").matcher(p).find()) days.addAll(List.of(1, 2, 3, 4, 5));
        else if (Pattern.compile("part[- ]?time|three days").matcher(p).find()) days.addAll(List.of(1, 2, 3));
        boolean wfh = Pattern.compile("from home|wfh|remote").matcher(p).find();
        return days.stream().map(d -> new Person.AvailabilityBlock(d, "09:00", wfh ? "15:00" : "17:30", wfh ? "Work (from home)" : "Work", wfh)).toList();
    }

    private static String addHour(String hhmm) {
        String[] parts = hhmm.split(":");
        return String.format("%02d:%s", (Integer.parseInt(parts[0]) + 1) % 24, parts[1]);
    }

    public static String slug(String s) {
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_").replaceAll("^_|_$", "");
    }

    private static <T> List<T> nn(List<T> l) {
        return l == null ? List.of() : l;
    }
}
