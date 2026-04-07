import { Pressable, StyleSheet, Text, View } from 'react-native'

type ReviewDemoCardProps = {
  isInstalling?: boolean
  onInstall: () => void | Promise<void>
}

export function ReviewDemoCard({
  isInstalling = false,
  onInstall
}: ReviewDemoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>App Review Demo</Text>
      <Text style={styles.body}>
        Install a deterministic local provider profile, compare preset, and sample RAG document so
        iPhone, iPad, and Android review builds can be exercised without third-party API keys.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={isInstalling}
        onPress={() => void onInstall()}
        style={[styles.button, isInstalling ? styles.buttonDisabled : null]}
      >
        <Text style={styles.buttonLabel}>{isInstalling ? 'Installing Review Demo...' : 'Install Review Demo'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a'
  },
  body: {
    color: '#475569',
    lineHeight: 22
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827'
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8'
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '600'
  }
})
