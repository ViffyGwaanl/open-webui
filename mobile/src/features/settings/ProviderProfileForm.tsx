import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

type ProviderProfileFormProps = {
  onSubmit: (value: { displayName: string; baseUrl: string; apiKey: string }) => void
}

export function ProviderProfileForm({ onSubmit }: ProviderProfileFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  return (
    <View style={styles.form}>
      <TextInput
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />
      <TextInput
        placeholder="Base URL"
        value={baseUrl}
        onChangeText={setBaseUrl}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="API key"
        value={apiKey}
        onChangeText={setApiKey}
        style={styles.input}
        autoCapitalize="none"
      />
      <Pressable
        onPress={() => onSubmit({ displayName, baseUrl, apiKey })}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>Save provider</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
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
