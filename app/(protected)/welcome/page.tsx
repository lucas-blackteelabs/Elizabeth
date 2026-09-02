'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { appRoutes } from '@/config/appRoutes';
import { useCommitHousehold, useDraftHousehold, useLoadDemo } from '@/hooks/household.hooks';
import { DraftResponse } from '@/lib/types';
import { sampleIntro } from '@/services/household.service';
import { cn } from '@/lib/utils/cn';

const PRESETS = [['cautious', 'Ask me first', "I prepare everything so it's one tap, but do nothing without you."], ['balanced', 'Balanced', 'I keep the calendar and reminders running; I ask before money and messages.'], ['hands-off', 'Just handle it', 'I pay small fees to the school and clubs, send routine replies, and tell you after.']];

export default function WelcomePage() {
  const router = useRouter();
  const draft = useDraftHousehold();
  const commit = useCommitHousehold();
  const demo = useLoadDemo();
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [fix, setFix] = useState('');
  const [d, setD] = useState<DraftResponse | null>(null);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState('balanced');
  const read = (t: string) => draft.mutate(t, { onSuccess: (r) => { setD(r); setStep(1); } });
  const stepN = <div className="mb-3.5 text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">Setting up · {step + 1} of 4</div>;
  return (
    <div className="grid min-h-screen place-items-center px-[18px] py-7"><div className="w-full max-w-[560px]">
      {step === 0 && <>{stepN}<h1 className="text-4xl leading-[1.08] font-bold">Tell me about your family.</h1><p className="my-3 text-lg text-muted">Just talk. Who&apos;s who, ages, school, the regular things each week, anything I should never get wrong. I&apos;ll do the rest.</p>
        <Textarea className="min-h-56 rounded-card p-4 text-[17px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="We're the Nguyens in Marrickville. Two kids: Mia is 9, Year 4 at Marrickville Public, swimming Tuesdays 4pm. Sam is 6, Kindy, allergic to eggs…" />
        <div className="mt-2 flex items-center justify-between gap-2.5"><button className="text-sm text-muted underline" onClick={async () => setText((await sampleIntro()).data.text)}>Use an example family</button><Button variant="primary" className="min-w-44" disabled={draft.isPending} onClick={() => text.trim().length < 20 ? toast('Tell me a little more: names, ages, the school, the regular activities.') : read(text)}>{draft.isPending ? 'Reading…' : "That's us"}</Button></div>
        <p className="mt-7 text-center text-sm text-muted">Or <button className="underline" onClick={() => demo.mutate(undefined, { onSuccess: () => router.replace(appRoutes.tonight) })}>explore with the demo family</button> first.</p></>}
      {step === 1 && d && <>{stepN}<h1 className="text-4xl leading-[1.08] font-bold">Here&apos;s what I understood.</h1><p className="my-3 text-lg text-muted">{d.source === 'gemini' ? 'Gemini read it. ' : ''}Fix anything I got wrong; I&apos;ll pick it up from what you type.</p>
        <div className="grid gap-2.5">{d.draft.children.map((c, i) => <div key={c.name} className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-inner border border-line bg-surface px-3.5 py-3"><Avatar name={c.name} index={i} size="lg" /><div><div className="font-display text-[17px] font-bold">{c.name}{c.age ? `, ${c.age}` : ''}</div><div className="text-sm text-muted">{[c.yearLevel, c.school, c.allergies?.length ? `allergic to ${c.allergies.join(', ')}` : null, c.interests?.length ? `into ${c.interests.slice(0, 3).join(', ')}` : null].filter(Boolean).join(' · ') || "I'll learn more as things come in"}</div></div></div>)}
          {d.draft.adults.map((a) => <div key={a.name} className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-inner border border-line bg-surface px-3.5 py-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-soft font-bold">{a.name.charAt(0)}</span><div><div className="font-display text-[17px] font-bold">{a.name}</div><div className="text-sm text-muted">{a.role === 'coparent' ? 'Co-parent, separate home' : a.role === 'carer' ? 'Helps out' : 'Parent'}{a.workPattern ? ` · ${a.workPattern}` : ''}</div></div></div>)}</div>
        <div className="mt-3"><Input placeholder="Anything wrong? e.g. 'Leo is 9, not 8' or 'add Nonna, she picks up on Thursdays'" value={fix} onChange={(e) => setFix(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && fix.trim()) { setText(`${text}\n\nCorrections: ${fix}`); read(`${text}\n\nCorrections: ${fix}`); setFix(''); } }} /></div>
        <div className="mt-3 flex items-center justify-between"><button className="text-sm text-muted underline" onClick={() => setStep(0)}>Back</button><div className="flex gap-2"><Button variant="ghost" disabled={!fix.trim() || draft.isPending} onClick={() => { const t = `${text}\n\nCorrections: ${fix}`; setText(t); read(t); setFix(''); }}>Update</Button><Button variant="primary" className="min-w-36" onClick={() => setStep(2)}>Looks right</Button></div></div></>}
      {step === 2 && d && <>{stepN}<h1 className="text-4xl leading-[1.08] font-bold">House rules I&apos;d suggest.</h1><p className="my-3 text-lg text-muted">I&apos;ll check everything against these. Turn off what doesn&apos;t fit; change any of it later.</p>
        {d.suggestedPolicies.map((p) => { const off = disabled.has(p.id) || !p.enabled; return <div key={p.id} className={cn('grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line py-3', off && 'opacity-55')}><div><div className="text-[15px] font-semibold">{p.title}</div><div className="text-[13px] text-muted">{p.description}</div></div><Switch checked={!off} label={p.title} onCheckedChange={(v) => { const n = new Set(disabled); if (v) n.delete(p.id); else n.add(p.id); setDisabled(n); }} /></div>; })}
        <div className="mt-4 flex items-center justify-between"><button className="text-sm text-muted underline" onClick={() => setStep(1)}>Back</button><Button variant="primary" className="min-w-36" onClick={() => setStep(3)}>Good</Button></div></>}
      {step === 3 && d && <>{stepN}<h1 className="text-4xl leading-[1.08] font-bold">How much should I handle?</h1><p className="my-3 text-lg text-muted">I start careful and earn more room each time you say yes. Signing forms always waits for you.</p>
        <div className="grid gap-2.5">{PRESETS.map(([k, t, desc]) => <button key={k} onClick={() => setPreset(k)} className={cn('grid gap-1 rounded-card border border-line bg-surface px-[18px] py-4 text-left', preset === k && 'border-accent shadow-[inset_0_0_0_1px_var(--color-accent)]')}><b className="font-display text-lg">{t}</b><span className="text-sm text-muted">{desc}</span></button>)}</div>
        <div className="mt-4 flex items-center justify-between"><button className="text-sm text-muted underline" onClick={() => setStep(2)}>Back</button><Button variant="primary" className="min-w-40" disabled={commit.isPending} onClick={() => commit.mutate({ draft: d.draft, disabledPolicies: [...disabled, ...d.suggestedPolicies.filter((p) => !p.enabled).map((p) => p.id)], trustPreset: preset }, { onSuccess: () => router.replace(appRoutes.tonight) })}>{commit.isPending ? 'Setting up…' : 'Open my brief'}</Button></div></>}
    </div></div>
  );
}
