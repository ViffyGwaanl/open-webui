import { Pressable, StyleSheet, Text } from 'react-native'

export function DocumentImportButton({ onPress }: { onPress: () => void | Promise<void> }) {
  return (
    <Pressable onPress={() => void onPress()} style={styles.button}>
      <Text style={styles.label}>Import Document</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827'
  },
  label: {
    color: '#ffffff',
    fontWeight: '600'
  }
})
