import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export function ThreadListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Threads</Text>
      <Pressable onPress={() => router.push('/threads/thread-1')} style={styles.button}>
        <Text style={styles.buttonLabel}>Open starter thread</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827'
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '600'
  }
})
