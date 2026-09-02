import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/common/Button';
import { Screen } from '@/components/common/Screen';
import { appRoutes } from '@/config/appRoutes';
import { useAuthContext } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeContext';

export default function AuthScreen() {
  const { theme } = useTheme();
  const { login, signUp } = useAuthContext();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const input = { borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, borderRadius: theme.radius.inner, padding: 12, fontSize: 16, color: theme.colors.ink, marginBottom: 10 };
  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'login') { await login(email.trim(), password); router.replace(appRoutes.tonight); }
      else { await signUp(name.trim(), email.trim(), password); router.replace(appRoutes.onboarding); }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.show({ type: 'error', text1: msg ?? (mode === 'login' ? 'That email and password did not match.' : 'Could not create the account.') });
    } finally { setBusy(false); }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen title={mode === 'login' ? 'Welcome back.' : "Let's run the house."} subtitle={mode === 'login' ? "Sign in to see tonight's brief." : 'One account per household. Your partner can share it.'}>
        {mode === 'signup' && <TextInput placeholder="Your first name" placeholderTextColor={theme.colors.muted} value={name} onChangeText={setName} style={input} />}
        <TextInput placeholder="Email" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={input} />
        <TextInput placeholder="Password" placeholderTextColor={theme.colors.muted} secureTextEntry value={password} onChangeText={setPassword} style={input} />
        <Button title={mode === 'login' ? 'Sign in' : 'Create account'} variant="primary" disabled={busy || !email || password.length < 8 || (mode === 'signup' && !name)} onPress={submit} />
        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: 16 }}>
          <Text style={{ textAlign: 'center', color: theme.colors.muted }}>{mode === 'login' ? 'New here? Create an account' : 'Already set up? Sign in'}</Text>
        </Pressable>
        <View style={{ height: 40 }} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
