import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

type ProviderTarget = {
  providerProfileId: string
  providerLabel: string
  models: Array<{
    modelId: string
    label: string
  }>
}

type ComparePresetFormProps = {
  providerTargets: ProviderTarget[]
  onSubmit: (input: {
    name: string
    targetModels: Array<{
      providerProfileId: string
      modelId: string
    }>
    judgeProviderProfileId: string | null
    judgeModelId: string | null
    sharedContextEnabled: boolean
  }) => void
}

function createTargetKey(providerProfileId: string, modelId: string) {
  return `${providerProfileId}:${modelId}`
}

export function ComparePresetForm({ providerTargets, onSubmit }: ComparePresetFormProps) {
  const [name, setName] = useState('')
  const [sharedContextEnabled, setSharedContextEnabled] = useState(false)
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string | null>>({})
  const [judgeKey, setJudgeKey] = useState<string | null>(null)

  const activeTargets = useMemo(
    () =>
      providerTargets.flatMap((target) => {
        const selectedModelId = selectedTargets[target.providerProfileId]

        if (!selectedModelId) {
          return []
        }

        return [
          {
            providerProfileId: target.providerProfileId,
            providerLabel: target.providerLabel,
            modelId: selectedModelId,
            modelLabel:
              target.models.find((model) => model.modelId === selectedModelId)?.label ?? selectedModelId
          }
        ]
      }),
    [providerTargets, selectedTargets]
  )

  const canSubmit = name.trim().length > 0 && activeTargets.length >= 2

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Compare Preset</Text>
      <TextInput
        placeholder="Preset name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      {providerTargets.map((target) => (
        <View key={target.providerProfileId} style={styles.group}>
          <Text style={styles.groupTitle}>{target.providerLabel}</Text>
          <View style={styles.optionRow}>
            <Pressable
              onPress={() =>
                setSelectedTargets((current) => ({
                  ...current,
                  [target.providerProfileId]: null
                }))
              }
              style={[
                styles.optionButton,
                !selectedTargets[target.providerProfileId] ? styles.optionButtonSelected : null
              ]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  !selectedTargets[target.providerProfileId] ? styles.optionLabelSelected : null
                ]}
              >
                Off
              </Text>
            </Pressable>
            {target.models.map((model) => {
              const isSelected = selectedTargets[target.providerProfileId] === model.modelId

              return (
                <Pressable
                  key={model.modelId}
                  onPress={() =>
                    setSelectedTargets((current) => ({
                      ...current,
                      [target.providerProfileId]: model.modelId
                    }))
                  }
                  style={[styles.optionButton, isSelected ? styles.optionButtonSelected : null]}
                >
                  <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>
                    {model.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}
      <View style={styles.group}>
        <Text style={styles.groupTitle}>Judge</Text>
        <View style={styles.optionRow}>
          <Pressable
            onPress={() => setJudgeKey(null)}
            style={[styles.optionButton, judgeKey === null ? styles.optionButtonSelected : null]}
          >
            <Text style={[styles.optionLabel, judgeKey === null ? styles.optionLabelSelected : null]}>
              No Judge
            </Text>
          </Pressable>
          {activeTargets.map((target) => {
            const key = createTargetKey(target.providerProfileId, target.modelId)
            const isSelected = judgeKey === key

            return (
              <Pressable
                key={key}
                onPress={() => setJudgeKey(key)}
                style={[styles.optionButton, isSelected ? styles.optionButtonSelected : null]}
              >
                <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>
                  {`Judge: ${target.modelLabel}`}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
      <Pressable
        onPress={() => setSharedContextEnabled((current) => !current)}
        style={[styles.toggleButton, sharedContextEnabled ? styles.toggleButtonSelected : null]}
      >
        <Text style={[styles.toggleLabel, sharedContextEnabled ? styles.toggleLabelSelected : null]}>
          {sharedContextEnabled ? 'Shared Context: On' : 'Shared Context: Off'}
        </Text>
      </Pressable>
      <Pressable
        disabled={!canSubmit}
        onPress={() => {
          if (!canSubmit) {
            return
          }

          const [judgeProviderProfileId, judgeModelId] = judgeKey ? judgeKey.split(':') : [null, null]

          onSubmit({
            name: name.trim(),
            targetModels: activeTargets.map(({ providerProfileId, modelId }) => ({
              providerProfileId,
              modelId
            })),
            judgeProviderProfileId,
            judgeModelId,
            sharedContextEnabled
          })
        }}
        style={[styles.submitButton, !canSubmit ? styles.submitButtonDisabled : null]}
      >
        <Text style={styles.submitLabel}>Save Compare Preset</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    gap: 14
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff'
  },
  group: {
    gap: 8
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0'
  },
  optionButtonSelected: {
    backgroundColor: '#0f172a'
  },
  optionLabel: {
    fontWeight: '600',
    color: '#0f172a'
  },
  optionLabelSelected: {
    color: '#ffffff'
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#e2e8f0'
  },
  toggleButtonSelected: {
    backgroundColor: '#0f172a'
  },
  toggleLabel: {
    fontWeight: '600',
    color: '#0f172a'
  },
  toggleLabelSelected: {
    color: '#ffffff'
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a'
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8'
  },
  submitLabel: {
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center'
  }
})
