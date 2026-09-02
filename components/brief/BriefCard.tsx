import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useDecide } from '@/hooks/useBrief';
import { useTheme } from '@/theme/ThemeContext';
import { BriefItem, Household } from '@/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const split = (t: string) => { const i = t.indexOf(':'); return i === -1 ? { who: [] as string[], rest: cap(t) } : { who: t.slice(0, i).split('&').map((s) => s.trim()), rest: cap(t.slice(i + 1).trim()) }; };
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

export const BriefCard = ({ item, household }: { item: BriefItem; household: Household }) => {
  const { theme } = useTheme();
  const { mutate, isPending } = useDecide();
  const [open, setOpen] = useState(false);
  const { who, rest } = split(item.title);
  const kids = household.people.filter((p) => p.role === 'CHILD');
  const msgs = item.actions.filter((a) => (a.cls === 'OUTBOUND_MESSAGE' || a.cls === 'COPARENT_REPLY') && a.disposition !== 'EXECUTED');
  const canDecide = ['AWAITING_DECISION', 'SCHEDULED', 'SNOOZED'].includes(item.state);
  const go = (kind: 'APPROVE' | 'DECLINE' | 'SNOOZE', alternativeIndex?: number) => mutate({ ledgerId: item.ledgerId, kind, alternativeIndex });
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row' }}>{who.map((n) => { const i = kids.findIndex((k) => k.name === n); return i === -1 ? null : <View key={n} style={{ marginLeft: -6 }}><Avatar name={n} index={i} /></View>; })}</View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.ink }}>{rest}</Text>
          <Text style={{ fontSize: 14, color: theme.colors.muted, marginTop: 2 }}>{item.summary}{item.dueLabel ? <Text style={{ color: theme.colors.need, fontWeight: '600' }}> · {item.dueLabel}</Text> : null}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 16, lineHeight: 24, marginTop: 12, color: theme.colors.ink }}>{item.narrative}</Text>
      {msgs.map((m) => <View key={m.id} style={{ marginTop: 12, backgroundColor: theme.colors.soft, borderRadius: theme.radius.inner, padding: 12 }}><Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{m.cls === 'COPARENT_REPLY' ? 'Reply I drafted' : 'Message I drafted'}</Text><Text style={{ fontSize: 15, lineHeight: 21, color: theme.colors.ink }}>{m.detail}</Text></View>)}
      {item.flags.filter((f) => f.level !== 'INFO').map((f, i) => <Text key={i} style={{ marginTop: 10, fontSize: 14, color: f.level === 'BLOCK' ? theme.colors.danger : theme.colors.need }}>{f.message}</Text>)}
      {canDecide && (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}><Button title={primaryLabel(item)} variant="primary" grow disabled={isPending} onPress={() => go('APPROVE')} /><Button title="Tomorrow" variant="ghost" disabled={isPending} onPress={() => go('SNOOZE')} /></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {item.alternatives.map((a, i) => <Button key={i} title={a.label} variant={a.actions.length ? 'secondary' : 'ghost'} disabled={isPending} onPress={() => (a.actions.length ? go('APPROVE', i) : go('DECLINE'))} />)}
            {!item.alternatives.length && <Button title="No thanks" variant="ghost" disabled={isPending} onPress={() => go('DECLINE')} />}
          </View>
        </>
      )}
      <Pressable onPress={() => setOpen(!open)}><Text style={{ marginTop: 12, fontSize: 14, color: theme.colors.muted }}>{open ? 'Hide the details' : 'What I did and why'}</Text></Pressable>
      {open && (
        <View style={{ marginTop: 8, gap: 6 }}>
          {item.originalMessage ? <View style={{ backgroundColor: theme.colors.soft, borderRadius: theme.radius.inner, padding: 12 }}><Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 4 }}>WHAT ACTUALLY ARRIVED</Text><Text style={{ fontSize: 14, color: theme.colors.ink }}>{item.originalMessage}</Text></View> : null}
          {item.actions.map((a) => <Text key={a.id} style={{ fontSize: 14, color: theme.colors.ink }}>{a.disposition === 'EXECUTED' ? '✓ ' : '· '}{a.title}{a.amount ? ` $${a.amount}` : ''}</Text>)}
          {item.why.map((w, i) => <Text key={i} style={{ fontSize: 13, color: theme.colors.muted }}>• {w}</Text>)}
        </View>
      )}
    </Card>
  );
};
