/* Family OS. Plain DOM, no build step. */
let S = null;
let tab = location.hash.replace("#", "") || "tonight";
let composeChannel = "email";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KID_COLOURS = ["#6E56CF", "#1C9AA3", "#E8735A", "#3B8FE0", "#D9518E", "#5C9E31"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TRUST = ["Watch only", "Suggest", "Prepare", "Do it, tell me", "Just do it"];
const AREAS = { calendar_write: "Calendar", reminder: "Reminders", sign_form: "Signing forms", payment: "Paying fees", outbound_message: "Messaging people", coparent_reply: "Replying to the co-parent", purchase: "Buying things", enrolment: "Enrolling the kids" };
const ICON = {
  tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
};

const kidIndex = (id) => S.household.people.filter((p) => p.role === "child").findIndex((p) => p.id === id);
const colour = (id) => KID_COLOURS[Math.max(0, kidIndex(id)) % KID_COLOURS.length];
const person = (id) => S.household.people.find((p) => p.id === id);
const name = (id) => person(id)?.name ?? id;
const place = (id) => S.household.places.find((p) => p.id === id)?.name ?? "";
const avatar = (id, sm) => `<span class="avatar ${sm ? "sm" : ""}" style="--c:${colour(id)}" title="${esc(name(id))}">${esc(name(id).charAt(0))}</span>`;
const avatarByName = (n, sm) => { const p = S.household.people.find((x) => x.name === n); return p ? avatar(p.id, sm) : ""; };
function fmtDay(s) { const d = new Date(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtTime(s) { const d = new Date(s); const h = d.getHours(), m = d.getMinutes(); return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h >= 12 ? "pm" : "am"}`; }
function dayLabel(day) { const today = S.now.slice(0, 10); const d = new Date(day); const diff = Math.round((d - new Date(today)) / 86400000); return diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : LONG[d.getDay()]; }
function greeting() { const h = new Date(S.now).getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function splitTitle(t) { const i = t.indexOf(":"); if (i === -1) return { who: [], rest: cap(t) }; const who = t.slice(0, i).split("&").map((s) => s.trim()); return { who, rest: cap(t.slice(i + 1).trim()) }; }

async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 3200); }

async function load() {
  S = await api("/api/state");
  if (!S.onboarded) { location.href = "/welcome"; return; }
  $("#fam").textContent = S.household.name;
  $("#date").textContent = `${LONG[new Date(S.now).getDay()]} ${new Date(S.now).getDate()} ${MONTHS[new Date(S.now).getMonth()]}${S.demo ? " · demo family" : ""}`;
  render();
  if (new URLSearchParams(location.search).get("connected") === "google") { history.replaceState({}, "", "/"); toast("Google connected. I'll read your mail and write to your calendar."); openSettings(); }
}

function render() {
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  const badge = S.brief.decide.length;
  const tb = $('#tabs button[data-tab="tonight"]');
  tb.querySelector(".badge")?.remove();
  if (badge) tb.insertAdjacentHTML("beforeend", `<span class="badge">${badge}</span>`);
  $("#view").innerHTML = { tonight, week, kids, inbox }[tab]();
  wire($("#view"));
  location.hash = tab;
}

function wire(root) {
  root.querySelectorAll("[data-decide]").forEach((b) => b.addEventListener("click", onDecide));
  root.querySelectorAll("[data-chore]").forEach((b) => b.addEventListener("click", onChore));
  root.querySelectorAll("[data-claim]").forEach((b) => b.addEventListener("click", onClaim));
  root.querySelectorAll("[data-approve-claim]").forEach((b) => b.addEventListener("click", async (e) => { await api("/api/chores/approve", { claimId: e.currentTarget.dataset.approveClaim }); await load(); toast("Reward approved."); }));
  root.querySelectorAll("[data-add-chore]").forEach((b) => b.addEventListener("click", onAddChore));
  root.querySelectorAll("[data-sample]").forEach((b) => b.addEventListener("click", onSample));
  root.querySelectorAll("[data-channel]").forEach((b) => b.addEventListener("click", (e) => { composeChannel = e.currentTarget.dataset.channel; root.querySelectorAll("[data-channel]").forEach((x) => x.classList.toggle("on", x.dataset.channel === composeChannel)); }));
  root.querySelector("#send")?.addEventListener("click", onSend);
  root.querySelector("#play")?.addEventListener("click", onPlay);
  root.querySelector("#ics-add")?.addEventListener("click", onIcs);
  root.querySelector("#gmail-sync")?.addEventListener("click", onGmailSync);
}

// ───────────────────────────── Tonight ─────────────────────────────
function tonight() {
  const b = S.brief;
  const parent = S.household.people.find((p) => p.role === "parent")?.name ?? "";
  const nothingYet = S.signals.length === 0;
  return `
    <section class="hello">
      <h1>${greeting()}${parent ? `, ${esc(parent)}` : ""}.</h1>
      <p class="lede">${nothingYet ? "Nothing has come in yet. Forward me a school email or paste a message and I'll take it from there." : esc(b.headline)}</p>
      ${nothingYet ? `<button class="btn big" onclick="tab='inbox';render()">Send me something</button>` : `<button class="play" id="play"><span class="dot">${ICON.play}</span>Listen to tonight's brief</button><div id="transcript"></div>`}
    </section>
    ${b.decide.length ? `<h2 class="sec">Needs you<span class="count">${b.decide.length}</span></h2>${b.decide.map((it) => card(it, true)).join("")}` : ""}
    ${b.done.length ? `<h2 class="sec">Handled</h2><div class="group">${b.done.map((it) => row(it, "done")).join("")}</div>` : ""}
    ${b.later.length ? `<h2 class="sec">Parked for later</h2>${b.later.map((it) => card(it, true, "later")).join("")}` : ""}
    ${b.fyi.length ? `<h2 class="sec">Good to know</h2><div class="group">${b.fyi.map((it) => row(it, "fyi")).join("")}</div>` : ""}
  `;
}

function card(it, decidable, tone = "need") {
  const { who, rest } = splitTitle(it.title);
  const msgs = it.actions.filter((a) => (a.cls === "outbound_message" || a.cls === "coparent_reply") && a.disposition !== "executed");
  const primary = primaryLabel(it);
  const canDecide = decidable && ["awaiting_decision", "scheduled", "snoozed"].includes(it.state);
  const original = it.kind === "coparent_message" ? S.signals.find((s) => s.id === it.signalId) : null;
  return `
    <article class="card">
      <div class="card-top">
        <div class="avatars">${who.map((n) => avatarByName(n)).join("")}</div>
        <div><div class="title">${esc(rest)}</div><div class="meta">${esc(it.summary)}${it.dueLabel ? ` · <span class="due">${esc(it.dueLabel)}</span>` : ""}</div></div>
      </div>
      <p class="say">${esc(it.narrative)}</p>
      ${msgs.map((m) => `<div class="quote"><div class="from">${m.cls === "coparent_reply" ? "Reply I drafted" : "Message I drafted"}</div>${esc(m.detail)}</div>`).join("")}
      ${it.flags.filter((f) => f.level !== "info").map((f) => `<p class="flagline ${f.level}">${esc(f.message)}</p>`).join("")}
      ${canDecide ? `<div class="cta"><button class="btn big" data-decide="approve" data-id="${it.ledgerId}">${esc(primary)}</button><button class="btn ghost" data-decide="snooze" data-id="${it.ledgerId}">Tomorrow</button></div>
      <div class="alts">${it.alternatives.map((a, i) => a.actions.length ? `<button class="btn small" data-decide="approve" data-alt="${i}" data-id="${it.ledgerId}">${esc(a.label)}</button>` : `<button class="btn small ghost" data-decide="decline" data-id="${it.ledgerId}">${esc(a.label)}</button>`).join("")}${it.alternatives.length ? "" : `<button class="btn small ghost" data-decide="decline" data-id="${it.ledgerId}">No thanks</button>`}</div>` : ""}
      <details class="more"><summary>What I did and why</summary>
        ${original ? `<div class="quote"><div class="from">What actually arrived</div>${esc(original.raw.body)}</div>` : ""}
        <ul class="steps">${it.actions.map((a) => `<li><span class="tick ${a.disposition}">${a.disposition === "executed" ? "✓" : "·"}</span><div><div>${esc(a.title)}${a.amount ? ` <span class="small">$${a.amount}</span>` : ""}</div>${a.cls === "outbound_message" || a.cls === "coparent_reply" ? "" : `<div class="d">${esc(a.detail)}</div>`}</div></li>`).join("")}</ul>
        <ul class="why">${it.why.map((w) => `<li>${esc(w)}</li>`).join("")}${it.flags.filter((f) => f.level === "info").map((f) => `<li>${esc(f.message)}</li>`).join("")}</ul>
      </details>
    </article>`;
}

function primaryLabel(it) {
  const pending = it.actions.filter((a) => a.disposition === "staged" || a.disposition === "suggested");
  if (pending.length === 1) {
    const a = pending[0];
    if (a.cls === "sign_form") return "Sign it";
    if (a.cls === "coparent_reply") return "Send the reply";
    if (a.cls === "outbound_message") return /rsvp/i.test(a.title) ? "Send the RSVP" : "Send it";
    if (a.cls === "payment") return `Pay $${a.amount}`;
    if (a.cls === "purchase") return a.amount ? `Order it, about $${a.amount}` : "Order it";
    if (a.cls === "enrolment") return "Yes, enrol";
  }
  return "Yes, do all of that";
}

function row(it, tone) {
  const { rest } = splitTitle(it.title);
  return `<div class="row"><span class="mark ${tone}">${tone === "done" ? ICON.tick : ICON.info}</span><div><div class="r-title">${esc(rest)}</div><div class="r-say">${esc(tone === "done" ? it.narrative : it.summary)}</div></div></div>`;
}

async function onDecide(e) {
  const { decide: kind, id, alt } = e.currentTarget.dataset;
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const data = await api("/api/decide", { ledgerId: id, kind, alternativeIndex: alt !== undefined ? Number(alt) : undefined });
    const promo = data.state.trust.filter((t) => t.promotionOffered);
    await load();
    toast(kind === "approve" ? (promo.length ? `Done. You've said yes to ${promo[0].label.toLowerCase()} a few times now; I can just handle those. See Settings.` : "Done.") : kind === "decline" ? "Okay, I'll be more careful with that kind of thing." : "I'll bring it back tomorrow.");
  } catch (err) { toast(err.message); btn.disabled = false; }
}

let speaking = null;
async function onPlay() {
  const btn = $("#play");
  if (speaking) { speaking.stop(); speaking = null; btn.querySelector(".dot").innerHTML = ICON.play; return; }
  btn.querySelector(".dot").innerHTML = ICON.stop;
  const { script, source } = await api("/api/brief/script");
  $("#transcript").innerHTML = `<div class="transcript">${esc(script)}<div class="small mt">${source === "gemini" ? "Written by Gemini from tonight's brief." : "Add a Gemini key in Settings for a produced version."}</div></div>`;
  if (S.config.geminiReady) {
    const audio = new Audio("/api/brief/audio.wav");
    speaking = { stop: () => audio.pause() };
    audio.onended = () => { speaking = null; btn.querySelector(".dot").innerHTML = ICON.play; };
    audio.onerror = () => { speaking = null; speakLocal(script, btn); };
    audio.play().catch(() => speakLocal(script, btn));
  } else speakLocal(script, btn);
}
function speakLocal(script, btn) {
  if (!("speechSynthesis" in window)) { toast("This browser can't read aloud; the transcript is below."); btn.querySelector(".dot").innerHTML = ICON.play; return; }
  const u = new SpeechSynthesisUtterance(script);
  u.rate = 0.98;
  const en = speechSynthesis.getVoices().find((v) => /en-AU|en-GB|en-US/.test(v.lang));
  if (en) u.voice = en;
  u.onend = () => { speaking = null; btn.querySelector(".dot").innerHTML = ICON.play; };
  speaking = { stop: () => speechSynthesis.cancel() };
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ───────────────────────────── Week ─────────────────────────────
function week() {
  const start = S.now.slice(0, 10);
  const end = new Date(start); end.setDate(end.getDate() + 14);
  const endS = end.toISOString().slice(0, 10);
  const rows = [
    ...S.calendar.filter((e) => e.start.slice(0, 10) >= start && e.start.slice(0, 10) < endS).map((e) => ({ at: e.start, e })),
    ...S.reminders.filter((r) => r.at.slice(0, 10) >= start && r.at.slice(0, 10) < endS).map((r) => ({ at: r.at, r })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const byDay = {};
  for (const r of rows) (byDay[r.at.slice(0, 10)] ??= []).push(r);
  const days = Object.keys(byDay).sort();
  if (!days.length) return `<div class="empty"><b>Nothing on for the next two weeks</b>Connect a calendar or send me something.</div>`;
  return days.map((day) => `
    <div class="dayhead"><span>${dayLabel(day)}</span><span class="n">${fmtDay(day)}</span></div>
    <div class="group">${byDay[day].map((x) => x.r
      ? `<div class="ev reminder"><span class="t rem">${fmtTime(x.r.at)}</span><div><div class="n">${esc(x.r.text)}</div><div class="sub">Reminder</div></div><span></span></div>`
      : `<div class="ev"><span class="t">${x.e.end.slice(11) === "23:59" ? "All day" : fmtTime(x.e.start)}</span><div><div class="n">${esc(x.e.title)}</div><div class="sub">${[place(x.e.placeId) || x.e.locationText, x.e.notes?.[0]].filter(Boolean).map(esc).join(" · ")}</div></div><div style="display:flex;gap:8px;align-items:center"><div class="avatars">${x.e.personIds.map((p) => avatar(p, true)).join("")}</div>${x.e.driverId ? `<span class="drv">${esc(name(x.e.driverId))} drives</span>` : ""}</div></div>`).join("")}</div>`).join("");
}

// ───────────────────────────── Kids ─────────────────────────────
function kids() {
  const board = S.chores.board;
  if (!S.chores.perChild.length) return `<div class="empty"><b>No kids set up yet</b>Add them in Settings, then chores appear here.</div>`;
  return S.chores.perChild.map((k) => {
    const c = colour(k.childId);
    const chores = board.chores.filter((ch) => ch.childId === k.childId && (k.due.includes(ch.id) || k.doneToday.includes(ch.id))).sort((a, b) => (a.cadence === "once" ? -1 : 1) - (b.cadence === "once" ? -1 : 1));
    const target = 30;
    const pct = Math.min(100, Math.round((k.week / target) * 100));
    const claims = board.claims.filter((cl) => cl.childId === k.childId && !cl.approved);
    return `
    <section class="kid" style="--c:${c}">
      <div class="kid-top">${avatar(k.childId)}<span class="name">${esc(k.name)}</span><div class="pts"><b>${k.balance}</b><span>points${k.streak >= 2 ? ` · ${k.streak}-day streak` : ""}</span></div></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="bar-cap"><span>${k.week} this week</span><span>${target} for a great week</span></div>
      <h3 class="sec" style="margin-top:18px">Today</h3>
      ${chores.length ? chores.map((ch) => { const done = k.doneToday.includes(ch.id); return `<div class="chore ${done ? "done" : ""}"><button class="box" data-chore="${ch.id}" data-done="${done}" aria-label="${done ? "Undo" : "Done"}">${ICON.tick}</button><div><div class="ct">${esc(ch.title)}</div><div class="cs">${ch.cadence === "once" ? `One-off${ch.dueAt ? ` · by ${fmtDay(ch.dueAt)}` : ""}${ch.source === "agent" ? " · I suggested this" : ""}` : ch.cadence === "daily" ? "Every day" : "Once a week"}</div></div><span class="cp">+${ch.points}</span></div>`; }).join("") : `<p class="small">All done for today.</p>`}
      <div class="addline"><input placeholder="Add a chore" id="ct-${k.childId}" /><input type="number" value="5" id="cp-${k.childId}" aria-label="points" /><select id="cc-${k.childId}"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="once">Once</option></select><button class="btn small" data-add-chore="${k.childId}">Add</button></div>
      <h3 class="sec">Rewards</h3>
      <div class="shelf">${board.rewards.map((r) => `<div class="reward"><div class="rt">${esc(r.title)}</div><div class="rc">${r.cost} points</div><button class="btn small ${k.balance >= r.cost ? "" : "ghost"}" data-claim="${r.id}" data-child="${k.childId}" ${k.balance >= r.cost ? "" : "disabled"}>${k.balance >= r.cost ? "Claim" : `${r.cost - k.balance} to go`}</button></div>`).join("")}</div>
      ${claims.map((cl) => `<div class="promo"><span>${esc(k.name)} claimed <b>${esc(board.rewards.find((r) => r.id === cl.rewardId)?.title)}</b>. Parent to approve.</span><button class="btn small" data-approve-claim="${cl.id}">Approve</button></div>`).join("")}
    </section>`;
  }).join("") + `<p class="small" style="text-align:center">Put this on the wall: <a href="/wall">the always-on display</a> has a tap-to-tick chores board.</p>`;
}
async function onChore(e) { const { chore, done } = e.currentTarget.dataset; await api(done === "true" ? "/api/chores/undo" : "/api/chores/complete", { choreId: chore }); await load(); }
async function onClaim(e) { const { claim, child } = e.currentTarget.dataset; try { await api("/api/chores/claim", { childId: child, rewardId: claim }); await load(); toast("Claimed. A parent needs to approve it."); } catch (err) { toast(err.message); } }
async function onAddChore(e) {
  const id = e.currentTarget.dataset.addChore;
  const title = $(`#ct-${id}`).value.trim();
  if (!title) return;
  await api("/api/chores/add", { childId: id, title, points: Number($(`#cp-${id}`).value || 5), cadence: $(`#cc-${id}`).value });
  await load();
}

// ───────────────────────────── Inbox ─────────────────────────────
const EXTRA = [
  { label: "Dentist reschedule", channel: "sms", from: "Smile Dental Leichhardt", body: "Hi, we need to reschedule Leo's check-up. Can you do Monday 14 September at 4pm instead of Tuesday 15 September at 4pm? Reply YES to confirm." },
  { label: "Netball grand final", channel: "whatsapp", from: "Netball team manager", body: "Big news! The U12s are through to the grand final, Saturday 12 September 9am at Balmain Netball Courts. Please arrive by 8:30am. Parents welcome to bring a plate (nut-free please)." },
  { label: "Preschool photo day", channel: "email", from: "admin@littlewonderspreschool.com.au", subject: "Photo day – Wednesday 16 September", body: "Photo day is Wednesday 16 September. Please have children in their preschool t-shirt and order photos online by Friday 18 September. Packages start at $35." },
];
function inbox() {
  const c = S.connections;
  const cfg = S.config;
  return `
    <section class="hello"><h1>Send me anything.</h1><p class="lede">A school email, a coach's message, a clinic text, a photo of a note typed out. I'll work out who it's for, put it where it belongs, and tell you if I need you.</p></section>
    <div class="card">
      <div class="chips">${["email", "whatsapp", "sms", "portal", "voice"].map((ch) => `<button class="chip ${ch === composeChannel ? "on" : ""}" data-channel="${ch}">${ch === "sms" ? "SMS" : ch === "whatsapp" ? "WhatsApp" : ch.charAt(0).toUpperCase() + ch.slice(1)}</button>`).join("")}</div>
      <div class="field"><input id="from" placeholder="From: the school, Coach Sam, the clinic…" /></div>
      <div class="field"><input id="subject" placeholder="Subject (if it's an email)" /></div>
      <div class="field"><textarea id="body" placeholder="Paste the message here…"></textarea></div>
      <div class="cta"><button class="btn big" id="send">Take care of it</button></div>
      <div class="chips" style="margin-bottom:0">${S.demo ? S.samples.map((s, i) => `<button class="chip" data-sample="${i}">${esc((s.subject ?? s.from).replace(/\s[–-].*$/, "").slice(0, 26))}</button>`).join("") : ""}${EXTRA.map((s, i) => `<button class="chip" data-sample="x${i}">${esc(s.label)}</button>`).join("")}</div>
    </div>
    <div id="result"></div>
    <h2 class="sec">Where I read from</h2>
    <div class="group">
      <div class="conn"><div><div class="cn">Gmail</div><div class="cs ${c.gmail ? "ok" : ""}">${c.gmail ? `Reading ${esc(c.gmail.email)}${c.gmail.lastSync ? ` · last checked ${fmtDay(c.gmail.lastSync)} ${fmtTime(c.gmail.lastSync)}` : ""}` : cfg.googleConnected ? "Connected. Tap to read the last two weeks." : cfg.googleConfigured ? "Ready to connect" : "Add your Google client in Settings"}</div></div>
        ${cfg.googleConnected ? `<button class="btn small" id="gmail-sync">Read mail now</button>` : cfg.googleConfigured ? `<a class="btn small" href="/oauth/google/start">Connect</a>` : `<button class="btn small ghost" onclick="openSettings()">Set up</button>`}</div>
      <div class="conn"><div><div class="cn">Google Calendar</div><div class="cs ${c.gcal ? "ok" : ""}">${c.gcal ? `Writing to your calendar · last ${fmtDay(c.gcal.lastWrite)}` : cfg.googleConnected ? "Connected. New events get written as I add them." : "Comes with Gmail"}</div></div><span></span></div>
      <div class="conn"><div><div class="cn">School, club and shared calendars</div><div class="cs ${c.ics?.length ? "ok" : ""}">${c.ics?.length ? c.ics.map((f) => `${esc(f.label)} · ${f.events} events`).join(" · ") : "Paste any calendar link (Compass, Sentral, TeamApp, PlayHQ, Google, Outlook)"}</div></div><span></span></div>
      <div class="field" style="padding-bottom:12px"><div style="display:grid;grid-template-columns:1fr 130px auto;gap:8px"><input id="ics-url" placeholder="https://… or webcal://… calendar link" /><select id="ics-child"><option value="">Whole family</option>${S.household.people.filter((p) => p.role === "child").map((k) => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select><button class="btn small" id="ics-add">Add</button></div></div>
      <div class="conn"><div><div class="cn">WhatsApp, SMS, screenshots</div><div class="cs">Share or forward to me. On a phone, use the share sheet; on desktop, paste above.</div></div><span></span></div>
    </div>
    ${S.signals.length ? `<h2 class="sec">What's come in</h2><div class="group">${S.signals.slice().reverse().slice(0, 12).map((s) => `<div class="sig"><div><b>${esc(s.extracted.title)}</b><div class="small">${esc(s.raw.from)} · ${s.raw.channel}${s.parser === "llm" ? " · read with Gemini" : ""}</div></div><span class="k">${fmtDay(s.receivedAt)}</span></div>`).join("")}</div>` : ""}
  `;
}
function onSample(e) {
  const key = e.currentTarget.dataset.sample;
  const s = key.startsWith("x") ? EXTRA[Number(key.slice(1))] : S.samples[Number(key)];
  composeChannel = s.channel;
  document.querySelectorAll("[data-channel]").forEach((x) => x.classList.toggle("on", x.dataset.channel === composeChannel));
  $("#from").value = s.from; $("#subject").value = s.subject ?? ""; $("#body").value = s.body; $("#body").focus();
}
async function onSend() {
  const btn = $("#send"); btn.disabled = true; btn.textContent = S.config.geminiReady ? "Reading it with Gemini…" : "Reading it…";
  try {
    const data = await api("/api/inbox", { channel: composeChannel, from: $("#from").value || "unknown", subject: $("#subject").value || undefined, body: $("#body").value });
    S = data.state;
    const r = data.result;
    const item = [...S.brief.decide, ...S.brief.done, ...S.brief.later, ...S.brief.fyi].find((i) => i.ledgerId === r.entry.id);
    $("#result").innerHTML = `<h2 class="sec">Here's what I did</h2>${item ? card(item, true) : ""}<p class="small">Read as ${r.signal.kind.replace("_", " ")} with ${Math.round(r.signal.confidence * 100)}% confidence${r.signal.parser === "llm" ? " using Gemini" : ""}.</p>`;
    wire($("#result"));
    $("#body").value = ""; $("#subject").value = ""; $("#from").value = "";
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
    render;
  } catch (err) { toast(err.message); }
  btn.disabled = false; btn.textContent = "Take care of it";
}
async function onIcs() {
  const url = $("#ics-url").value.trim(); if (!url) return;
  const btn = $("#ics-add"); btn.disabled = true;
  try { const r = await api("/api/connect/ics", { url, label: new URL(url.replace(/^webcal/, "https")).hostname.replace(/^www\./, ""), childId: $("#ics-child").value || undefined }); await load(); toast(`Added ${r.added} events from that calendar.`); }
  catch (err) { toast(err.message); btn.disabled = false; }
}
async function onGmailSync() {
  const btn = $("#gmail-sync"); btn.disabled = true; btn.textContent = "Reading…";
  try { const r = await api("/api/connect/gmail/sync", {}); await load(); toast(`Read ${r.ingested} new emails from ${r.email}.`); tab = "tonight"; render(); }
  catch (err) { toast(err.message); btn.disabled = false; btn.textContent = "Read mail now"; }
}

// ───────────────────────────── Settings ─────────────────────────────
function openSettings() {
  const sheet = $("#sheet");
  const cfg = S.config;
  const preset = guessPreset();
  sheet.hidden = false;
  sheet.className = "sheet";
  sheet.innerHTML = `<div class="panel"><div class="grab"></div>
    <h2>How much should I handle?</h2><p class="sub">I earn more room as you say yes. You can always dial it back.</p>
    <div class="presets">${[["cautious", "Ask me first", "Prepare everything, do nothing without a tap."], ["balanced", "Balanced", "Handle calendar and reminders; ask about money and messages."], ["hands-off", "Just handle it", "Pay small fees, send routine messages, tell me after."]].map(([k, t, d]) => `<button class="preset ${preset === k ? "on" : ""}" data-preset="${k}"><b>${t}</b><span>${d}</span></button>`).join("")}</div>
    ${S.trust.filter((t) => t.promotionOffered).map((t) => `<div class="promo"><span>You've said yes to <b>${esc(t.label.toLowerCase())}</b> ${t.approvals} times in a row. Want me to just handle those and tell you?</span><button class="btn small" data-rung="${t.cls}" data-level="3">Yes, go ahead</button></div>`).join("")}
    ${S.trust.map((t) => `<div class="trust"><div class="tl">${AREAS[t.cls]}<span>${TRUST[t.level]}${t.pinned ? " · locked" : ""}</span></div><div class="seg">${TRUST.map((l, i) => `<button class="${i === t.level ? "on" : ""}" data-rung="${t.cls}" data-level="${i}" title="${l}">${["Watch", "Suggest", "Prepare", "Do & tell", "Just do"][i]}</button>`).join("")}</div></div>`).join("")}
    <h2 class="mt" style="margin-top:28px">House rules</h2><p class="sub">I check everything against these.</p>
    ${S.household.policies.map((p) => `<div class="rule ${p.enabled ? "" : "off"}"><div><div class="rt">${esc(p.title)}</div><div class="rd">${esc(p.description)}</div></div><button class="switch ${p.enabled ? "on" : ""}" data-policy="${p.id}" data-enabled="${p.enabled}" aria-label="toggle"></button></div>`).join("")}
    <h2 style="margin-top:28px">Reading with Gemini</h2><p class="sub">${cfg.geminiReady ? `Connected to ${esc(cfg.model)}. Messy inputs get read properly and the brief can be spoken.` : "Without a key I use a rules-based reader. It's fine for school emails; add a key for everything else."}</p>
    <div class="field"><input id="gkey" type="password" placeholder="${cfg.geminiReady ? "Key saved. Paste a new one to replace it." : "Paste your Gemini API key"}" /></div>
    <div class="cta"><button class="btn small" id="gsave">Save key</button><button class="btn small ghost" id="gtest">Test connection</button><span class="small" id="gstatus"></span></div>
    <h2 style="margin-top:28px">Google account</h2><p class="sub">${cfg.googleConnected ? "Connected. I read your mail and write to your calendar." : "Needs a Google OAuth client (web application) with redirect URL <code>" + esc(cfg.baseUrl) + "/oauth/google/callback</code>, and the Gmail and Calendar APIs enabled."}</p>
    ${cfg.googleConnected ? `<div class="cta"><button class="btn small ghost" id="gdisc">Disconnect</button></div>` : `<div class="field"><input id="gcid" placeholder="OAuth client ID" /></div><div class="field"><input id="gcsec" type="password" placeholder="OAuth client secret" /></div><div class="cta"><button class="btn small" id="gcsave">Save</button>${cfg.googleConfigured ? `<a class="btn small" href="/oauth/google/start">Connect Google</a>` : ""}</div>`}
    <hr class="hr" />
    <p class="small">Wall display: <a href="/wall">open the always-on view</a> on a tablet or TV. Add this page to your phone's home screen for the app.</p>
    <div class="cta"><button class="btn small ghost" id="startover">Start over with my family</button>${S.demo ? "" : `<button class="btn small ghost" id="demo">Load the demo family</button>`}${S.demo ? `<button class="btn small ghost" id="reset">Reset the demo</button>` : ""}</div>
  </div>`;
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSettings(); }, { once: true });
  sheet.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", async (e) => { await api("/api/trust", { preset: e.currentTarget.dataset.preset }); await load(); openSettings(); }));
  sheet.querySelectorAll("[data-rung]").forEach((b) => b.addEventListener("click", async (e) => { await api("/api/trust", { cls: e.currentTarget.dataset.rung, level: Number(e.currentTarget.dataset.level) }); await load(); openSettings(); }));
  sheet.querySelectorAll("[data-policy]").forEach((b) => b.addEventListener("click", async (e) => { await api("/api/policy", { id: e.currentTarget.dataset.policy, enabled: e.currentTarget.dataset.enabled !== "true" }); await load(); openSettings(); }));
  sheet.querySelector("#gsave").addEventListener("click", async () => { const v = $("#gkey").value.trim(); if (!v) return toast("Paste a key first."); await api("/api/config", { geminiKey: v }); await load(); openSettings(); $("#gstatus").textContent = "Saved."; });
  sheet.querySelector("#gtest").addEventListener("click", async () => { $("#gstatus").textContent = "Testing…"; const r = await api("/api/gemini/ping"); $("#gstatus").textContent = r.ok ? `Connected to ${r.model}.` : `Not working: ${r.detail}`; });
  sheet.querySelector("#gcsave")?.addEventListener("click", async () => { await api("/api/config", { googleClientId: $("#gcid").value, googleClientSecret: $("#gcsec").value }); await load(); openSettings(); toast("Saved. Now connect Google."); });
  sheet.querySelector("#gdisc")?.addEventListener("click", async () => { await api("/api/connect/google/disconnect", {}); await load(); openSettings(); });
  sheet.querySelector("#startover").addEventListener("click", () => (location.href = "/welcome"));
  sheet.querySelector("#demo")?.addEventListener("click", async () => { await api("/api/onboard/demo", {}); await load(); closeSettings(); toast("Demo family loaded."); });
  sheet.querySelector("#reset")?.addEventListener("click", async () => { await api("/api/demo/reset", { runDemo: true }); await load(); closeSettings(); toast("Demo reset."); });
}
function closeSettings() { $("#sheet").hidden = true; $("#sheet").innerHTML = ""; }
function guessPreset() {
  const l = Object.fromEntries(S.trust.map((t) => [t.cls, t.level]));
  if (l.calendar_write >= 4 && l.payment >= 3) return "hands-off";
  if (l.calendar_write <= 2 && l.payment <= 1) return "cautious";
  return "balanced";
}
window.openSettings = openSettings;

// ───────────────────────────── boot ─────────────────────────────
document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); window.scrollTo({ top: 0 }); }));
$("#gear").addEventListener("click", openSettings);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
load().catch((err) => { $("#view").innerHTML = `<div class="empty"><b>Can't reach the server</b>${esc(err.message)}</div>`; });
