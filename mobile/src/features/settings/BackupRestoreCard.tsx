import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

type BackupRestoreCardProps = {
  isCreatingBackup?: boolean
  isRestoringBackup?: boolean
  onCreateBackup: () => void | Promise<void>
  onRestoreBackup: (uri: string) => void | Promise<void>
}

export function BackupRestoreCard({
  isCreatingBackup = false,
  isRestoringBackup = false,
  onCreateBackup,
  onRestoreBackup
}: BackupRestoreCardProps) {
  const [restoreUri, setRestoreUri] = useState('')

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Backup And Restore</Text>
      <Text style={styles.body}>
        Export the local workspace into a JSON bundle, then restore provider profiles, threads,
        compare state, and indexed documents from a saved backup file.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={isCreatingBackup}
        onPress={() => void onCreateBackup()}
        style={[styles.button, isCreatingBackup ? styles.buttonDisabled : null]}
      >
        <Text style={styles.buttonLabel}>{isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}</Text>
      </Pressable>
      <TextInput
        autoCapitalize="none"
        onChangeText={setRestoreUri}
        placeholder="Backup file URI"
        style={styles.input}
        value={restoreUri}
      />
      <Pressable
        accessibilityRole="button"
        disabled={isRestoringBackup}
        onPress={() => void onRestoreBackup(restoreUri)}
        style={[styles.button, isRestoringBackup ? styles.buttonDisabled : null]}
      >
        <Text style={styles.buttonLabel}>{isRestoringBackup ? 'Restoring Backup...' : 'Restore Backup'}</Text>
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
    borderColor: '#d1d5db'
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10
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
