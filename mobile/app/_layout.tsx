import { Stack } from 'expo-router'

import { AppProviders } from '../src/ui/AppProviders'

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  )
}
