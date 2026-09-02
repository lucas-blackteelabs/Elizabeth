'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { appRoutes } from '@/config/appRoutes';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold, useLoadDemo, useSetPolicy, useSetTrust } from '@/hooks/household.hooks';
import { ActionClass } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const TRUST = ['Watch only', 'Suggest', 'Prepare', 'Do it, tell me', 'Just do it'];
const SHORT = ['Watch', 'Suggest', 'Prepare', 'Do & tell', 'Just do'];
const AREAS: Record<ActionClass, string> = { CALENDAR_WRITE: 'Calendar', REMINDER: 'Reminders', SIGN_FORM: 'Signing forms', PAYMENT: 'Paying fees', OUTBOUND_MESSAGE: 'Messaging people', COPARENT_REPLY: 'Replying to the co-parent', PURCHASE: 'Buying things', ENROLMENT: 'Enrolling the kids' };
const PRESETS = [['cautious', 'Ask me first', 'Prepare everything, do nothing without a tap.'], ['balanced', 'Balanced', 'Handle calendar and reminders; ask about money and messages.'], ['hands-off', 'Just handle it', 'Pay small fees, send routine messages, tell me after.']];

export default function SettingsPage() {
  const { data } = useHousehold();
  const setTrust = useSetTrust();
  const setPolicy = useSetPolicy();
  const loadDemo = useLoadDemo();
  const { logout } = useAuth();
  if (!data) return null;
  const h = data.household;
  const lv = Object.fromEntries(h.trust.map((t) => [t.cls, t.level]));
  const preset = lv.CALENDAR_WRITE >= 4 && lv.PAYMENT >= 3 ? 'hands-off' : lv.CALENDAR_WRITE <= 2 && lv.PAYMENT <= 1 ? 'cautious' : 'balanced';
  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold">How much should I handle?</h1><p className="mb-2 text-muted">I earn more room as you say yes. You can always dial it back.</p>
      <div className="my-2.5 grid grid-cols-3 gap-2">{PRESETS.map(([k, t, d]) => <button key={k} onClick={() => setTrust.mutate({ preset: k })} className={cn('grid gap-1 rounded-inner border border-line bg-surface p-3 text-left', preset === k && 'border-accent shadow-[inset_0_0_0_1px_var(--color-accent)]')}><b className="font-display">{t}</b><span className="text-xs leading-tight text-muted">{d}</span></button>)}</div>
      {h.promotionsOffered.map((cls) => { const t = h.trust.find((x) => x.cls === cls)!; return <div key={cls} className="my-2 grid gap-2 rounded-inner bg-need-soft px-3.5 py-3 text-sm"><span>You&apos;ve said yes to <b>{AREAS[t.cls].toLowerCase()}</b> {t.approvals} times in a row. Want me to just handle those and tell you?</span><Button size="sm" onClick={() => setTrust.mutate({ cls: cls as ActionClass, level: 3 })}>Yes, go ahead</Button></div>; })}
      {h.trust.map((t) => <div key={t.cls} className="grid gap-1 border-b border-line py-3"><div className="flex justify-between text-[15px] font-semibold">{AREAS[t.cls]}<span className="text-[13px] font-medium text-muted">{TRUST[t.level]}{t.pinned ? ' · locked' : ''}</span></div><div className="flex gap-1">{SHORT.map((l, i) => <button key={i} title={TRUST[i]} onClick={() => setTrust.mutate({ cls: t.cls, level: i })} className={cn('h-[30px] flex-1 rounded-lg border border-line bg-surface text-xs text-muted', i === t.level && 'border-accent bg-accent text-accent-ink')}>{l}</button>)}</div></div>)}
      <h1 className="mt-7 text-2xl font-bold">House rules</h1><p className="mb-1 text-muted">I check everything against these.</p>
      {h.policies.map((p) => <div key={p.id} className={cn('grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line py-3', !p.enabled && 'opacity-55')}><div><div className="text-[15px] font-semibold">{p.title}</div><div className="text-[13px] text-muted">{p.description}</div></div><Switch checked={p.enabled} onCheckedChange={(v) => setPolicy.mutate({ id: p.id, enabled: v })} label={p.title} /></div>)}
      <h1 className="mt-7 text-2xl font-bold">Reading with Gemini</h1><p className="text-muted">{data.aiReady ? `The service is connected to ${data.aiModel}. Messy inputs get read properly and the brief can be written for speech.` : 'The service has no model key; it uses the rules-based reader. Set GOOGLE_API_KEY on the service to turn Gemini on.'}</p>
      <hr className="my-5 border-line" />
      <p className="text-sm text-muted">Wall display: <Link className="underline" href={appRoutes.wall}>open the always-on view</Link> on a tablet or TV. Add this page to your phone&apos;s home screen for the app.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Link href={appRoutes.welcome}><Button size="sm" variant="ghost">Start over with my family</Button></Link><Button size="sm" variant="ghost" onClick={() => loadDemo.mutate()}>{h.demo ? 'Reset the demo' : 'Load the demo family'}</Button><Button size="sm" variant="ghost" onClick={logout}>Sign out</Button></div>
    </div>
  );
}
