'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KidBoard } from '@/components/kids/KidBoard';
import { useBrief } from '@/hooks/brief.hooks';
import { useEvents, useReminders } from '@/hooks/calendar.hooks';
import { useBoard } from '@/hooks/chores.hooks';
import { useHousehold } from '@/hooks/household.hooks';
import { fmtTime } from '@/lib/utils/time';

const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function WallPage() {
  const { data: hh } = useHousehold();
  const { data: brief } = useBrief();
  const { data: events = [] } = useEvents();
  const { data: reminders = [] } = useReminders();
  const { data: board } = useBoard();
  const qc = useQueryClient();
  const [clock, setClock] = useState(new Date());
  useEffect(() => { const t = setInterval(() => { setClock(new Date()); }, 30_000); const r = setInterval(() => qc.invalidateQueries(), 60_000); return () => { clearInterval(t); clearInterval(r); }; }, [qc]);
  if (!hh || !brief || !board) return null;
  const h = hh.household;
  const name = (id: string) => h.people.find((p) => p.id === id)?.name ?? id;
  const place = (id?: string) => h.places.find((p) => p.id === id)?.name;
  const now = new Date(brief.generatedAt);
  const shown = h.demo ? now : clock;
  const today = brief.generatedAt.slice(0, 10);
  const tomorrow = new Date(new Date(today).getTime() + 86400000).toISOString().slice(0, 10);
  const rows = (day: string) => [...events.filter((e) => e.start.slice(0, 10) === day).map((e) => ({ at: e.start, e })), ...reminders.filter((r) => r.at.slice(0, 10) === day).map((r) => ({ at: r.at, r }))].sort((a, b) => a.at.localeCompare(b.at));
  const Day = ({ day }: { day: string }) => { const rs = rows(day); return rs.length ? <>{rs.map((x) => 'r' in x && x.r ? <div key={x.r.id} className="grid grid-cols-[96px_1fr] items-center gap-4 border-b border-[#1E2733] py-3.5 text-xl"><span className="font-semibold text-[#98A4B5]">{fmtTime(x.r.at)}</span><div className="text-[#9FAEE6]">{x.r.text}</div></div> : 'e' in x && x.e ? <div key={x.e.id} className="grid grid-cols-[96px_1fr_auto] items-center gap-4 border-b border-[#1E2733] py-3.5 text-xl"><span className="font-semibold text-[#98A4B5]">{x.e.end.slice(11) === '23:59' ? 'All day' : fmtTime(x.e.start)}</span><div><div className="font-semibold">{x.e.title}</div><div className="text-[15px] text-[#98A4B5]">{[x.e.personIds.map(name).join(' & '), place(x.e.placeId) ?? x.e.locationText].filter(Boolean).join(' · ')}</div></div>{x.e.driverId ? <span className="rounded-full bg-[#1A2330] px-3 py-1.5 text-sm whitespace-nowrap text-[#98A4B5]">{name(x.e.driverId)} drives</span> : <span />}</div> : null)}</> : <div className="py-3 text-lg text-[#66738A]">Nothing on. Enjoy it.</div>; };
  const one = brief.decide[0] ?? brief.done[0] ?? brief.later[0];
  return (
    <div className="grid min-h-screen grid-cols-[1.1fr_1.3fr_1fr] gap-10 px-14 py-12 max-[1100px]:grid-cols-2">
      <div><div className="font-display text-[clamp(72px,9vw,132px)] leading-[0.95] font-bold tracking-tight">{shown.getHours() % 12 || 12}:{String(shown.getMinutes()).padStart(2, '0')}</div><div className="mt-2 text-[26px] text-[#98A4B5]">{LONG[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]}</div>
        <div className="mt-9 max-w-[30ch] text-[22px] leading-snug">{brief.decide.length ? <><b className="text-[#F0B64A]">{brief.decide.length === 1 ? 'One thing' : `${brief.decide.length} things`}</b> waiting for a parent on the phone.</> : 'Nothing waiting for anyone.'}{brief.compression.automated ? ` ${brief.compression.automated} things handled today.` : ''}</div>
        {one && <div className="mt-7 rounded-[20px] bg-[#141B24] px-5 py-[18px] text-[19px] leading-snug text-[#C9D2DD]">{one.narrative}</div>}</div>
      <div><h2 className="mb-3.5 text-[15px] font-bold tracking-[0.12em] text-[#98A4B5] uppercase">Today</h2><Day day={today} /><h2 className="mt-8 mb-3.5 text-[15px] font-bold tracking-[0.12em] text-[#98A4B5] uppercase">Tomorrow</h2><Day day={tomorrow} /></div>
      <div className="grid content-start gap-5 max-[1100px]:col-span-2">{board.perChild.map((k, i) => <KidBoard key={k.childId} view={board} kid={k} index={i} big />)}</div>
    </div>
  );
}
