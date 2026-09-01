/* Family OS command center. Plain DOM, no build step. */
let S = null;
let view = "brief";
let traceFilter = "";
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const name = (id) => S.household.people.find((p) => p.id === id)?.name ?? id;
const place = (id) => S.household.places.find((p) => p.id === id)?.name ?? "";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TRUST = ["Observe", "Suggest", "Prepare", "Execute & notify", "Autonomous"];
const KIND = { permission_request: "Permission", schedule_change: "Schedule change", invitation: "Invitation", appointment: "Appointment", purchase_need: "Purchase", registration: "Registration", coparent_message: "Co-parent", event: "Event", fyi: "FYI" };

function fmtDay(s) { const d = new Date(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtTime(s) { const d = new Date(s); const h = d.getHours(), m = d.getMinutes(); const hh = h % 12 || 12; return `${hh}${m ? ":" + String(m).padStart(2, "0") : ""}${h >= 12 ? "pm" : "am"}`; }

async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

async function load() {
  S = await api("/api/state");
  $("#household-name").textContent = S.household.name;
  $("#clock").textContent = `Clock: ${S.now.replace("T", " ")}`;
  $("#llm").textContent = `Parser: ${S.llm ? `rules + ${S.llm}` : "rules only (no API key)"}`;
  render();
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.hidden = true), 2600);
}

function render() {
  const main = $("#main");
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  main.innerHTML = { brief, inbox, week, ledger, household, trust, trace }[view]();
  main.querySelectorAll("[data-decide]").forEach((b) => b.addEventListener("click", onDecide));
  main.querySelectorAll("[data-policy]").forEach((b) => b.addEventListener("click", onPolicy));
  main.querySelectorAll("[data-rung]").forEach((b) => b.addEventListener("click", onRung));
  main.querySelectorAll("[data-pin]").forEach((b) => b.addEventListener("click", onPin));
  main.querySelectorAll("[data-sample]").forEach((b) => b.addEventListener("click", onSample));
  main.querySelectorAll("[data-trace-signal]").forEach((b) => b.addEventListener("click", (e) => { traceFilter = e.currentTarget.dataset.traceSignal; view = "trace"; render(); }));
  const form = main.querySelector("#inbox-form");
  if (form) form.addEventListener("submit", onInbox);
  const tf = main.querySelector("#trace-filter");
  if (tf) tf.addEventListener("change", (e) => { traceFilter = e.target.value; render(); });
}

// ───────────────────────────── Brief ─────────────────────────────
function brief() {
  const b = S.brief;
  const c = b.compression;
  return `
    <h1>Tonight's brief</h1>
    <p class="lede">${esc(b.headline)}</p>
    <div class="tiles">
      <div class="tile"><div class="n">${c.signals}</div><div class="l">Inputs today</div></div>
      <div class="tile"><div class="n">${c.decisions}</div><div class="l">Decisions for you</div></div>
      <div class="tile"><div class="n">${c.automated}</div><div class="l">Actions handled</div></div>
      <div class="tile"><div class="n">${c.deferred}</div><div class="l">Parked for later</div></div>
    </div>
    ${section("Decide tonight", b.decide, "decide", true)}
    ${section("Done for you", b.done, "done")}
    ${section("Parked for later", b.later, "later", true)}
    ${section("FYI", b.fyi, "fyi")}
  `;
}

function section(title, items, cls, decidable = false) {
  if (!items.length) return `<h2>${title}</h2><p class="empty">Nothing here.</p>`;
  return `<h2>${title}</h2>${items.map((it) => card(it, cls, decidable)).join("")}`;
}

function card(it, cls, decidable) {
  const entry = S.ledger.find((e) => e.id === it.ledgerId);
  const canDecide = decidable && (entry.state === "awaiting_decision" || entry.state === "scheduled" || entry.state === "snoozed");
  return `
    <div class="card ${cls}">
      <div class="card-head">
        <div>
          <h3>${esc(it.title)}</h3>
          <div class="chips">${it.children.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}<span class="chip" style="background:#eee;color:#555">${KIND[entry.kind] ?? entry.kind}</span></div>
        </div>
        ${it.dueLabel ? `<span class="due">${esc(it.dueLabel)}</span>` : ""}
      </div>
      <p style="margin:10px 0 0">${esc(it.summary)}</p>
      ${it.actions.length ? `<ul class="actions">${it.actions.map(actionRow).join("")}</ul>` : ""}
      ${it.flags.length ? `<ul class="flags">${it.flags.map((f) => `<li class="flag ${f.level}">${f.level === "block" ? "⛔" : f.level === "warn" ? "⚠" : "ℹ"} ${esc(f.message)}</li>`).join("")}</ul>` : ""}
      ${canDecide ? `<div class="btns">
        <button class="btn primary" data-decide="approve" data-id="${it.ledgerId}">${approveLabel(it)}</button>
        ${it.alternatives.map((a, i) => a.actions.length ? `<button class="btn" data-decide="approve" data-alt="${i}" data-id="${it.ledgerId}" title="${esc(a.detail)}">${esc(a.label)}</button>` : `<button class="btn subtle" data-decide="decline" data-id="${it.ledgerId}">${esc(a.label)}</button>`).join("")}
        <button class="btn subtle" data-decide="snooze" data-id="${it.ledgerId}">Snooze</button>
        <button class="btn subtle" data-decide="decline" data-id="${it.ledgerId}">Decline</button>
      </div>` : ""}
      <details class="why"><summary>Why the agents did this</summary><ul>${it.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
        <p class="small"><a href="#" data-trace-signal="${it.signalId}">Open the agent trace →</a></p></details>
    </div>`;
}

function approveLabel(it) {
  const pending = it.actions.filter((a) => a.disposition === "staged" || a.disposition === "suggested");
  if (pending.length === 1) {
    const a = pending[0];
    if (a.cls === "sign_form") return "Sign";
    if (a.cls === "outbound_message" || a.cls === "coparent_reply") return "Send";
    if (a.cls === "payment") return `Pay $${a.amount}`;
    if (a.cls === "purchase") return `Order${a.amount ? ` ≈ $${a.amount}` : ""}`;
    if (a.cls === "enrolment") return "Enrol";
  }
  return "Approve all";
}

function actionRow(a) {
  const isMsg = a.cls === "outbound_message" || a.cls === "coparent_reply";
  const mark = { executed: "✓", staged: "▷", suggested: "?", observed: "·" }[a.disposition];
  return `<li>
    <span class="mark ${a.disposition}">${mark}</span>
    <div><div class="act-title">${esc(a.title)}</div>${isMsg ? `<div class="quote">${esc(a.detail)}</div>` : `<div class="act-detail">${esc(a.detail)}</div>`}</div>
    <span class="amount">${a.amount ? `$${a.amount}` : ""} <span class="small muted">${a.disposition}</span></span>
  </li>`;
}

async function onDecide(e) {
  const { decide: kind, id, alt } = e.currentTarget.dataset;
  const data = await api("/api/decide", { ledgerId: id, kind, alternativeIndex: alt !== undefined ? Number(alt) : undefined });
  const promo = data.state.trust.filter((t) => t.promotionOffered);
  await load();
  toast(kind === "approve" ? (promo.length ? `Done. The agents have earned more trust for ${promo.map((p) => p.label.toLowerCase()).join(", ")}: see Trust ladder.` : "Done.") : kind === "decline" ? "Declined. Trust for those actions stepped down." : "Snoozed until tomorrow's brief.");
}

// ───────────────────────────── Inbox ─────────────────────────────
function inbox() {
  return `
    <h1>Inbox</h1>
    <p class="lede">Forward anything: a school email, a coach's WhatsApp, a clinic SMS, a photo of a flyer (as text for now). No forms. The agents read it, place it, and decide what to do within your trust settings.</p>
    <div class="samples">${S.samples.map((s, i) => `<button class="btn" data-sample="${i}">${esc(s.subject ?? s.from)}</button>`).join("")}
      <button class="btn" data-sample="extra-0">Dentist reschedule (SMS)</button>
      <button class="btn" data-sample="extra-1">Netball finals (WhatsApp)</button>
      <button class="btn" data-sample="extra-2">Preschool photo day (email)</button>
    </div>
    <form id="inbox-form" class="form card">
      <div class="row">
        <select name="channel"><option>email</option><option>whatsapp</option><option>sms</option><option>portal</option><option>pdf</option><option>voice</option></select>
        <input name="from" placeholder="From (e.g. office@school.nsw.edu.au or Coach Sam)" required />
        <input name="subject" placeholder="Subject (optional)" />
      </div>
      <textarea name="body" placeholder="Paste the message…" required></textarea>
      <div class="btns"><button class="btn primary" type="submit">Send to the agents</button></div>
    </form>
    <div id="inbox-result" class="result"></div>
    <h2>Signals received</h2>
    <table><thead><tr><th>When</th><th>Channel</th><th>From</th><th>Kind</th><th>Children</th><th>Confidence</th><th>Parser</th></tr></thead><tbody>
      ${S.signals.slice().reverse().map((s) => `<tr><td>${esc(s.receivedAt.replace("T", " "))}</td><td>${esc(s.raw.channel)}</td><td>${esc(s.raw.from)}</td><td>${KIND[s.kind]}</td><td>${s.extracted.childIds.map(name).join(", ")}</td><td>${Math.round(s.confidence * 100)}%</td><td>${s.parser}</td></tr>`).join("")}
    </tbody></table>`;
}

const EXTRA = [
  { channel: "sms", from: "Smile Dental Leichhardt", body: "Hi, we need to reschedule Leo's check-up. Can you do Monday 14 September at 4pm instead of Tuesday 15 September at 4pm? Reply YES to confirm." },
  { channel: "whatsapp", from: "Netball team manager", body: "Big news! The U12s are through to the grand final, Saturday 12 September 9am at Balmain Netball Courts. Please arrive by 8:30am. Parents welcome to bring a plate (nut-free please)." },
  { channel: "email", from: "admin@littlewonderspreschool.com.au", subject: "Photo day – Wednesday 16 September", body: "Photo day is Wednesday 16 September. Please have children in their preschool t-shirt and order photos online by Friday 18 September. Packages start at $35." },
];

function onSample(e) {
  const key = e.currentTarget.dataset.sample;
  const s = key.startsWith("extra-") ? EXTRA[Number(key.slice(6))] : S.samples[Number(key)];
  const f = $("#inbox-form");
  f.channel.value = s.channel;
  f.from.value = s.from;
  f.subject.value = s.subject ?? "";
  f.body.value = s.body;
  f.body.focus();
}

async function onInbox(e) {
  e.preventDefault();
  const f = e.currentTarget;
  const btn = f.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const data = await api("/api/inbox", { channel: f.channel.value, from: f.from.value, subject: f.subject.value || undefined, body: f.body.value });
    S = data.state;
    const r = data.result;
    const item = [...S.brief.decide, ...S.brief.done, ...S.brief.later, ...S.brief.fyi].find((i) => i.ledgerId === r.entry.id);
    render();
    const ex = r.signal.extracted;
    $("#inbox-result").innerHTML = `
      <h2>What the agents did</h2>
      <div class="card"><dl class="kv">
        <dt>Understood as</dt><dd>${KIND[r.signal.kind]} (${Math.round(r.signal.confidence * 100)}% confident, ${r.signal.parser} parser)</dd>
        <dt>Children</dt><dd>${ex.childIds.map(name).join(", ") || "—"}</dd>
        <dt>When</dt><dd>${ex.when ? `${fmtDay(ex.when.start)} ${ex.when.allDay ? "" : fmtTime(ex.when.start)}${ex.when.end && !ex.when.allDay ? "–" + fmtTime(ex.when.end) : ""}` : "—"}${ex.previousWhen ? ` (was ${fmtTime(ex.previousWhen.start)})` : ""}</dd>
        <dt>Deadline</dt><dd>${ex.deadline ? fmtDay(ex.deadline) : "—"}</dd>
        <dt>Where</dt><dd>${esc(ex.locationText ?? "—")}${ex.travelMinutes !== undefined ? ` · ${ex.travelMinutes} min from home` : ""}</dd>
        <dt>Needs</dt><dd>${ex.requires.join(", ") || "nothing"}</dd>
        <dt>Ledger</dt><dd><span class="state ${r.entry.state}">${r.entry.state.replace("_", " ")}</span></dd>
      </dl></div>
      ${item ? card(item, r.entry.state === "awaiting_decision" ? "decide" : r.entry.state === "executed" ? "done" : r.entry.state === "noted" ? "fyi" : "later", true) : ""}`;
    $("#inbox-result").querySelectorAll("[data-decide]").forEach((b) => b.addEventListener("click", onDecide));
    $("#inbox-result").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
  }
}

// ───────────────────────────── Week ─────────────────────────────
function week() {
  const start = S.now.slice(0, 10);
  const end = new Date(start); end.setDate(end.getDate() + 14);
  const endS = end.toISOString().slice(0, 10);
  const rows = [
    ...S.calendar.filter((e) => e.start.slice(0, 10) >= start && e.start.slice(0, 10) < endS).map((e) => ({ at: e.start, kind: e.source, e })),
    ...S.reminders.filter((r) => r.at.slice(0, 10) >= start && r.at.slice(0, 10) < endS).map((r) => ({ at: r.at, kind: "reminder", r })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const byDay = {};
  for (const r of rows) (byDay[r.at.slice(0, 10)] ??= []).push(r);
  return `
    <h1>Next two weeks</h1>
    <p class="lede">Every parent sees the same calendar. Blue rows are reminders the agents set; teal rows came from the inbox.</p>
    ${Object.entries(byDay).map(([day, items]) => `<div class="day"><h4>${fmtDay(day)}</h4>${items.map((x) => x.kind === "reminder"
      ? `<div class="ev reminder"><span>${fmtTime(x.r.at)}</span><span>🔔 ${esc(x.r.text)}</span><span class="muted small">${x.r.personIds.map(name).join(", ")}</span></div>`
      : `<div class="ev ${x.kind}"><span>${fmtTime(x.e.start)}–${fmtTime(x.e.end)}</span><span><b>${esc(x.e.title)}</b> · ${x.e.personIds.map(name).join(", ")}${x.e.placeId ? ` · ${esc(place(x.e.placeId))}` : x.e.locationText ? ` · ${esc(x.e.locationText)}` : ""}${x.e.notes?.length ? `<div class="small muted">${x.e.notes.map(esc).join(" · ")}</div>` : ""}</span><span class="muted small">${x.e.driverId ? `🚗 ${name(x.e.driverId)}` : ""}</span></div>`).join("")}</div>`).join("") || `<p class="empty">Nothing scheduled.</p>`}`;
}

// ───────────────────────────── Ledger ─────────────────────────────
function ledger() {
  return `
    <h1>Commitment ledger</h1>
    <p class="lede">Every obligation the family has to the outside world, with who did what and when. Append-only, shared with the co-parent for their child.</p>
    <table><thead><tr><th>State</th><th>Commitment</th><th>Children</th><th>Due</th><th>History</th></tr></thead><tbody>
      ${S.ledger.map((e) => `<tr><td><span class="state ${e.state}">${e.state.replace("_", " ")}</span></td><td><b>${esc(e.title)}</b><div class="small muted">${KIND[e.kind]}</div></td><td>${e.childIds.map(name).join(", ")}</td><td>${e.dueAt ? fmtDay(e.dueAt) : "—"}</td>
        <td>${e.history.map((h) => `<div class="small"><span class="muted">${h.at.replace("T", " ")} · ${h.by}</span> ${esc(h.note)}</div>`).join("")}</td></tr>`).join("")}
    </tbody></table>
    <h2>Outbound messages</h2>
    ${S.drafts.length ? `<table><thead><tr><th>To</th><th>Channel</th><th>Text</th><th>Status</th></tr></thead><tbody>${S.drafts.map((d) => `<tr><td>${esc(d.to)}</td><td>${esc(d.channel)}</td><td>${esc(d.text)}</td><td>${d.status}</td></tr>`).join("")}</tbody></table>` : `<p class="empty">Nothing sent yet. Outbound messages wait for your tap until the agents earn that trust.</p>`}
    <h2>Committed spend</h2>
    ${S.spend.length ? `<table><thead><tr><th>Month</th><th>What</th><th>Amount</th></tr></thead><tbody>${S.spend.map((s) => `<tr><td>${s.month}</td><td>${esc(s.label)}</td><td>$${s.amount}</td></tr>`).join("")}</tbody></table>` : `<p class="empty">No spend yet.</p>`}`;
}

// ───────────────────────────── Household ─────────────────────────────
function household() {
  const h = S.household;
  const kids = h.people.filter((p) => p.role === "child");
  const adults = h.people.filter((p) => p.role !== "child");
  return `
    <h1>${esc(h.name)}</h1>
    <p class="lede">The household graph. Learned from the family's digital footprint; confirmed once, then kept current by the agents.</p>
    <h2>Children</h2>
    <div class="people">${kids.map((k) => `<div class="person"><div class="name">${esc(k.name)} <span class="muted small">${k.age}</span></div>
      <dl><dt>School</dt><dd>${esc(k.yearLevel)}, ${esc(k.school)}</dd>
      ${k.allergies?.length ? `<dt>Allergies</dt><dd style="color:var(--red)">${k.allergies.map(esc).join(", ")}</dd>` : ""}
      <dt>Interests</dt><dd>${(k.interests ?? []).map(esc).join(", ")}</dd>
      <dt>Sizes</dt><dd>${Object.entries(k.sizes ?? {}).map(([k2, v]) => `${esc(k2)} ${esc(v.size)} <span class="muted">(${v.recordedOn.slice(0, 7)})</span>`).join("<br>")}</dd>
      <dt>Standing activities</dt><dd>${h.standing.filter((s) => s.personId === k.id).map((s) => `${esc(s.title)} · ${DAYS[s.day]} ${s.start}–${s.end}${s.season ? ` <span class="muted">(to ${s.season.to})</span>` : ""}`).join("<br>") || "—"}</dd></dl></div>`).join("")}</div>
    <h2>Adults</h2>
    <div class="people">${adults.map((a) => `<div class="person"><div class="name">${esc(a.name)} <span class="muted small">${a.role}</span></div>
      <dl>${a.custodyPattern ? `<dt>Custody</dt><dd>${esc(a.custodyPattern)}</dd>` : ""}
      ${a.unavailable?.length ? `<dt>Unavailable</dt><dd>${a.unavailable.map((u) => `${DAYS[u.day]} ${u.start}–${u.end} ${esc(u.label)}${u.flexible ? " <span class='muted'>(flexible)</span>" : ""}`).join("<br>")}</dd>` : ""}</dl></div>`).join("")}</div>
    <h2>What matters to you</h2>
    <div class="card">${h.values.map((v) => `<span class="chip">${esc(v)}</span>`).join(" ")}</div>
    <h2>Household policies</h2>
    <p class="muted small">The agents check every proposal against these. Toggle one and re-run the inbox to see decisions change.</p>
    ${h.policies.map((p) => `<div class="policy ${p.enabled ? "" : "off"}"><div><b>${esc(p.title)}</b><div class="small muted">${esc(p.description)}</div></div><button class="switch ${p.enabled ? "on" : ""}" data-policy="${p.id}" data-enabled="${p.enabled}" aria-label="toggle"></button></div>`).join("")}
    <h2>Places</h2>
    <table><thead><tr><th>Place</th><th>Suburb</th><th>From home</th><th>Verified payee</th></tr></thead><tbody>${h.places.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.suburb)}</td><td>${p.travelMinutesFromHome} min</td><td>${p.verifiedPayee ? "✓" : ""}</td></tr>`).join("")}</tbody></table>`;
}

async function onPolicy(e) {
  const { policy, enabled } = e.currentTarget.dataset;
  await api("/api/policy", { id: policy, enabled: enabled !== "true" });
  await load();
}

// ───────────────────────────── Trust ─────────────────────────────
function trust() {
  return `
    <h1>Trust ladder</h1>
    <p class="lede">Autonomy is earned per action type. Every approval moves a rung up; every decline moves it down. Pin a rung to stop the offers.</p>
    ${S.trust.filter((t) => t.promotionOffered).map((t) => `<div class="promo"><div>You have approved <b>${t.label.toLowerCase()}</b> ${t.approvals} times in a row. Let the agents handle these and just tell you?</div><button class="btn primary" data-rung="${t.cls}" data-level="3">Yes, execute &amp; notify</button></div>`).join("")}
    ${S.trust.map((t) => `<div class="trust"><div><b>${esc(t.label)}</b><div class="small muted">${TRUST[t.level]} · ${t.approvals} approvals in a row · ${t.overrides} overrides${t.cls === "payment" ? " · auto under the verified-payee cap" : ""}</div></div>
      <div class="ladder">${TRUST.map((l, i) => `<button class="rung ${i <= t.level ? "lit" : ""}" data-rung="${t.cls}" data-level="${i}" title="${l}">${i}</button>`).join("")}</div>
      <button class="btn subtle" data-pin="${t.cls}" data-pinned="${t.pinned}">${t.pinned ? "📌 Pinned" : "Pin"}</button></div>`).join("")}
    <h2>What the rungs mean</h2>
    <table><tbody>${TRUST.map((l, i) => `<tr><td><b>${i} · ${l}</b></td><td>${["Watches and files, does nothing.", "Proposes; you do it.", "Stages everything so it takes one tap.", "Does it, then tells you in the brief.", "Does it silently; visible in the ledger."][i]}</td></tr>`).join("")}</tbody></table>`;
}

async function onRung(e) {
  const { rung, level } = e.currentTarget.dataset;
  await api("/api/trust", { cls: rung, level: Number(level) });
  await load();
  toast(`${TRUST[Number(level)]} for ${S.trust.find((t) => t.cls === rung).label.toLowerCase()}.`);
}

async function onPin(e) {
  const { pin, pinned } = e.currentTarget.dataset;
  const t = S.trust.find((t) => t.cls === pin);
  await api("/api/trust", { cls: pin, level: t.level, pinned: pinned !== "true" });
  await load();
}

// ───────────────────────────── Trace ─────────────────────────────
function trace() {
  const rows = S.trace.filter((t) => !traceFilter || t.signalId === traceFilter);
  return `
    <h1>Agent trace</h1>
    <p class="lede">Every step every agent took, so a parent can always answer "why did it do that?".</p>
    <select id="trace-filter" style="max-width:420px"><option value="">All signals</option>${S.signals.map((s) => `<option value="${s.id}" ${s.id === traceFilter ? "selected" : ""}>${esc(s.extracted.title)}</option>`).join("")}</select>
    <table style="margin-top:14px"><thead><tr><th>Signal</th><th>Agent</th><th>Step</th><th>Detail</th></tr></thead><tbody>
      ${rows.map((t) => `<tr class="trace-row"><td>${t.signalId}</td><td class="agent">${t.agent}</td><td>${esc(t.step)}</td><td>${esc(t.detail)}</td></tr>`).join("")}
    </tbody></table>`;
}

// ───────────────────────────── boot ─────────────────────────────
document.querySelectorAll("#nav button").forEach((b) => b.addEventListener("click", () => { view = b.dataset.view; render(); }));
$("#reset").addEventListener("click", async () => { await api("/api/demo/reset", { runDemo: true }); await load(); toast("Demo reset."); });
load().catch((err) => { $("#main").innerHTML = `<p class="flag block">${esc(err.message)}</p>`; });
