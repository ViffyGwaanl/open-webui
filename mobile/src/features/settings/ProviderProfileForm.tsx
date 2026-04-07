import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import type { ProviderPreset } from '../../core/providers/types'

type ProviderProfileFormProps = {
  onSubmit: (value: {
    presetType: ProviderPreset
    displayName: string
    baseUrl: string
    apiKey: string
  }) => void | Promise<void>
}

const PROVIDER_PRESETS: Array<{
  type: ProviderPreset
  label: string
  defaultBaseUrl: string
}> = [
  { type: 'openai', label: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1' },
  {
    type: 'gemini',
    label: 'Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  },
  { type: 'claude', label: 'Claude', defaultBaseUrl: 'https://api.anthropic.com/v1' }
]

export function ProviderProfileForm({ onSubmit }: ProviderProfileFormProps) {
  const [presetType, setPresetType] = useState<ProviderPreset>('openai')
  const [displayName, setDisplayName] = useState('OpenAI Main')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [apiKey, setApiKey] = useState('')

  const handlePresetChange = (nextPreset: ProviderPreset) => {
    const preset = PROVIDER_PRESETS.find((entry) => entry.type === nextPreset)

    setPresetType(nextPreset)
    setDisplayName(`${preset?.label ?? nextPreset} Main`)
    setBaseUrl(preset?.defaultBaseUrl ?? '')
  }

  return (
    <View style={styles.form}>
      <View style={styles.presetRow}>
        {PROVIDER_PRESETS.map((preset) => (
          <Pressable
            key={preset.type}
            onPress={() => handlePresetChange(preset.type)}
            style={[styles.presetButton, preset.type === presetType ? styles.presetButtonSelected : null]}
          >
            <Text
              style={[styles.presetLabel, preset.type === presetType ? styles.presetLabelSelected : null]}
            >
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
        onPress={() => onSubmit({ presetType, displayName, baseUrl, apiKey })}
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
  presetRow: {
    flexDirection: 'row',
    gap: 8
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  presetButtonSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827'
  },
  presetLabel: {
    color: '#111827',
    fontWeight: '600'
  },
  presetLabelSelected: {
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
