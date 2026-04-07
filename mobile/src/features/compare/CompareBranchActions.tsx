import { Pressable, StyleSheet, Text, View } from 'react-native'

type CompareBranchActionsProps = {
  onContinue?: () => void
  onCopy?: () => void
  onExport?: () => void
}

function ActionButton({
  label,
  onPress
}: {
  label: string
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={[styles.button, !onPress ? styles.buttonDisabled : null]}
    >
      <Text style={[styles.buttonLabel, !onPress ? styles.buttonLabelDisabled : null]}>{label}</Text>
    </Pressable>
  )
}

export function CompareBranchActions({
  onContinue,
  onCopy,
  onExport
}: CompareBranchActionsProps) {
  return (
    <View style={styles.row}>
      <ActionButton label="Continue" onPress={onContinue} />
      <ActionButton label="Copy" onPress={onCopy} />
      <ActionButton label="Export" onPress={onExport} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb'
  },
  buttonDisabled: {
    backgroundColor: '#f3f4f6'
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827'
  },
  buttonLabelDisabled: {
    color: '#9ca3af'
  }
})
