import type { RawMessage } from "../core/types.ts";

/** One Tuesday evening's worth of family inbox. Eight inputs, zero manual entry. */
export const DEMO_NOW = "2026-09-01T18:30";

export const demoInbox: RawMessage[] = [
  {
    channel: "email",
    from: "office@leichhardtps.nsw.edu.au",
    subject: "Year 6 Excursion – Taronga Zoo – Thursday 10 September",
    body: `Dear Parents and Carers,

Year 6 will visit Taronga Zoo on Thursday 10 September as part of the Living World unit. Students depart school at 8:15am and return by 3:00pm. The cost is $38 per student.

Please complete the permission note and payment via the school portal by Friday 4 September. Students should bring a packed lunch, a hat and a refillable water bottle. As we are a nut-free school, please do not include nut products.

Kind regards,
Ms Patel, Year 6 Coordinator`,
  },
  {
    channel: "whatsapp",
    from: "Coach Sam (U8 Lions)",
    body: `Hi all, sorry for the late notice. This Saturday's U8s game is moved from 9am to 10:30am at Jubilee Oval due to ground works on the top field. Same 15 min early arrival please. Cheers, Sam`,
  },
  {
    channel: "whatsapp",
    from: "Jess (Harper's mum)",
    body: `Hi Priya! Harper is turning 8 and would love Leo to come to her party 🎉 Sunday 13 September, 2-4pm at Flip Out Trampoline Park, Castle Hill. Pizza and cake provided. RSVP by Tuesday 8 September to Jess on 0433 222 333. Grip socks required at Flip Out!`,
  },
  {
    channel: "sms",
    from: "Balmain Paediatrics",
    body: `Reminder: Maya Mahoney has an appointment with Dr Chen on Wed 9 Sep at 3:15pm at Balmain Paediatrics, 12 Darling St. Please bring her Blue Book and Medicare card. Reply Y to confirm or call 9555 0100 to reschedule.`,
  },
  {
    channel: "email",
    from: "uniformshop@leichhardtps.nsw.edu.au",
    subject: "Summer uniform orders – order by 25 September",
    body: `Hi families,

Term 4 starts Monday 12 October and students move to summer uniform. To guarantee delivery before term starts, please place orders by Friday 25 September. Polo shirts $28, shorts $24, dresses $42. Order online via the uniform shop portal. Sizes run small; most students need a size up from last year.`,
  },
  {
    channel: "sms",
    from: "Daniel",
    body: `You AGAIN forgot to send Ava's maths homework folder last weekend. This is typical. I need her at mine by 5pm this Friday not 6, I have plans. Make sure the folder is in her bag.`,
  },
  {
    channel: "email",
    from: "registrations@innerwestcricket.com.au",
    subject: "Summer cricket registrations now open",
    body: `Milo Blast (ages 5-8) runs Saturday mornings 8:30-10am at Petersham Oval from Saturday 17 October to Saturday 12 December. $180 per player including shirt and bat. Register by Thursday 1 October. Under 11s Friday nights 5-7pm also open.`,
  },
  {
    channel: "email",
    from: "newsletter@leichhardtps.nsw.edu.au",
    subject: "LPS Newsletter Week 7",
    body: `Book Week photos are now on the school website. Congratulations to the Year 3 debating team. Reminder that the P&C meeting is Tuesday 15 September at 7pm in the library; all welcome. Canteen specials this week: sushi Wednesday.`,
  },
];
