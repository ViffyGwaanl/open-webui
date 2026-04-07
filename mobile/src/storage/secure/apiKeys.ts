import * as SecureStore from 'expo-secure-store'

export class ApiKeyStore {
  async setApiKey(ref: string, apiKey: string) {
    await SecureStore.setItemAsync(ref, apiKey)
  }

  async getApiKey(ref: string) {
    return SecureStore.getItemAsync(ref)
  }
}
