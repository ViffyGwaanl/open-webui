import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { ParsedComparePreset } from '../../services/ComparePresetService'

type ComparePresetPickerProps = {
  presets: ParsedComparePreset[]
  activePresetId: string | null
  onSelect: (presetId: string) => void
}

export function ComparePresetPicker({
  presets,
  activePresetId,
  onSelect
}: ComparePresetPickerProps) {
  return (
    <View style={styles.list}>
      {presets.map((preset) => {
        const isActive = preset.id === activePresetId

        return (
          <Pressable
            key={preset.id}
            onPress={() => onSelect(preset.id)}
            style={[styles.card, isActive ? styles.cardActive : null]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{preset.name}</Text>
              {isActive ? <Text style={styles.badge}>Active</Text> : null}
            </View>
            <Text style={styles.meta}>{`${preset.targetModels.length} models`}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10
  },
  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  cardActive: {
    borderColor: '#0f172a'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  title: {
    fontWeight: '700',
    color: '#0f172a'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    overflow: 'hidden'
  },
  meta: {
    color: '#475569'
  }
})
