import React from 'react';
import { Text, View } from 'react-native';
import { Avatar, Card } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { useBrief } from '@/hooks/useBrief';
import { useEvents, useReminders } from '@/hooks/useCalendar';
import { useHousehold } from '@/hooks/useHousehold';
import { useTheme } from '@/theme/ThemeContext';

const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmtTime = (s: string) => { const d = new Date(s); const h = d.getHours(), m = d.getMinutes(); return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h >= 12 ? 'pm' : 'am'}`; };

export default function WeekScreen() {
  const { theme } = useTheme();
  const { data: hh } = useHousehold();
  const { data: brief } = useBrief();
  const { data: events = [] } = useEvents();
  const { data: reminders = [] } = useReminders();
  if (!hh || !brief) return <Screen />;
  const h = hh.household;
  const kids = h.people.filter((p) => p.role === 'CHILD');
  const name = (id: string) => h.people.find((p) => p.id === id)?.name ?? id;
  const today = brief.generatedAt.slice(0, 10);
  const rows = [...events.map((e) => ({ at: e.start, e })), ...reminders.filter((r) => r.at.slice(0, 10) >= today).map((r) => ({ at: r.at, r }))].sort((a, b) => a.at.localeCompare(b.at));
  const days = [...new Set(rows.map((r) => r.at.slice(0, 10)))].sort();
  const label = (day: string) => { const diff = Math.round((new Date(day).getTime() - new Date(today).getTime()) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : LONG[new Date(day).getDay()]; };
  return (
    <Screen title="Next two weeks">
      {days.length === 0 && <Text style={{ color: theme.colors.muted }}>Nothing on. Connect a calendar or send me something.</Text>}
      {days.map((day) => (
        <View key={day}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginTop: 18, marginBottom: 8, color: theme.colors.ink }}>{label(day)} <Text style={{ color: theme.colors.muted, fontWeight: '500', fontSize: 14 }}>{day.slice(5)}</Text></Text>
          <Card>
            {rows.filter((r) => r.at.slice(0, 10) === day).map((x, i) => 'r' in x && x.r ? (
              <View key={x.r.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: theme.colors.line }}><Text style={{ width: 70, fontWeight: '600', color: theme.colors.later }}>{fmtTime(x.r.at)}</Text><Text style={{ flex: 1, color: theme.colors.later }}>{x.r.text}</Text></View>
            ) : 'e' in x && x.e ? (
              <View key={x.e.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: theme.colors.line }}>
                <Text style={{ width: 70, fontWeight: '600', color: theme.colors.muted, fontSize: 14 }}>{x.e.end.slice(11) === '23:59' ? 'All day' : fmtTime(x.e.start)}</Text>
                <View style={{ flex: 1 }}><Text style={{ fontWeight: '600', color: theme.colors.ink }}>{x.e.title}</Text><Text style={{ fontSize: 13, color: theme.colors.muted }}>{[h.places.find((p) => p.id === x.e.placeId)?.name ?? x.e.locationText, x.e.driverId ? `${name(x.e.driverId)} drives` : null].filter(Boolean).join(' · ')}</Text></View>
                <View style={{ flexDirection: 'row' }}>{x.e.personIds.map((p) => <View key={p} style={{ marginLeft: -6 }}><Avatar name={name(p)} index={kids.findIndex((k) => k.id === p)} size={24} /></View>)}</View>
              </View>
            ) : null)}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
