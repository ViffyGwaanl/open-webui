import { Pressable, StyleSheet, Text, View } from 'react-native'

type BranchTabsProps = {
  branches: Array<{
    id: string
    modelId: string
    status: string
  }>
  selectedBranchId: string | null
  onSelect: (branchId: string) => void
}

export function BranchTabs({ branches, selectedBranchId, onSelect }: BranchTabsProps) {
  return (
    <View style={styles.row}>
      {branches.map((branch) => {
        const isSelected = branch.id === selectedBranchId

        return (
          <Pressable
            key={branch.id}
            onPress={() => onSelect(branch.id)}
            style={[styles.tab, isSelected ? styles.tabSelected : null]}
          >
            <Text style={[styles.label, isSelected ? styles.labelSelected : null]}>
              {branch.modelId}
            </Text>
            <Text style={styles.status}>{branch.status}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  tabSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827'
  },
  label: {
    fontWeight: '600',
    color: '#111827'
  },
  labelSelected: {
    color: '#ffffff'
  },
  status: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280'
  }
})
