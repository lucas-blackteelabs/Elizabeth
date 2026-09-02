'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Stop } from '@phosphor-icons/react';
import { BriefCard, BriefRow } from '@/components/brief/BriefCard';
import { Button } from '@/components/ui/button';
import { Group, SectionTitle } from '@/components/ui/card';
import { appRoutes } from '@/config/appRoutes';
import { useBrief, useBriefScript } from '@/hooks/brief.hooks';
import { useHousehold } from '@/hooks/household.hooks';
import { greeting } from '@/lib/utils/time';

export default function TonightPage() {
  const { data: hh } = useHousehold();
  const { data: b } = useBrief();
  const [wantScript, setWantScript] = useState(false);
  const { data: script } = useBriefScript(wantScript);
  const [speaking, setSpeaking] = useState(false);
  const utter = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!wantScript || !script || speaking || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(script.script);
    u.rate = 0.98;
    u.onend = () => setSpeaking(false);
    utter.current = u;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setSpeaking(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, wantScript]);

  if (!hh || !b) return null;
  const parent = hh.household.people.find((p) => p.role === 'PARENT')?.name;
  const nothingYet = b.compression.signals === 0;
  const toggle = () => { if (speaking) { speechSynthesis.cancel(); setSpeaking(false); setWantScript(false); } else setWantScript(true); };
  return (
    <>
      <section className="pt-4 pb-2">
        <h1 className="text-[34px] leading-[1.1] font-bold">{greeting(b.generatedAt)}{parent ? `, ${parent}` : ''}.</h1>
        <p className="my-2.5 text-lg leading-snug text-muted">{nothingYet ? "Nothing has come in yet. Forward me a school email or paste a message and I'll take it from there." : b.headline}</p>
        {nothingYet ? <Link href={appRoutes.send}><Button variant="primary" size="lg">Send me something</Button></Link> : (
          <button onClick={toggle} className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface py-2.5 pr-4 pl-2.5 font-semibold">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-accent text-accent-ink">{speaking ? <Stop size={14} weight="fill" /> : <Play size={14} weight="fill" />}</span>
            Listen to tonight&apos;s brief
          </button>
        )}
        {wantScript && script && <div className="mt-3 rounded-inner bg-soft px-4 py-3.5 text-[15px] whitespace-pre-line">{script.script}<div className="mt-2 text-xs text-muted">{script.source === 'gemini' ? 'Written by Gemini from tonight\'s brief.' : 'Add a Gemini key on the service for a produced version.'}</div></div>}
      </section>
      {b.decide.length > 0 && <><SectionTitle count={b.decide.length}>Needs you</SectionTitle>{b.decide.map((it) => <BriefCard key={it.ledgerId} item={it} household={hh.household} />)}</>}
      {b.done.length > 0 && <><SectionTitle>Handled</SectionTitle><Group>{b.done.map((it) => <BriefRow key={it.ledgerId} item={it} tone="done" />)}</Group></>}
      {b.later.length > 0 && <><SectionTitle>Parked for later</SectionTitle>{b.later.map((it) => <BriefCard key={it.ledgerId} item={it} household={hh.household} />)}</>}
      {b.fyi.length > 0 && <><SectionTitle>Good to know</SectionTitle><Group>{b.fyi.map((it) => <BriefRow key={it.ledgerId} item={it} tone="fyi" />)}</Group></>}
    </>
  );
}
