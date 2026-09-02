import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';

export const Screen = ({ children, title, subtitle }: { children?: React.ReactNode; title?: string; subtitle?: string }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.ground }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 18, paddingBottom: 120 }}>
      {title ? <Text style={[styles.title, { color: theme.colors.ink }]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text> : null}
      <View>{children}</View>
    </ScrollView>
  );
};

export const SectionTitle = ({ children, count }: { children: string; count?: number }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 10 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.muted }}>{children}</Text>
      {count ? <View style={{ marginLeft: 6, backgroundColor: theme.colors.needSoft, borderRadius: 999, paddingHorizontal: 6, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 12, color: theme.colors.need }}>{count}</Text></View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 34, fontWeight: '700', lineHeight: 38 },
  subtitle: { fontSize: 18, lineHeight: 26, marginTop: 10, marginBottom: 16 },
});
