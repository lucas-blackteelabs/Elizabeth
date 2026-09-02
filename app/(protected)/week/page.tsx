'use client';
import { Avatar } from '@/components/ui/avatar';
import { Group } from '@/components/ui/card';
import { useEvents, useReminders } from '@/hooks/calendar.hooks';
import { useBrief } from '@/hooks/brief.hooks';
import { useHousehold } from '@/hooks/household.hooks';
import { dayLabel, fmtDay, fmtTime } from '@/lib/utils/time';

export default function WeekPage() {
  const { data: hh } = useHousehold();
  const { data: brief } = useBrief();
  const { data: events = [] } = useEvents();
  const { data: reminders = [] } = useReminders();
  if (!hh || !brief) return null;
  const h = hh.household;
  const kids = h.people.filter((p) => p.role === 'CHILD');
  const name = (id: string) => h.people.find((p) => p.id === id)?.name ?? id;
  const place = (id?: string) => h.places.find((p) => p.id === id)?.name;
  const today = brief.generatedAt.slice(0, 10);
  const rows = [...events.map((e) => ({ at: e.start, e })), ...reminders.filter((r) => r.at.slice(0, 10) >= today).map((r) => ({ at: r.at, r }))].sort((a, b) => a.at.localeCompare(b.at));
  const byDay = rows.reduce<Record<string, typeof rows>>((acc, r) => { (acc[r.at.slice(0, 10)] ??= []).push(r); return acc; }, {});
  const days = Object.keys(byDay).sort();
  if (!days.length) return <p className="py-10 text-center text-muted"><b className="mb-1 block font-display text-lg text-ink">Nothing on for the next two weeks</b>Connect a calendar or send me something.</p>;
  return (
    <>
      {days.map((day) => (
        <div key={day}>
          <div className="sticky top-0 z-[1] flex items-baseline justify-between bg-ground pt-5 pb-2 font-display font-bold"><span>{dayLabel(day, today)}</span><span className="text-sm font-medium text-muted">{fmtDay(day)}</span></div>
          <Group>
            {byDay[day].map((x) => 'r' in x && x.r ? (
              <div key={x.r.id} className="grid grid-cols-[74px_1fr] gap-3 border-b border-line py-3 last:border-0"><span className="text-sm font-semibold text-later">{fmtTime(x.r.at)}</span><div><div className="font-medium text-later">{x.r.text}</div><div className="text-[13px] text-muted">Reminder</div></div></div>
            ) : 'e' in x && x.e ? (
              <div key={x.e.id} className="grid grid-cols-[74px_1fr_auto] items-center gap-3 border-b border-line py-3 last:border-0">
                <span className="text-sm font-semibold text-muted">{x.e.end.slice(11) === '23:59' ? 'All day' : fmtTime(x.e.start)}</span>
                <div><div className="font-semibold">{x.e.title}</div><div className="text-[13px] text-muted">{[place(x.e.placeId) ?? x.e.locationText, x.e.notes?.[0]].filter(Boolean).join(' · ')}</div></div>
                <div className="flex items-center gap-2"><div className="flex">{x.e.personIds.map((p) => <span key={p} className="-ml-1.5 first:ml-0"><Avatar name={name(p)} index={kids.findIndex((k) => k.id === p)} size="sm" /></span>)}</div>{x.e.driverId && <span className="rounded-full bg-soft px-2.5 py-1 text-xs whitespace-nowrap text-muted">{name(x.e.driverId)} drives</span>}</div>
              </div>
            ) : null)}
          </Group>
        </div>
      ))}
    </>
  );
}
