import { StyleSheet, Text, View } from 'react-native'

import { BackupRestoreCard } from './BackupRestoreCard'

type BackupRestoreScreenProps = {
  isCreatingBackup?: boolean
  isRestoringBackup?: boolean
  onCreateBackup: () => void | Promise<void>
  onRestoreBackup: (uri: string) => void | Promise<void>
}

export function BackupRestoreScreen({
  isCreatingBackup = false,
  isRestoringBackup = false,
  onCreateBackup,
  onRestoreBackup
}: BackupRestoreScreenProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Workspace Recovery</Text>
      <Text style={styles.sectionBody}>
        Keep a portable local snapshot for migrations, device transfers, and manual recovery after
        interrupted compare or indexing work.
      </Text>
      <BackupRestoreCard
        isCreatingBackup={isCreatingBackup}
        isRestoringBackup={isRestoringBackup}
        onCreateBackup={onCreateBackup}
        onRestoreBackup={onRestoreBackup}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 14
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  sectionBody: {
    color: '#4b5563',
    lineHeight: 22
  }
})
