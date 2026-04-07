import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

type AppProvidersProps = {
  children: ReactNode
}

let bootstrapPromise: Promise<void> | null = null

async function ensureBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = Promise.all([
      import('../storage/db/migrate').then(({ runMigrations }) => runMigrations()),
      import('../storage/index-db/migrate').then(({ runIndexMigrations }) => runIndexMigrations())
    ]).then(() => undefined)
  }

  return bootstrapPromise
}

export function AppProviders({ children }: AppProvidersProps) {
  const [bootstrapped, setBootstrapped] = useState(process.env.NODE_ENV === 'test')

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    void ensureBootstrapped().then(() => {
      setBootstrapped(true)
    })
  }, [])

  return (
    <SafeAreaProvider>
      {bootstrapped ? children : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="#111827" />
        </View>
      )}
    </SafeAreaProvider>
  )
}
