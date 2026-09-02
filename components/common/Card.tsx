import React from 'react';
import { Text, View, ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export const Card = ({ style, ...props }: ViewProps) => {
  const { theme } = useTheme();
  return <View style={[{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.line }, style]} {...props} />;
};

export const Avatar = ({ name, index, size = 34 }: { name: string; index: number; size?: number }) => {
  const { theme } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.kids[Math.max(0, index) % theme.colors.kids.length], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.42 }}>{name.charAt(0)}</Text>
    </View>
  );
};
