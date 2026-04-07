import { Alert, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'

import { ProviderProfileRepository } from '../../storage/db/repositories/ProviderProfileRepository'
import { ProviderProfileService } from '../../services/ProviderProfileService'
import { ProviderProfileForm } from './ProviderProfileForm'

const providerProfileService = new ProviderProfileService()
const providerProfileRepository = new ProviderProfileRepository()

export function SettingsScreen() {
  const [profiles, setProfiles] = useState<Array<{
    id: string
    displayName: string
    baseUrl: string
    presetType: string
  }>>([])

  const loadProfiles = async () => {
    setProfiles(await providerProfileRepository.listAll())
  }

  useEffect(() => {
    void loadProfiles()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <ProviderProfileForm
        onSubmit={async ({ presetType, displayName, baseUrl, apiKey }) => {
          await providerProfileService.save({
            id: `${presetType}-main`,
            presetType,
            displayName,
            baseUrl,
            apiKey
          })
          await loadProfiles()
          Alert.alert('Saved', `${displayName} is ready for chat, compare, and RAG.`)
        }}
      />
      <View style={styles.profileList}>
        {profiles.map((profile) => (
          <View key={profile.id} style={styles.profileCard}>
            <Text style={styles.profileTitle}>{profile.displayName}</Text>
            <Text style={styles.profileMeta}>{profile.presetType}</Text>
            <Text style={styles.profileMeta}>{profile.baseUrl}</Text>
          </View>
        ))}
      </View>
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
  },
  profileList: {
    marginTop: 24,
    gap: 12
  },
  profileCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    gap: 4
  },
  profileTitle: {
    fontWeight: '700',
    color: '#111827'
  },
  profileMeta: {
    color: '#4b5563'
  }
})
