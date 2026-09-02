'use client';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDecide } from '@/hooks/ledger.hooks';
import { BriefItem, Household } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const split = (t: string) => { const i = t.indexOf(':'); return i === -1 ? { who: [] as string[], rest: cap(t) } : { who: t.slice(0, i).split('&').map((s) => s.trim()), rest: cap(t.slice(i + 1).trim()) }; };
const KIND = { PERMISSION_REQUEST: 'Permission', SCHEDULE_CHANGE: 'Schedule change', INVITATION: 'Invitation', APPOINTMENT: 'Appointment', PURCHASE_NEED: 'Purchase', REGISTRATION: 'Registration', COPARENT_MESSAGE: 'Co-parent', EVENT: 'Event', FYI: 'FYI' } as Record<string, string>;

const primaryLabel = (it: BriefItem) => {
  const pending = it.actions.filter((a) => a.disposition === 'STAGED' || a.disposition === 'SUGGESTED');
  if (pending.length === 1) {
    const a = pending[0];
    if (a.cls === 'SIGN_FORM') return 'Sign it';
    if (a.cls === 'COPARENT_REPLY') return 'Send the reply';
    if (a.cls === 'OUTBOUND_MESSAGE') return /rsvp/i.test(a.title) ? 'Send the RSVP' : 'Send it';
    if (a.cls === 'PAYMENT') return `Pay $${a.amount}`;
    if (a.cls === 'PURCHASE') return a.amount ? `Order it, about $${a.amount}` : 'Order it';
    if (a.cls === 'ENROLMENT') return 'Yes, enrol';
  }
  return 'Yes, do all of that';
};

export const BriefCard = ({ item, household, decidable = true }: { item: BriefItem; household: Household; decidable?: boolean }) => {
  const { mutate, isPending } = useDecide();
  const [open, setOpen] = useState(false);
  const { who, rest } = split(item.title);
  const kids = household.people.filter((p) => p.role === 'CHILD');
  const msgs = item.actions.filter((a) => (a.cls === 'OUTBOUND_MESSAGE' || a.cls === 'COPARENT_REPLY') && a.disposition !== 'EXECUTED');
  const canDecide = decidable && ['AWAITING_DECISION', 'SCHEDULED', 'SNOOZED'].includes(item.state);
  const go = (kind: 'APPROVE' | 'DECLINE' | 'SNOOZE', alternativeIndex?: number) => mutate({ ledgerId: item.ledgerId, kind, alternativeIndex });
  return (
    <Card className="mb-3">
      <div className="flex items-center gap-3">
        <div className="flex">{who.map((n) => { const i = kids.findIndex((k) => k.name === n); return i === -1 ? null : <span key={n} className="-ml-1.5 first:ml-0 rounded-full border-2 border-surface"><Avatar name={n} index={i} /></span>; })}</div>
        <div>
          <div className="font-display text-lg leading-tight font-bold">{rest}</div>
          <div className="mt-0.5 text-sm text-muted">{item.summary}{item.dueLabel ? <> · <span className="font-semibold text-need">{item.dueLabel}</span></> : null}</div>
        </div>
      </div>
      <p className="mt-3 text-[16px] leading-relaxed">{item.narrative}</p>
      {msgs.map((m) => (
        <div key={m.id} className="mt-3 rounded-inner bg-soft px-3.5 py-3 text-[15px] leading-snug">
          <div className="mb-1 text-[12px] font-semibold tracking-wider text-muted uppercase">{m.cls === 'COPARENT_REPLY' ? 'Reply I drafted' : 'Message I drafted'}</div>
          {m.detail}
        </div>
      ))}
      {item.flags.filter((f) => f.level !== 'INFO').map((f, i) => <p key={i} className={cn('mt-2.5 text-sm', f.level === 'BLOCK' ? 'font-semibold text-danger' : 'text-need')}>{f.message}</p>)}
      {canDecide && (
        <>
          <div className="mt-3.5 flex gap-2.5">
            <Button variant="primary" size="lg" disabled={isPending} onClick={() => go('APPROVE')}>{primaryLabel(item)}</Button>
            <Button variant="ghost" disabled={isPending} onClick={() => go('SNOOZE')}>Tomorrow</Button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {item.alternatives.map((a, i) => a.actions.length
              ? <Button key={i} size="sm" disabled={isPending} onClick={() => go('APPROVE', i)}>{a.label}</Button>
              : <Button key={i} size="sm" variant="ghost" disabled={isPending} onClick={() => go('DECLINE')}>{a.label}</Button>)}
            {!item.alternatives.length && <Button size="sm" variant="ghost" disabled={isPending} onClick={() => go('DECLINE')}>No thanks</Button>}
          </div>
        </>
      )}
      <button className="mt-3 text-sm text-muted" onClick={() => setOpen(!open)}>{open ? 'Hide the details' : 'What I did and why'}</button>
      {open && (
        <div className="mt-2">
          {item.originalMessage && <div className="mb-2 rounded-inner bg-soft px-3.5 py-3 text-[14px]"><div className="mb-1 text-[12px] font-semibold tracking-wider text-muted uppercase">What actually arrived</div>{item.originalMessage}</div>}
          <ul className="grid gap-2 text-sm">
            {item.actions.map((a) => (
              <li key={a.id} className="grid grid-cols-[20px_1fr] gap-2.5">
                <span className={cn('mt-0.5 grid h-[18px] w-[18px] place-items-center rounded-full text-[11px] font-extrabold', a.disposition === 'EXECUTED' ? 'bg-done-soft text-done' : a.disposition === 'OBSERVED' ? 'bg-soft text-muted' : 'bg-need-soft text-need')}>{a.disposition === 'EXECUTED' ? '✓' : '·'}</span>
                <div><div>{a.title}{a.amount ? <span className="text-muted"> ${a.amount}</span> : null}</div>{a.cls !== 'OUTBOUND_MESSAGE' && a.cls !== 'COPARENT_REPLY' && <div className="whitespace-pre-line text-muted">{a.detail}</div>}</div>
              </li>
            ))}
          </ul>
          <ul className="mt-2.5 list-disc pl-5 text-sm text-muted">{item.why.map((w, i) => <li key={i}>{w}</li>)}{item.flags.filter((f) => f.level === 'INFO').map((f, i) => <li key={'f' + i}>{f.message}</li>)}</ul>
        </div>
      )}
      <span className="mt-2 inline-block rounded-full bg-soft px-2 py-0.5 text-[11px] text-muted">{KIND[item.kind] ?? item.kind}</span>
    </Card>
  );
};

export const BriefRow = ({ item, tone }: { item: BriefItem; tone: 'done' | 'fyi' }) => {
  const { rest } = split(item.title);
  return (
    <div className="grid grid-cols-[34px_1fr] gap-3 border-b border-line py-3 last:border-0">
      <span className={cn('grid h-[34px] w-[34px] place-items-center rounded-full text-sm font-bold', tone === 'done' ? 'bg-done-soft text-done' : 'bg-soft text-muted')}>{tone === 'done' ? '✓' : 'i'}</span>
      <div><div className="font-semibold">{rest}</div><div className="text-[15px] text-muted">{tone === 'done' ? item.narrative : item.summary}</div></div>
    </div>
  );
};
