import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { CompareComposerOptions } from '../compare/CompareComposerOptions'

type ComposerMode = 'single' | 'compare'

type MessageComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => Promise<void> | void
  mode?: ComposerMode
  onModeChange?: (mode: ComposerMode) => void
  canCompare?: boolean
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  mode = 'single',
  onModeChange,
  canCompare = false
}: MessageComposerProps) {
  return (
    <View style={styles.container}>
      {onModeChange ? (
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => onModeChange('single')}
            style={[styles.modeButton, mode === 'single' ? styles.modeButtonSelected : null]}
          >
            <Text style={[styles.modeLabel, mode === 'single' ? styles.modeLabelSelected : null]}>
              Single
            </Text>
          </Pressable>
          {canCompare ? (
            <Pressable
              onPress={() => onModeChange('compare')}
              style={[styles.modeButton, mode === 'compare' ? styles.modeButtonSelected : null]}
            >
              <Text style={[styles.modeLabel, mode === 'compare' ? styles.modeLabelSelected : null]}>
                Compare
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {mode === 'compare' ? <CompareComposerOptions /> : null}
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
  modeRow: {
    flexDirection: 'row',
    gap: 8
  },
  modeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  modeButtonSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827'
  },
  modeLabel: {
    fontWeight: '600',
    color: '#111827'
  },
  modeLabelSelected: {
    color: '#ffffff'
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
