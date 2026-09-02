import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native';
import { Button } from '@/components/common/Button';
import { Avatar, Card } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { useApproveClaim, useBoard, useClaimReward, useCompleteChore, useUndoChore } from '@/hooks/useChores';
import { useTheme } from '@/theme/ThemeContext';

export default function KidsScreen() {
  const { theme } = useTheme();
  const { data } = useBoard();
  const complete = useCompleteChore();
  const undo = useUndoChore();
  const claim = useClaimReward();
  const approve = useApproveClaim();
  if (!data) return <Screen />;
  return (
    <Screen title="Kids">
      {data.perChild.map((k, i) => {
        const c = theme.colors.kids[i % theme.colors.kids.length];
        const chores = data.board.chores.filter((ch) => ch.childId === k.childId && (k.due.includes(ch.id) || k.doneToday.includes(ch.id)));
        const claims = data.board.claims.filter((cl) => cl.childId === k.childId && !cl.approved);
        return (
          <Card key={k.childId}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Avatar name={k.name} index={i} /><Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.ink }}>{k.name}</Text><View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}><Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.ink }}>{k.balance}</Text><Text style={{ fontSize: 12, color: theme.colors.muted }}>points{k.streak >= 2 ? ` · ${k.streak}-day streak` : ''}</Text></View></View>
            <View style={{ height: 8, backgroundColor: theme.colors.soft, borderRadius: 999, marginTop: 14, marginBottom: 6, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, Math.round((k.week / 30) * 100))}%`, height: 8, backgroundColor: c, borderRadius: 999 }} /></View>
            <Text style={{ fontSize: 13, color: theme.colors.muted }}>{k.week} this week · 30 for a great week</Text>
            <View style={{ marginTop: 12 }}>
              {chores.map((ch) => { const done = k.doneToday.includes(ch.id); return (
                <View key={ch.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line }}>
                  <Pressable onPress={() => (done ? undo.mutate(ch.id) : complete.mutate(ch.id))} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: done ? c : theme.colors.line, backgroundColor: done ? c : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{done && <Check size={14} weight="bold" color="#fff" />}</Pressable>
                  <View style={{ flex: 1 }}><Text style={{ fontWeight: '500', color: done ? theme.colors.muted : theme.colors.ink, textDecorationLine: done ? 'line-through' : 'none' }}>{ch.title}</Text><Text style={{ fontSize: 12, color: theme.colors.muted }}>{ch.cadence === 'ONCE' ? `One-off${ch.source === 'agent' ? ' · I suggested this' : ''}` : ch.cadence === 'DAILY' ? 'Every day' : 'Once a week'}</Text></View>
                  <Text style={{ fontWeight: '700', color: c }}>+{ch.points}</Text>
                </View>); })}
              {!chores.length && <Text style={{ color: theme.colors.muted, fontSize: 14 }}>All done for today.</Text>}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: theme.colors.muted, marginTop: 18, marginBottom: 8 }}>Rewards</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{data.board.rewards.map((r) => <View key={r.id} style={{ width: '48%', backgroundColor: theme.colors.soft, borderRadius: theme.radius.inner, padding: 12, gap: 6 }}><Text style={{ fontWeight: '600', color: theme.colors.ink }}>{r.title}</Text><Text style={{ fontSize: 12, color: theme.colors.muted }}>{r.cost} points</Text><Button title={k.balance >= r.cost ? 'Claim' : `${r.cost - k.balance} to go`} variant={k.balance >= r.cost ? 'secondary' : 'ghost'} disabled={k.balance < r.cost} onPress={() => claim.mutate({ childId: k.childId, rewardId: r.id })} /></View>)}</View>
            {claims.map((cl) => <View key={cl.id} style={{ marginTop: 8, backgroundColor: theme.colors.needSoft, borderRadius: theme.radius.inner, padding: 12, gap: 8 }}><Text style={{ color: theme.colors.ink }}>{k.name} claimed {data.board.rewards.find((r) => r.id === cl.rewardId)?.title}. Parent to approve.</Text><Button title="Approve" onPress={() => approve.mutate(cl.id)} /></View>)}
          </Card>
        );
      })}
    </Screen>
  );
}
