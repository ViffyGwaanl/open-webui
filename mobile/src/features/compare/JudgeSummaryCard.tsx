import { StyleSheet, Text, View } from 'react-native'

export function JudgeSummaryCard({ summary }: { summary: string | null }) {
  if (!summary) {
    return null
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Judge Summary</Text>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ecfccb',
    gap: 6
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#3f6212',
    textTransform: 'uppercase'
  },
  summary: {
    fontSize: 14,
    lineHeight: 22,
    color: '#365314'
  }
})
