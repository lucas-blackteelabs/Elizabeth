import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Gear, Play, Stop } from 'phosphor-react-native';
import { BriefCard } from '@/components/brief/BriefCard';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Screen, SectionTitle } from '@/components/common/Screen';
import { appRoutes } from '@/config/appRoutes';
import { useBrief, useBriefScript } from '@/hooks/useBrief';
import { useHousehold } from '@/hooks/useHousehold';
import { useTheme } from '@/theme/ThemeContext';

const greeting = (now: string) => { const h = new Date(now).getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function TonightScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: hh } = useHousehold();
  const { data: b } = useBrief();
  const [want, setWant] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { data: script } = useBriefScript(want);
  React.useEffect(() => {
    if (want && script && !speaking) { Speech.speak(script.script, { rate: 0.98, onDone: () => setSpeaking(false) }); setSpeaking(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, want]);
  if (!hh || !b) return <Screen />;
  const parent = hh.household.people.find((p) => p.role === 'PARENT')?.name;
  const nothing = b.compression.signals === 0;
  const toggle = () => { if (speaking) { Speech.stop(); setSpeaking(false); setWant(false); } else setWant(true); };
  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View><Text style={{ fontWeight: '700', fontSize: 17, color: theme.colors.ink }}>{hh.household.name}</Text>{hh.household.demo && <Text style={{ fontSize: 13, color: theme.colors.muted }}>demo family</Text>}</View>
        <Pressable onPress={() => router.push(appRoutes.settings)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.soft, alignItems: 'center', justifyContent: 'center' }}><Gear size={20} color={theme.colors.ink} /></Pressable>
      </View>
      <Text style={{ fontSize: 34, fontWeight: '700', lineHeight: 38, marginTop: 18, color: theme.colors.ink }}>{greeting(b.generatedAt)}{parent ? `, ${parent}` : ''}.</Text>
      <Text style={{ fontSize: 18, lineHeight: 26, color: theme.colors.muted, marginVertical: 10 }}>{nothing ? "Nothing has come in yet. Forward me a school email or paste a message and I'll take it from there." : b.headline}</Text>
      {nothing ? <Button title="Send me something" variant="primary" onPress={() => router.push(appRoutes.send)} /> : (
        <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, borderRadius: 999, paddingVertical: 10, paddingLeft: 10, paddingRight: 16 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }}>{speaking ? <Stop size={14} weight="fill" color={theme.colors.accentInk} /> : <Play size={14} weight="fill" color={theme.colors.accentInk} />}</View>
          <Text style={{ fontWeight: '600', color: theme.colors.ink }}>Listen to tonight&apos;s brief</Text>
        </Pressable>
      )}
      {want && script && <Card style={{ marginTop: 12, backgroundColor: theme.colors.soft, borderWidth: 0 }}><Text style={{ fontSize: 15, lineHeight: 22, color: theme.colors.ink }}>{script.script}</Text></Card>}
      {b.decide.length > 0 && <><SectionTitle count={b.decide.length}>Needs you</SectionTitle>{b.decide.map((it) => <BriefCard key={it.ledgerId} item={it} household={hh.household} />)}</>}
      {b.done.length > 0 && <><SectionTitle>Handled</SectionTitle><Card>{b.done.map((it) => <View key={it.ledgerId} style={{ paddingVertical: 8 }}><Text style={{ fontWeight: '600', color: theme.colors.ink }}>{it.title.replace(/^[^:]+:\s*/, '')}</Text><Text style={{ color: theme.colors.muted, fontSize: 15 }}>{it.narrative}</Text></View>)}</Card></>}
      {b.later.length > 0 && <><SectionTitle>Parked for later</SectionTitle>{b.later.map((it) => <BriefCard key={it.ledgerId} item={it} household={hh.household} />)}</>}
      {b.fyi.length > 0 && <><SectionTitle>Good to know</SectionTitle><Card>{b.fyi.map((it) => <View key={it.ledgerId} style={{ paddingVertical: 8 }}><Text style={{ fontWeight: '600', color: theme.colors.ink }}>{it.title}</Text><Text style={{ color: theme.colors.muted, fontSize: 15 }}>{it.summary}</Text></View>)}</Card></>}
    </Screen>
  );
}
