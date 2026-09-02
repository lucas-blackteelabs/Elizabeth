import React, { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { appRoutes } from '@/config/appRoutes';
import { useCommitHousehold, useDraftHousehold, useLoadDemo } from '@/hooks/useHousehold';
import { sampleIntro } from '@/services/householdService';
import { useTheme } from '@/theme/ThemeContext';
import { DraftResponse } from '@/types';

const PRESETS: [string, string, string][] = [['cautious', 'Ask me first', "I prepare everything so it's one tap, but do nothing without you."], ['balanced', 'Balanced', 'I keep the calendar and reminders running; I ask before money and messages.'], ['hands-off', 'Just handle it', 'I pay small fees to the school and clubs, send routine replies, and tell you after.']];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const draft = useDraftHousehold();
  const commit = useCommitHousehold();
  const demo = useLoadDemo();
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [fix, setFix] = useState('');
  const [d, setD] = useState<DraftResponse | null>(null);
  const [disabled, setDisabled] = useState<string[]>([]);
  const [preset, setPreset] = useState('balanced');
  const read = (t: string) => draft.mutate(t, { onSuccess: (r) => { setD(r); setStep(1); }, onError: () => Toast.show({ type: 'error', text1: 'Could not read that. Try adding names and ages.' }) });
  const input = { borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 16, fontSize: 17, color: theme.colors.ink, minHeight: 200, textAlignVertical: 'top' as const };
  const stepLabel = <Text style={{ fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.muted, marginBottom: 14 }}>Setting up · {step + 1} of 4</Text>;
  return (
    <Screen>
      {step === 0 && <>{stepLabel}<Text style={{ fontSize: 34, fontWeight: '700', lineHeight: 38, color: theme.colors.ink }}>Tell me about your family.</Text><Text style={{ fontSize: 18, lineHeight: 26, color: theme.colors.muted, marginVertical: 12 }}>Just talk. Who&apos;s who, ages, school, the regular things each week, anything I should never get wrong.</Text>
        <TextInput multiline value={text} onChangeText={setText} placeholder="We're the Nguyens in Marrickville. Two kids: Mia is 9, Year 4 at Marrickville Public…" placeholderTextColor={theme.colors.muted} style={input} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}><Pressable onPress={async () => setText(await sampleIntro())}><Text style={{ color: theme.colors.muted, textDecorationLine: 'underline' }}>Use an example family</Text></Pressable><Button title={draft.isPending ? 'Reading…' : "That's us"} variant="primary" disabled={draft.isPending} onPress={() => (text.trim().length < 20 ? Toast.show({ type: 'info', text1: 'Tell me a little more: names, ages, the school.' }) : read(text))} /></View>
        <Pressable onPress={() => demo.mutate(undefined, { onSuccess: () => router.replace(appRoutes.tonight) })} style={{ marginTop: 28 }}><Text style={{ textAlign: 'center', color: theme.colors.muted }}>Or explore with the demo family first.</Text></Pressable></>}
      {step === 1 && d && <>{stepLabel}<Text style={{ fontSize: 34, fontWeight: '700', lineHeight: 38, color: theme.colors.ink }}>Here&apos;s what I understood.</Text><Text style={{ fontSize: 18, color: theme.colors.muted, marginVertical: 12 }}>{d.source === 'gemini' ? 'Gemini read it. ' : ''}Fix anything I got wrong.</Text>
        {d.draft.children.map((c, i) => <View key={c.name} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.inner, padding: 12, marginBottom: 8 }}><Avatar name={c.name} index={i} size={40} /><View><Text style={{ fontWeight: '700', fontSize: 17, color: theme.colors.ink }}>{c.name}{c.age ? `, ${c.age}` : ''}</Text><Text style={{ fontSize: 14, color: theme.colors.muted }}>{[c.yearLevel, c.school, c.allergies?.length ? `allergic to ${c.allergies.join(', ')}` : null].filter(Boolean).join(' · ') || "I'll learn more as things come in"}</Text></View></View>)}
        {d.draft.adults.map((a) => <View key={a.name} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.inner, padding: 12, marginBottom: 8 }}><View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '700', color: theme.colors.ink }}>{a.name.charAt(0)}</Text></View><View><Text style={{ fontWeight: '700', fontSize: 17, color: theme.colors.ink }}>{a.name}</Text><Text style={{ fontSize: 14, color: theme.colors.muted }}>{a.role === 'coparent' ? 'Co-parent, separate home' : 'Parent'}</Text></View></View>)}
        <TextInput value={fix} onChangeText={setFix} placeholder="Anything wrong? e.g. 'Leo is 9, not 8'" placeholderTextColor={theme.colors.muted} style={[input, { minHeight: 0, borderRadius: theme.radius.inner, padding: 12, fontSize: 15, marginTop: 6 }]} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Button title="Back" variant="ghost" onPress={() => setStep(0)} /><View style={{ flexDirection: 'row', gap: 8 }}><Button title="Update" variant="ghost" disabled={!fix.trim() || draft.isPending} onPress={() => { const t = `${text}\n\nCorrections: ${fix}`; setText(t); read(t); setFix(''); }} /><Button title="Looks right" variant="primary" onPress={() => setStep(2)} /></View></View></>}
      {step === 2 && d && <>{stepLabel}<Text style={{ fontSize: 34, fontWeight: '700', lineHeight: 38, color: theme.colors.ink }}>House rules I&apos;d suggest.</Text><Text style={{ fontSize: 18, color: theme.colors.muted, marginVertical: 12 }}>Turn off what doesn&apos;t fit; change any of it later.</Text>
        {d.suggestedPolicies.map((p) => { const off = disabled.includes(p.id) || !p.enabled; return <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line, opacity: off ? 0.55 : 1 }}><View style={{ flex: 1 }}><Text style={{ fontWeight: '600', color: theme.colors.ink }}>{p.title}</Text><Text style={{ fontSize: 13, color: theme.colors.muted }}>{p.description}</Text></View><Switch value={!off} onValueChange={(v) => setDisabled(v ? disabled.filter((x) => x !== p.id) : [...disabled, p.id])} trackColor={{ true: theme.colors.done }} /></View>; })}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}><Button title="Back" variant="ghost" onPress={() => setStep(1)} /><Button title="Good" variant="primary" onPress={() => setStep(3)} /></View></>}
      {step === 3 && d && <>{stepLabel}<Text style={{ fontSize: 34, fontWeight: '700', lineHeight: 38, color: theme.colors.ink }}>How much should I handle?</Text><Text style={{ fontSize: 18, color: theme.colors.muted, marginVertical: 12 }}>I start careful and earn more room each time you say yes. Signing forms always waits for you.</Text>
        {PRESETS.map(([k, t, desc]) => <Pressable key={k} onPress={() => setPreset(k)} style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: preset === k ? theme.colors.accent : theme.colors.line, borderRadius: theme.radius.card, padding: 16, marginBottom: 10 }}><Text style={{ fontWeight: '700', fontSize: 18, color: theme.colors.ink }}>{t}</Text><Text style={{ fontSize: 14, color: theme.colors.muted }}>{desc}</Text></Pressable>)}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}><Button title="Back" variant="ghost" onPress={() => setStep(2)} /><Button title={commit.isPending ? 'Setting up…' : 'Open my brief'} variant="primary" disabled={commit.isPending} onPress={() => commit.mutate({ draft: d.draft, disabledPolicies: [...disabled, ...d.suggestedPolicies.filter((p) => !p.enabled).map((p) => p.id)], trustPreset: preset }, { onSuccess: () => router.replace(appRoutes.tonight) })} /></View></>}
    </Screen>
  );
}
