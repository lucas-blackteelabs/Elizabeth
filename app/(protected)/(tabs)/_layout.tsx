import { Tabs } from 'expo-router';
import { CalendarBlank, MoonStars, PaperPlaneTilt, Star } from 'phosphor-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useBrief } from '@/hooks/useBrief';

export default function TabLayout() {
  const { theme } = useTheme();
  const { data: brief } = useBrief();
  const icon = (Icon: typeof MoonStars) => ({ color, focused }: { color: string; focused: boolean }) => <Icon color={color} size={24} weight={focused ? 'fill' : 'regular'} />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.ink, tabBarInactiveTintColor: theme.colors.muted, tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.line }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
      <Tabs.Screen name="tonight/index" options={{ title: 'Tonight', tabBarIcon: icon(MoonStars), tabBarBadge: brief?.decide.length || undefined, tabBarBadgeStyle: { backgroundColor: theme.colors.need } }} />
      <Tabs.Screen name="week/index" options={{ title: 'Week', tabBarIcon: icon(CalendarBlank) }} />
      <Tabs.Screen name="kids/index" options={{ title: 'Kids', tabBarIcon: icon(Star) }} />
      <Tabs.Screen name="send/index" options={{ title: 'Send', tabBarIcon: icon(PaperPlaneTilt) }} />
    </Tabs>
  );
}
