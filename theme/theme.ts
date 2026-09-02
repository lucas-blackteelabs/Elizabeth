export const lightTheme = {
  colors: {
    ground: '#F4F6F8', surface: '#FFFFFF', soft: '#EDF1F5', ink: '#172033', muted: '#66738A', line: '#E2E7ED',
    accent: '#1E2F55', accentInk: '#FFFFFF', need: '#D9971F', needSoft: '#FFF4DB', done: '#2E9E6B', doneSoft: '#E2F5EA', later: '#5B6B9E', laterSoft: '#E9ECF7', danger: '#C64A3A',
    kids: ['#6E56CF', '#1C9AA3', '#E8735A', '#3B8FE0', '#D9518E', '#5C9E31'],
  },
  radius: { card: 22, inner: 14 },
  fonts: { display: 'BricolageGrotesque_700Bold', body: 'Figtree_400Regular', bodyMedium: 'Figtree_500Medium', bodySemi: 'Figtree_600SemiBold' },
};
export const darkTheme: ThemeType = {
  ...lightTheme,
  colors: { ...lightTheme.colors, ground: '#0F1419', surface: '#1A2028', soft: '#232B35', ink: '#EEF2F6', muted: '#98A4B5', line: '#2A333F', accent: '#E8EEF8', accentInk: '#14202F', need: '#F0B64A', needSoft: '#3A2D12', done: '#5FCB93', doneSoft: '#143324', later: '#9FAEE6', laterSoft: '#1F2538', danger: '#F08A7B' },
};
export type ThemeType = typeof lightTheme;
