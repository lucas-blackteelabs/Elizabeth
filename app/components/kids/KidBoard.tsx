'use client';
import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { useAddChore, useApproveClaim, useClaimReward, useCompleteChore, useUndoChore } from '@/hooks/chores.hooks';
import { BoardView } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { fmtDay, KID_COLOURS } from '@/lib/utils/time';

export const KidBoard = ({ view, index, kid, parentMode = true, big = false }: { view: BoardView; index: number; kid: BoardView['perChild'][number]; parentMode?: boolean; big?: boolean }) => {
  const complete = useCompleteChore();
  const undo = useUndoChore();
  const add = useAddChore();
  const claim = useClaimReward();
  const approve = useApproveClaim();
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(5);
  const [cadence, setCadence] = useState('DAILY');
  const c = KID_COLOURS[index % KID_COLOURS.length];
  const chores = view.board.chores.filter((ch) => ch.childId === kid.childId && (kid.due.includes(ch.id) || kid.doneToday.includes(ch.id))).sort((a, b) => (a.cadence === 'ONCE' ? -1 : 1) - (b.cadence === 'ONCE' ? -1 : 1));
  const target = 30;
  const claims = view.board.claims.filter((cl) => cl.childId === kid.childId && !cl.approved);
  return (
    <section className={cn('mb-3.5 rounded-card border border-line bg-surface p-[18px]', big && 'border-0 bg-[#141B24] text-[#EEF2F6]')}>
      <div className="flex items-center gap-3"><Avatar name={kid.name} index={index} size={big ? 'lg' : 'md'} /><span className={cn('font-display font-bold', big ? 'text-2xl' : 'text-xl')}>{kid.name}</span>
        <div className="ml-auto text-right"><b className="block font-display text-2xl leading-none" style={big ? { color: c } : undefined}>{kid.balance}</b><span className={cn('text-xs', big ? 'text-[#98A4B5]' : 'text-muted')}>points{kid.streak >= 2 ? ` · ${kid.streak}-day streak` : ''}</span></div></div>
      {!big && <><div className="my-3 h-2 overflow-hidden rounded-full bg-soft"><i className="block h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((kid.week / target) * 100))}%`, background: c }} /></div>
        <div className="flex justify-between text-[13px] text-muted"><span>{kid.week} this week</span><span>{target} for a great week</span></div></>}
      <div className={cn('mt-3', big ? '' : 'mt-4')}>
        {chores.length ? chores.map((ch) => { const done = kid.doneToday.includes(ch.id); return (
          <div key={ch.id} className={cn('grid grid-cols-[30px_1fr_auto] items-center gap-3 border-b py-3 last:border-0', big ? 'border-[#1E2733] text-lg' : 'border-line')}>
            <button aria-label={done ? 'Undo' : 'Done'} onClick={() => (done ? undo.mutate(ch.id) : complete.mutate(ch.id))} className={cn('grid h-[26px] w-[26px] place-items-center rounded-full border-2 text-white', done ? 'border-transparent' : big ? 'border-[#2A3644]' : 'border-line', big && 'h-9 w-9')} style={done ? { background: c, borderColor: c } : undefined}><Check size={big ? 18 : 14} weight="bold" className={done ? '' : 'opacity-0'} /></button>
            <div><div className={cn('font-medium', done && 'line-through', done && (big ? 'text-[#66738A]' : 'text-muted'))}>{ch.title}</div>{!big && <div className="text-xs text-muted">{ch.cadence === 'ONCE' ? `One-off${ch.dueAt ? ` · by ${fmtDay(ch.dueAt)}` : ''}${ch.source === 'agent' ? ' · I suggested this' : ''}` : ch.cadence === 'DAILY' ? 'Every day' : 'Once a week'}</div>}</div>
            <span className="font-display text-sm font-bold" style={{ color: c }}>+{ch.points}</span>
          </div>); }) : <p className={cn('py-2 text-sm', big ? 'text-[#66738A]' : 'text-muted')}>All done for today.</p>}
      </div>
      {parentMode && !big && (
        <>
          <div className="mt-3 grid grid-cols-[1fr_64px_100px_auto] gap-2"><Input placeholder="Add a chore" value={title} onChange={(e) => setTitle(e.target.value)} /><Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} aria-label="points" /><Select value={cadence} onChange={(e) => setCadence(e.target.value)}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="ONCE">Once</option></Select><Button size="sm" onClick={() => { if (title.trim()) { add.mutate({ childId: kid.childId, title: title.trim(), points, cadence }); setTitle(''); } }}>Add</Button></div>
          <h3 className="mt-5 mb-2 text-[13px] font-bold tracking-[0.08em] text-muted uppercase">Rewards</h3>
          <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none]">{view.board.rewards.map((r) => (
            <div key={r.id} className="grid w-[150px] shrink-0 gap-1.5 rounded-inner bg-soft p-3"><div className="text-sm leading-tight font-semibold">{r.title}</div><div className="text-xs text-muted">{r.cost} points</div>
              <Button size="sm" variant={kid.balance >= r.cost ? 'secondary' : 'ghost'} disabled={kid.balance < r.cost} onClick={() => claim.mutate({ childId: kid.childId, rewardId: r.id })}>{kid.balance >= r.cost ? 'Claim' : `${r.cost - kid.balance} to go`}</Button></div>))}</div>
          {claims.map((cl) => <div key={cl.id} className="mt-2 flex items-center justify-between gap-3 rounded-inner bg-need-soft px-3.5 py-3 text-sm"><span>{kid.name} claimed <b>{view.board.rewards.find((r) => r.id === cl.rewardId)?.title}</b>. Parent to approve.</span><Button size="sm" onClick={() => approve.mutate(cl.id)}>Approve</Button></div>)}
        </>
      )}
    </section>
  );
};
