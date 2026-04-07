import { StyleSheet, Text, View } from 'react-native'

export function MessageList({ messages }: { messages: string[] }) {
  return (
    <View style={styles.list}>
      {messages.map((message, index) => (
        <Text key={`${message}-${index}`} style={styles.message}>
          {message}
        </Text>
      ))}
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
