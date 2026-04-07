import { Tabs } from 'expo-router'

import { WORKSPACE_TABS } from '../../src/app/workspaceTabs'

export default function WorkspaceTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {WORKSPACE_TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  )
}
