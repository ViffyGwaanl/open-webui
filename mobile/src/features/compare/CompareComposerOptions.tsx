import { StyleSheet, Text, View } from 'react-native'

export function CompareComposerOptions() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Compare Mode</Text>
      <Text style={styles.body}>Run multiple model answers side by side and inspect each branch.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    gap: 4
  },
  title: {
    fontWeight: '600',
    color: '#312e81'
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4338ca'
  }
})
