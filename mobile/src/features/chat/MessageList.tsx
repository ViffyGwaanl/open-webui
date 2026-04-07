import { StyleSheet, Text, View } from 'react-native'

import type { ThreadTimelineItem } from '../../services/ThreadService'
import { CompareRunCard } from '../compare/CompareRunCard'

export function MessageList({ items }: { items: ThreadTimelineItem[] }) {
  return (
    <View style={styles.list}>
      {items.map((item) =>
        item.kind === 'compare_run' ? (
          <CompareRunCard key={item.id} run={item} />
        ) : (
          <Text key={item.id} style={styles.message}>
            {item.text}
          </Text>
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    gap: 8
  },
  message: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6'
  }
})
