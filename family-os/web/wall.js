/* Always-on wall display. Big type, tap-to-tick chores, refreshes itself. */
let S = null;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KID_COLOURS = ["#6E56CF", "#1C9AA3", "#E8735A", "#3B8FE0", "#D9518E", "#5C9E31"];
const LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
const name = (id) => S.household.people.find((p) => p.id === id)?.name ?? id;
const colour = (id) => KID_COLOURS[Math.max(0, S.household.people.filter((p) => p.role === "child").findIndex((p) => p.id === id)) % KID_COLOURS.length];
const place = (id) => S.household.places.find((p) => p.id === id)?.name ?? "";
const fmtTime = (s) => { const d = new Date(s); const h = d.getHours(), m = d.getMinutes(); return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h >= 12 ? "pm" : "am"}`; };
const addDays = (day, n) => { const d = new Date(day); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

async function api(path, body) { const res = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined); return res.json(); }

function dayRows(day) {
  const rows = [
    ...S.calendar.filter((e) => e.start.slice(0, 10) === day).map((e) => ({ at: e.start, e })),
    ...S.reminders.filter((r) => r.at.slice(0, 10) === day).map((r) => ({ at: r.at, r })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  if (!rows.length) return `<div class="empty">Nothing on. Enjoy it.</div>`;
  return rows.map((x) => x.r
    ? `<div class="wev rem"><span class="t">${fmtTime(x.r.at)}</span><div><div class="n">${esc(x.r.text)}</div></div><span></span></div>`
    : `<div class="wev"><span class="t">${x.e.end.slice(11) === "23:59" ? "All day" : fmtTime(x.e.start)}</span><div><div class="n">${esc(x.e.title)}</div><div class="s">${[x.e.personIds.map(name).join(" & "), place(x.e.placeId) || x.e.locationText].filter(Boolean).map(esc).join(" · ")}</div></div>${x.e.driverId ? `<span class="drv">${esc(name(x.e.driverId))} drives</span>` : "<span></span>"}</div>`).join("");
}

function render() {
  const now = new Date(S.now);
  const real = new Date();
  const clockNow = S.demo ? now : real;
  const today = S.now.slice(0, 10);
  const decide = S.brief.decide.length;
  const one = S.brief.decide[0] ?? S.brief.done[0] ?? S.brief.later[0];
  document.getElementById("wall").innerHTML = `
    <div>
      <div class="clock">${clockNow.getHours() % 12 || 12}:${String(clockNow.getMinutes()).padStart(2, "0")}</div>
      <div class="today">${LONG[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}</div>
      <div class="needs">${decide ? `<b>${decide === 1 ? "One thing" : `${decide} things`}</b> waiting for a parent on the phone.` : "Nothing waiting for anyone."}${S.brief.compression.automated ? ` ${S.brief.compression.automated} things handled today.` : ""}</div>
      ${one ? `<div class="one">${esc(one.narrative)}</div>` : ""}
    </div>
    <div class="col">
      <h2>Today</h2>${dayRows(today)}
      <div class="tmr"><h2>Tomorrow</h2>${dayRows(addDays(today, 1))}</div>
    </div>
    <div class="kidcol">
      ${S.chores.perChild.map((k) => `<div class="kwrap" style="--c:${colour(k.childId)}">
        <div class="khead"><span class="avatar" style="--c:${colour(k.childId)}">${esc(k.name.charAt(0))}</span><span class="kn">${esc(k.name)}</span><span class="kp">${k.balance}</span></div>
        ${S.chores.board.chores.filter((c) => c.childId === k.childId && (k.due.includes(c.id) || k.doneToday.includes(c.id))).map((c) => { const done = k.doneToday.includes(c.id); return `<div class="kchore ${done ? "done" : ""}"><button class="box" data-chore="${c.id}" data-done="${done}">${TICK}</button><span class="ct">${esc(c.title)}</span><span class="cp">+${c.points}</span></div>`; }).join("") || `<div class="empty">All done today.</div>`}
        ${k.streak >= 2 ? `<div class="streak">${k.streak}-day streak</div>` : ""}
      </div>`).join("")}
    </div>`;
  document.querySelectorAll("[data-chore]").forEach((b) => b.addEventListener("click", async (e) => { const { chore, done } = e.currentTarget.dataset; await api(done === "true" ? "/api/chores/undo" : "/api/chores/complete", { choreId: chore }); await load(); }));
}

async function load() { S = await api("/api/state"); render(); }
load();
setInterval(load, 60000);
document.addEventListener("mousemove", () => { document.body.style.cursor = "default"; clearTimeout(load.c); load.c = setTimeout(() => (document.body.style.cursor = "none"), 3000); });
if ("wakeLock" in navigator) navigator.wakeLock.request("screen").catch(() => {});
