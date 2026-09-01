/* Onboarding: a conversation, not a form. */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KID_COLOURS = ["#6E56CF", "#1C9AA3", "#E8735A", "#3B8FE0", "#D9518E", "#5C9E31"];
let step = 0;
let text = "";
let draft = null;
let source = "rules";
let disabled = new Set();
let preset = "balanced";
let cfg = null;

async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 3600); }

const steps = [intro, understood, rules, trust, connect];
function render() { $("#stage").innerHTML = steps[step](); wireStep(); }

function intro() {
  return `
    <div class="step-n">Setting up · 1 of 5</div>
    <h1>Tell me about your family.</h1>
    <p class="lede">Just talk. Who's who, ages, school, the regular things each week, anything I should never get wrong. I'll do the rest.</p>
    <textarea class="big" id="text" placeholder="We're the Nguyens in Marrickville. Two kids: Mia is 9, Year 4 at Marrickville Public, swimming Tuesdays 4pm at Annette Kellerman. Sam is 6, Kindy, allergic to eggs…">${esc(text)}</textarea>
    <div class="foot"><button class="link" id="sample">Use an example family</button><button class="btn big" id="next" style="flex:0 0 auto;min-width:180px">That's us</button></div>
    <div class="thinking" id="thinking" hidden><i></i><span>Reading that${cfg?.geminiReady ? " with Gemini" : ""}…</span></div>
    <p class="small" style="margin-top:28px;text-align:center">Or <button class="link" id="demo">explore with the demo family</button> first.</p>`;
}

function understood() {
  const kids = draft.children.map((c, i) => `<div class="pcard"><span class="avatar" style="--c:${KID_COLOURS[i % KID_COLOURS.length]}">${esc(c.name.charAt(0))}</span><div><div class="pn">${esc(c.name)}${c.age ? `, ${c.age}` : ""}</div><div class="pd">${[c.yearLevel, c.school, c.allergies?.length ? `allergic to ${c.allergies.join(", ")}` : null, c.interests?.length ? `into ${c.interests.slice(0, 3).join(", ")}` : null].filter(Boolean).map(esc).join(" · ") || "I'll learn more as things come in"}</div></div></div>`).join("");
  const adults = draft.adults.map((a) => `<div class="pcard"><span class="adult">${esc(a.name.charAt(0))}</span><div><div class="pn">${esc(a.name)}</div><div class="pd">${a.role === "coparent" ? "Co-parent, separate home" : a.role === "carer" ? "Helps out" : "Parent"}${a.workPattern ? ` · ${esc(a.workPattern)}` : ""}</div></div></div>`).join("");
  const acts = draft.activities.filter((a) => a.day && a.start).map((a) => `${a.childName}: ${a.title} ${a.day}s ${a.start}`).join(" · ");
  return `
    <div class="step-n">Setting up · 2 of 5</div>
    <h1>Here's what I understood.</h1>
    <p class="lede">${source === "gemini" ? "Gemini read it. " : ""}Fix anything I got wrong; I'll pick it up from what you type.</p>
    <div class="people">${kids}${adults}</div>
    ${acts ? `<p class="small">Regular things: ${esc(acts)}</p>` : ""}
    ${draft.values.length ? `<p class="small">What matters to you: ${esc(draft.values.join(", "))}.</p>` : ""}
    <div class="field"><input id="fix" placeholder="Anything wrong? e.g. 'Leo is 9, not 8' or 'add Nonna, she picks up on Thursdays'" /></div>
    <div class="foot"><button class="link" id="back">Back</button><div style="display:flex;gap:8px"><button class="btn ghost" id="refix">Update</button><button class="btn big" id="next" style="flex:0 0 auto;min-width:150px">Looks right</button></div></div>
    <div class="thinking" id="thinking" hidden><i></i><span>Updating…</span></div>`;
}

let policies = [];
function rules() {
  return `
    <div class="step-n">Setting up · 3 of 5</div>
    <h1>House rules I'd suggest.</h1>
    <p class="lede">I'll check everything against these. Turn off what doesn't fit; change any of it later.</p>
    ${policies.map((p) => `<div class="rule ${disabled.has(p.id) ? "off" : ""}"><div><div class="rt">${esc(p.title)}</div><div class="rd">${esc(p.description)}</div></div><button class="switch ${disabled.has(p.id) ? "" : "on"}" data-policy="${p.id}" aria-label="toggle"></button></div>`).join("")}
    <div class="foot" style="margin-top:18px"><button class="link" id="back">Back</button><button class="btn big" id="next" style="flex:0 0 auto;min-width:150px">Good</button></div>`;
}

function trust() {
  return `
    <div class="step-n">Setting up · 4 of 5</div>
    <h1>How much should I handle?</h1>
    <p class="lede">I start careful and earn more room each time you say yes. Signing forms always waits for you.</p>
    <div class="big-choice">
      ${[["cautious", "Ask me first", "I prepare everything so it's one tap, but do nothing without you."], ["balanced", "Balanced", "I keep the calendar and reminders running; I ask before money and messages."], ["hands-off", "Just handle it", "I pay small fees to the school and clubs, send routine replies, and tell you after."]].map(([k, t, d]) => `<button class="${preset === k ? "on" : ""}" data-preset="${k}"><b>${t}</b><span>${d}</span></button>`).join("")}
    </div>
    <div class="foot"><button class="link" id="back">Back</button><button class="btn big" id="next" style="flex:0 0 auto;min-width:150px">Set it up</button></div>`;
}

function connect() {
  return `
    <div class="step-n">Setting up · 5 of 5</div>
    <h1>Where should I read from?</h1>
    <p class="lede">You can do this later. The fastest way to see it work is to paste one real school email.</p>
    <div class="group">
      <div class="conn"><div><div class="cn">Gemini</div><div class="cs ${cfg.geminiReady ? "ok" : ""}">${cfg.geminiReady ? "Connected. I read messy messages properly and can speak the brief." : "Optional. Paste an API key and I read anything, not just tidy school emails."}</div></div>${cfg.geminiReady ? "<span></span>" : `<button class="btn small" id="gk">Add key</button>`}</div>
      <div id="gkrow" hidden><div class="field"><input id="gkey" type="password" placeholder="Gemini API key" /></div><div class="cta"><button class="btn small" id="gksave">Save and test</button><span class="small" id="gkstatus"></span></div></div>
      <div class="conn"><div><div class="cn">Gmail and Google Calendar</div><div class="cs">${cfg.googleConnected ? "Connected." : cfg.googleConfigured ? "Ready to connect." : "Needs a Google OAuth client. Set it up in Settings when you're ready."}</div></div>${cfg.googleConfigured && !cfg.googleConnected ? `<a class="btn small" href="/oauth/google/start">Connect</a>` : "<span></span>"}</div>
      <div class="conn"><div><div class="cn">School, club or shared calendar link</div><div class="cs">Any calendar link works: Compass, Sentral, TeamApp, PlayHQ, Google, Outlook.</div></div><span></span></div>
      <div class="field" style="padding-bottom:12px"><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="ics" placeholder="https://… or webcal://…" /><button class="btn small" id="icsadd">Add</button></div></div>
      <div class="conn"><div><div class="cn">WhatsApp, SMS, photos</div><div class="cs">Share them to me from your phone, or paste them in.</div></div><span></span></div>
    </div>
    <div class="foot" style="margin-top:18px"><span></span><button class="btn big" id="finish" style="flex:0 0 auto;min-width:200px">Open my brief</button></div>`;
}

function wireStep() {
  $("#back")?.addEventListener("click", () => { step -= 1; render(); });
  if (step === 0) {
    $("#sample").addEventListener("click", async () => { const r = await api("/api/onboard/sample"); $("#text").value = r.text; });
    $("#demo").addEventListener("click", async () => { await api("/api/onboard/demo", {}); location.href = "/"; });
    $("#next").addEventListener("click", async () => {
      text = $("#text").value.trim();
      if (text.length < 20) return toast("Tell me a little more: names, ages, the school, the regular activities.");
      $("#thinking").hidden = false; $("#next").disabled = true;
      try { const r = await api("/api/onboard/draft", { text }); draft = r.draft; source = r.source; policies = await suggested(); step = 1; render(); }
      catch (err) { toast(err.message); $("#thinking").hidden = true; $("#next").disabled = false; }
    });
  }
  if (step === 1) {
    const refix = async () => {
      const fix = $("#fix").value.trim(); if (!fix) return;
      $("#thinking").hidden = false;
      text = `${text}\n\nCorrections: ${fix}`;
      try { const r = await api("/api/onboard/draft", { text }); draft = r.draft; source = r.source; policies = await suggested(); render(); } catch (err) { toast(err.message); $("#thinking").hidden = true; }
    };
    $("#refix").addEventListener("click", refix);
    $("#fix").addEventListener("keydown", (e) => { if (e.key === "Enter") refix(); });
    $("#next").addEventListener("click", () => { step = 2; render(); });
  }
  if (step === 2) {
    document.querySelectorAll("[data-policy]").forEach((b) => b.addEventListener("click", (e) => { const id = e.currentTarget.dataset.policy; disabled.has(id) ? disabled.delete(id) : disabled.add(id); render(); }));
    $("#next").addEventListener("click", () => { step = 3; render(); });
  }
  if (step === 3) {
    document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", (e) => { preset = e.currentTarget.dataset.preset; render(); }));
    $("#next").addEventListener("click", async () => {
      $("#next").disabled = true;
      try { await api("/api/onboard/commit", { draft, disabledPolicies: [...disabled], trustPreset: preset }); cfg = (await api("/api/state")).config; step = 4; render(); } catch (err) { toast(err.message); $("#next").disabled = false; }
    });
  }
  if (step === 4) {
    $("#gk")?.addEventListener("click", () => { $("#gkrow").hidden = false; $("#gkey").focus(); });
    $("#gksave")?.addEventListener("click", async () => { await api("/api/config", { geminiKey: $("#gkey").value }); $("#gkstatus").textContent = "Testing…"; const r = await api("/api/gemini/ping"); $("#gkstatus").textContent = r.ok ? `Connected to ${r.model}.` : `Not working: ${r.detail}`; if (r.ok) { cfg.geminiReady = true; } });
    $("#icsadd").addEventListener("click", async () => { const url = $("#ics").value.trim(); if (!url) return; try { const r = await api("/api/connect/ics", { url, label: new URL(url.replace(/^webcal/, "https")).hostname }); toast(`Added ${r.added} events.`); $("#ics").value = ""; } catch (err) { toast(err.message); } });
    $("#finish").addEventListener("click", () => (location.href = "/"));
  }
}

async function suggested() {
  // The server derives policies from the draft at commit time; preview them here the same way.
  const h = await api("/api/onboard/policies", { draft }).catch(() => null);
  return h?.policies ?? [];
}

(async () => { cfg = (await api("/api/state")).config; render(); })();
