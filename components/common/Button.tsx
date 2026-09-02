import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export const Button = ({ title, onPress, variant = 'secondary', disabled, grow }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; grow?: boolean }) => {
  const { theme } = useTheme();
  const bg = variant === 'primary' ? theme.colors.accent : variant === 'secondary' ? theme.colors.surface : 'transparent';
  const fg = variant === 'primary' ? theme.colors.accentInk : variant === 'ghost' ? theme.colors.muted : theme.colors.ink;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => ({ backgroundColor: bg, borderColor: variant === 'secondary' ? theme.colors.line : bg, borderWidth: 1, borderRadius: 999, paddingVertical: variant === 'primary' ? 14 : 11, paddingHorizontal: 18, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, flex: grow ? 1 : undefined, alignItems: 'center' })}>
      <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
};
