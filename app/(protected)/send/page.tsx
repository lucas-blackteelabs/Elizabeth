'use client';
import { useState } from 'react';
import { BriefCard } from '@/components/brief/BriefCard';
import { Button } from '@/components/ui/button';
import { Card, Group, SectionTitle } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { useBrief } from '@/hooks/brief.hooks';
import { useAddIcs } from '@/hooks/calendar.hooks';
import { useHousehold } from '@/hooks/household.hooks';
import { useIngest, useSamples, useSignals } from '@/hooks/inbox.hooks';
import { Channel, IngestResult } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { fmtDay } from '@/lib/utils/time';

const CHANNELS: Channel[] = ['EMAIL', 'WHATSAPP', 'SMS', 'PORTAL', 'VOICE'];
const label = (c: Channel) => (c === 'SMS' ? 'SMS' : c === 'WHATSAPP' ? 'WhatsApp' : c.charAt(0) + c.slice(1).toLowerCase());
const EXTRA = [
  { label: 'Dentist reschedule', channel: 'SMS' as Channel, from: 'Smile Dental Leichhardt', body: "Hi, we need to reschedule Leo's check-up. Can you do Monday 14 September at 4pm instead of Tuesday 15 September at 4pm? Reply YES to confirm." },
  { label: 'Netball grand final', channel: 'WHATSAPP' as Channel, from: 'Netball team manager', body: 'Big news! The U12s are through to the grand final, Saturday 12 September 9am at Balmain Netball Courts. Please arrive by 8:30am. Parents welcome to bring a plate (nut-free please).' },
];

export default function SendPage() {
  const { data: hh } = useHousehold();
  const { data: brief } = useBrief();
  const { data: samples = [] } = useSamples();
  const { data: signals = [] } = useSignals();
  const ingest = useIngest();
  const addIcs = useAddIcs();
  const [channel, setChannel] = useState<Channel>('EMAIL');
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<IngestResult | null>(null);
  const [ics, setIcs] = useState('');
  const [icsChild, setIcsChild] = useState('');
  if (!hh) return null;
  const h = hh.household;
  const item = result ? [...(brief?.decide ?? []), ...(brief?.done ?? []), ...(brief?.later ?? []), ...(brief?.fyi ?? [])].find((i) => i.ledgerId === result.entry.id) : null;
  const fill = (s: { channel: Channel; from: string; subject?: string | null; body: string }) => { setChannel(s.channel); setFrom(s.from); setSubject(s.subject ?? ''); setBody(s.body); };
  return (
    <>
      <section className="pt-4 pb-2"><h1 className="text-[34px] leading-[1.1] font-bold">Send me anything.</h1><p className="my-2.5 text-lg leading-snug text-muted">A school email, a coach&apos;s message, a clinic text, a photo of a note typed out. I&apos;ll work out who it&apos;s for, put it where it belongs, and tell you if I need you.</p></section>
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">{CHANNELS.map((c) => <button key={c} onClick={() => setChannel(c)} className={cn('rounded-full border px-3 py-1.5 text-sm', c === channel ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface')}>{label(c)}</button>)}</div>
        <div className="grid gap-2.5"><Input placeholder="From: the school, Coach Sam, the clinic…" value={from} onChange={(e) => setFrom(e.target.value)} /><Input placeholder="Subject (if it's an email)" value={subject} onChange={(e) => setSubject(e.target.value)} /><Textarea placeholder="Paste the message here…" value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <div className="mt-3.5"><Button variant="primary" size="lg" disabled={ingest.isPending || !body.trim()} onClick={() => ingest.mutate({ channel, from: from || 'unknown', subject: subject || undefined, body }, { onSuccess: (r) => { setResult(r); setBody(''); setSubject(''); setFrom(''); } })}>{ingest.isPending ? (hh.aiReady ? 'Reading it with Gemini…' : 'Reading it…') : 'Take care of it'}</Button></div>
        <div className="mt-3 flex flex-wrap gap-2">{h.demo && samples.map((s, i) => <button key={i} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm" onClick={() => fill(s)}>{(s.subject ?? s.from).replace(/\s[–-].*$/, '').slice(0, 26)}</button>)}{EXTRA.map((s) => <button key={s.label} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm" onClick={() => fill(s)}>{s.label}</button>)}</div>
      </Card>
      {item && <><SectionTitle>Here&apos;s what I did</SectionTitle><BriefCard item={item} household={h} /><p className="text-sm text-muted">Read as {result?.signal.kind.replace('_', ' ').toLowerCase()} with {Math.round((result?.signal.confidence ?? 0) * 100)}% confidence{result?.signal.parser === 'llm' ? ' using Gemini' : ''}.</p></>}
      <SectionTitle>Where I read from</SectionTitle>
      <Group>
        <div className="border-b border-line py-3.5"><div className="font-semibold">School, club and shared calendars</div><div className={cn('text-[13px]', h.icsFeeds.length ? 'text-done' : 'text-muted')}>{h.icsFeeds.length ? h.icsFeeds.map((f) => `${f.label} · ${f.events} events`).join(' · ') : 'Paste any calendar link (Compass, Sentral, TeamApp, PlayHQ, Google, Outlook)'}</div>
          <div className="mt-2.5 grid grid-cols-[1fr_130px_auto] gap-2"><Input placeholder="https://… or webcal://… calendar link" value={ics} onChange={(e) => setIcs(e.target.value)} /><Select value={icsChild} onChange={(e) => setIcsChild(e.target.value)}><option value="">Whole family</option>{h.people.filter((p) => p.role === 'CHILD').map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</Select><Button size="sm" disabled={!ics.trim() || addIcs.isPending} onClick={() => addIcs.mutate({ url: ics.trim(), childId: icsChild || undefined }, { onSuccess: () => setIcs('') })}>Add</Button></div></div>
        <div className="border-b border-line py-3.5"><div className="font-semibold">Gmail and Google Calendar</div><div className="text-[13px] text-muted">Coming next on the service: OAuth connect, reading mail, writing events.</div></div>
        <div className="py-3.5"><div className="font-semibold">WhatsApp, SMS, screenshots</div><div className="text-[13px] text-muted">Share or forward to me. On a phone, use the share sheet; on desktop, paste above.</div></div>
      </Group>
      {signals.length > 0 && <><SectionTitle>What&apos;s come in</SectionTitle><Group>{signals.slice(0, 12).map((s) => <div key={s.id} className="grid grid-cols-[1fr_auto] gap-2 border-b border-line py-2.5 text-sm last:border-0"><div><b>{s.extracted.title}</b><div className="text-[13px] text-muted">{s.raw.from} · {label(s.raw.channel)}{s.parser === 'llm' ? ' · read with Gemini' : ''}</div></div><span className="text-xs whitespace-nowrap text-muted">{fmtDay(s.receivedAt)}</span></div>)}</Group></>}
    </>
  );
}
