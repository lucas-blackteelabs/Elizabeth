import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister, queryClient } from '@/config/queryClient';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/theme/ThemeContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
          <AuthProvider>
            <PaperProvider>
              <ThemeProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(protected)" />
                </Stack>
              </ThemeProvider>
            </PaperProvider>
          </AuthProvider>
        </PersistQueryClientProvider>
        <Toast />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
