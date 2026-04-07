import { Alert, StyleSheet, Text, View } from 'react-native'

import { ProviderProfileForm } from './ProviderProfileForm'

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <ProviderProfileForm onSubmit={() => Alert.alert('Saved')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16
  }
})
