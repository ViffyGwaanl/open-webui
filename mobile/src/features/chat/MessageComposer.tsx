import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

type MessageComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => Promise<void> | void
}

export function MessageComposer({ value, onChange, onSend }: MessageComposerProps) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Ask anything"
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
      <Pressable onPress={() => void onSend()} style={styles.button}>
        <Text style={styles.buttonLabel}>Send</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12
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
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '600'
  }
})
