import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/common/Button';
import { Screen } from '@/components/common/Screen';
import { appRoutes } from '@/config/appRoutes';
import { useAuthContext } from '@/context/AuthContext';
import { useHousehold, useLoadDemo, useSetPolicy, useSetTrust } from '@/hooks/useHousehold';
import { useTheme } from '@/theme/ThemeContext';
import { ActionClass } from '@/types';

const TRUST = ['Watch only', 'Suggest', 'Prepare', 'Do it, tell me', 'Just do it'];
const SHORT = ['Watch', 'Suggest', 'Prepare', 'Do & tell', 'Just do'];
const AREAS: Record<ActionClass, string> = { CALENDAR_WRITE: 'Calendar', REMINDER: 'Reminders', SIGN_FORM: 'Signing forms', PAYMENT: 'Paying fees', OUTBOUND_MESSAGE: 'Messaging people', COPARENT_REPLY: 'Replying to the co-parent', PURCHASE: 'Buying things', ENROLMENT: 'Enrolling the kids' };
const PRESETS: [string, string, string][] = [['cautious', 'Ask me first', 'Prepare everything, do nothing without a tap.'], ['balanced', 'Balanced', 'Handle calendar and reminders; ask about money and messages.'], ['hands-off', 'Just handle it', 'Pay small fees, send routine messages, tell me after.']];

export default function SettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data } = useHousehold();
  const setTrust = useSetTrust();
  const setPolicy = useSetPolicy();
  const loadDemo = useLoadDemo();
  const { logout } = useAuthContext();
  if (!data) return <Screen />;
  const h = data.household;
  return (
    <Screen title="How much should I handle?" subtitle="I earn more room as you say yes. You can always dial it back.">
      <View style={{ flexDirection: 'row', gap: 8 }}>{PRESETS.map(([k, t, d]) => <Pressable key={k} onPress={() => setTrust.mutate({ preset: k })} style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, borderRadius: theme.radius.inner, padding: 12 }}><Text style={{ fontWeight: '700', color: theme.colors.ink }}>{t}</Text><Text style={{ fontSize: 12, color: theme.colors.muted }}>{d}</Text></Pressable>)}</View>
      {h.promotionsOffered.map((cls) => { const t = h.trust.find((x) => x.cls === cls); return t ? <View key={cls} style={{ backgroundColor: theme.colors.needSoft, borderRadius: theme.radius.inner, padding: 12, marginTop: 10, gap: 8 }}><Text style={{ color: theme.colors.ink }}>You&apos;ve said yes to {AREAS[t.cls].toLowerCase()} {t.approvals} times in a row. Want me to just handle those and tell you?</Text><Button title="Yes, go ahead" onPress={() => setTrust.mutate({ cls: cls as ActionClass, level: 3 })} /></View> : null; })}
      {h.trust.map((t) => <View key={t.cls} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line, gap: 6 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontWeight: '600', color: theme.colors.ink }}>{AREAS[t.cls]}</Text><Text style={{ fontSize: 13, color: theme.colors.muted }}>{TRUST[t.level]}{t.pinned ? ' · locked' : ''}</Text></View>
        <View style={{ flexDirection: 'row', gap: 4 }}>{SHORT.map((l, i) => <Pressable key={i} onPress={() => setTrust.mutate({ cls: t.cls, level: i })} style={{ flex: 1, height: 30, borderRadius: 8, borderWidth: 1, borderColor: i === t.level ? theme.colors.accent : theme.colors.line, backgroundColor: i === t.level ? theme.colors.accent : theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 11, color: i === t.level ? theme.colors.accentInk : theme.colors.muted }}>{l}</Text></Pressable>)}</View></View>)}
      <Text style={{ fontSize: 24, fontWeight: '700', marginTop: 28, color: theme.colors.ink }}>House rules</Text>
      {h.policies.map((p) => <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line, opacity: p.enabled ? 1 : 0.55 }}><View style={{ flex: 1 }}><Text style={{ fontWeight: '600', color: theme.colors.ink }}>{p.title}</Text><Text style={{ fontSize: 13, color: theme.colors.muted }}>{p.description}</Text></View><Switch value={p.enabled} onValueChange={(v) => setPolicy.mutate({ id: p.id, enabled: v })} trackColor={{ true: theme.colors.done }} /></View>)}
      <Text style={{ marginTop: 20, color: theme.colors.muted }}>{data.aiReady ? `Reading with ${data.aiModel}.` : 'The service has no model key; it uses the rules-based reader.'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        <Button title="Start over with my family" variant="ghost" onPress={() => router.push(appRoutes.onboarding)} />
        <Button title={h.demo ? 'Reset the demo' : 'Load the demo family'} variant="ghost" onPress={() => loadDemo.mutate()} />
        <Button title="Sign out" variant="ghost" onPress={async () => { await logout(); router.replace(appRoutes.auth.base); }} />
      </View>
    </Screen>
  );
}
