import { StyleSheet, Text, View } from 'react-native'

export function IndexJobBadge({ status }: { status: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{status}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb'
  },
  label: {
    color: '#111827',
    fontWeight: '600',
    textTransform: 'capitalize'
  }
})
