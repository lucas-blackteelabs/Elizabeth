import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { BriefCard } from '@/components/brief/BriefCard';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Screen, SectionTitle } from '@/components/common/Screen';
import { useBrief } from '@/hooks/useBrief';
import { useHousehold } from '@/hooks/useHousehold';
import { useAddIcs, useIngest, useSamples } from '@/hooks/useInbox';
import { useTheme } from '@/theme/ThemeContext';
import { Channel, IngestResult } from '@/types';

const CHANNELS: Channel[] = ['EMAIL', 'WHATSAPP', 'SMS', 'PORTAL', 'VOICE'];
const label = (c: Channel) => (c === 'SMS' ? 'SMS' : c === 'WHATSAPP' ? 'WhatsApp' : c.charAt(0) + c.slice(1).toLowerCase());

export default function SendScreen() {
  const { theme } = useTheme();
  const { data: hh } = useHousehold();
  const { data: brief } = useBrief();
  const { data: samples = [] } = useSamples();
  const ingest = useIngest();
  const addIcs = useAddIcs();
  const [channel, setChannel] = useState<Channel>('EMAIL');
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ics, setIcs] = useState('');
  const [result, setResult] = useState<IngestResult | null>(null);
  const input = { borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, borderRadius: theme.radius.inner, padding: 12, fontSize: 15, color: theme.colors.ink, marginBottom: 10 };
  if (!hh) return <Screen />;
  const item = result ? [...(brief?.decide ?? []), ...(brief?.done ?? []), ...(brief?.later ?? []), ...(brief?.fyi ?? [])].find((i) => i.ledgerId === result.entry.id) : null;
  return (
    <Screen title="Send me anything." subtitle="A school email, a coach's message, a clinic text. I'll work out who it's for, put it where it belongs, and tell you if I need you.">
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>{CHANNELS.map((c) => <Pressable key={c} onPress={() => setChannel(c)} style={{ borderRadius: 999, borderWidth: 1, borderColor: c === channel ? theme.colors.accent : theme.colors.line, backgroundColor: c === channel ? theme.colors.accent : theme.colors.surface, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontSize: 14, color: c === channel ? theme.colors.accentInk : theme.colors.ink }}>{label(c)}</Text></Pressable>)}</View>
        <TextInput placeholder="From: the school, Coach Sam, the clinic…" placeholderTextColor={theme.colors.muted} value={from} onChangeText={setFrom} style={input} />
        <TextInput placeholder="Subject (if it's an email)" placeholderTextColor={theme.colors.muted} value={subject} onChangeText={setSubject} style={input} />
        <TextInput placeholder="Paste the message here…" placeholderTextColor={theme.colors.muted} value={body} onChangeText={setBody} multiline style={[input, { minHeight: 140, textAlignVertical: 'top' }]} />
        <Button title={ingest.isPending ? (hh.aiReady ? 'Reading it with Gemini…' : 'Reading it…') : 'Take care of it'} variant="primary" disabled={ingest.isPending || !body.trim()} onPress={() => ingest.mutate({ channel, from: from || 'unknown', subject: subject || undefined, body }, { onSuccess: (r) => { setResult(r); setBody(''); setSubject(''); setFrom(''); }, onError: () => Toast.show({ type: 'error', text1: 'I could not read that.' }) })} />
        {hh.household.demo && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{samples.map((s, i) => <Pressable key={i} onPress={() => { setChannel(s.channel); setFrom(s.from); setSubject(s.subject ?? ''); setBody(s.body); }} style={{ borderRadius: 999, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 12, paddingVertical: 7 }}><Text style={{ fontSize: 13, color: theme.colors.ink }}>{(s.subject ?? s.from).replace(/\s[–-].*$/, '').slice(0, 26)}</Text></Pressable>)}</View>}
      </Card>
      {item && <><SectionTitle>Here&apos;s what I did</SectionTitle><BriefCard item={item} household={hh.household} /></>}
      <SectionTitle>Where I read from</SectionTitle>
      <Card>
        <Text style={{ fontWeight: '600', color: theme.colors.ink }}>School, club and shared calendars</Text>
        <Text style={{ fontSize: 13, color: hh.household.icsFeeds.length ? theme.colors.done : theme.colors.muted, marginBottom: 10 }}>{hh.household.icsFeeds.length ? hh.household.icsFeeds.map((f) => `${f.label} · ${f.events} events`).join(' · ') : 'Paste any calendar link (Compass, Sentral, TeamApp, PlayHQ, Google, Outlook)'}</Text>
        <TextInput placeholder="https://… or webcal://… calendar link" placeholderTextColor={theme.colors.muted} autoCapitalize="none" value={ics} onChangeText={setIcs} style={input} />
        <Button title="Add calendar" disabled={!ics.trim() || addIcs.isPending} onPress={() => addIcs.mutate({ url: ics.trim() }, { onSuccess: (r) => { setIcs(''); Toast.show({ type: 'success', text1: `Added ${r.added} events.` }); }, onError: () => Toast.show({ type: 'error', text1: 'That calendar link did not work.' }) })} />
        <Text style={{ marginTop: 14, fontWeight: '600', color: theme.colors.ink }}>WhatsApp, SMS, screenshots</Text>
        <Text style={{ fontSize: 13, color: theme.colors.muted }}>Share them to Family OS from the share sheet, or paste above.</Text>
      </Card>
    </Screen>
  );
}
