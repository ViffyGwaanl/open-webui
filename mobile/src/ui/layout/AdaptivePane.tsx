import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import type { WorkspaceLayout } from './useWorkspaceLayout'

type AdaptivePaneProps = {
  layout: WorkspaceLayout
  primary: ReactNode
  secondary?: ReactNode
}

export function AdaptivePane({ layout, primary, secondary }: AdaptivePaneProps) {
  if (layout === 'tablet') {
    return (
      <View style={styles.row}>
        <View style={styles.primary}>{primary}</View>
        <View style={styles.secondary}>{secondary}</View>
      </View>
    )
  }

  return <View style={styles.column}>{primary}</View>
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 16
  },
  column: {
    flex: 1
  },
  primary: {
    flex: 1.5
  },
  secondary: {
    flex: 1
  }
})
