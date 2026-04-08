import TestRenderer from 'react-test-renderer'

import RootLayout from '../../../app/_layout'
import RootIndex from '../../../app/index'
import TabLayout from '../../../app/(tabs)/_layout'
import { AppProviders } from '../../ui/AppProviders'

jest.mock('expo-router', () => {
  const React = require('react')
  const { View } = require('react-native')

  const Stack = ({ children }: { children?: React.ReactNode }) => <View testID="stack">{children}</View>
  Stack.Screen = ({ name }: { name?: string }) => <View testID={`stack-screen-${name ?? 'root'}`} />

  const Tabs = ({ children }: { children?: React.ReactNode }) => <View testID="tabs">{children}</View>
  Tabs.Screen = ({
    name,
    options
  }: {
    name: string
    options?: { title?: string }
  }) => <View testID={`tab-screen-${name}`} accessibilityLabel={options?.title} />

  const Redirect = ({ href }: { href: string }) => <View testID="redirect" accessibilityLabel={href} />

  return { Redirect, Stack, Tabs }
})

jest.mock('react-native-safe-area-context', () => {
  const React = require('react')

  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => children
  }
})

describe('native shell layouts', () => {
  it('wraps the root stack with AppProviders', () => {
    let renderer: TestRenderer.ReactTestRenderer

    TestRenderer.act(() => {
      renderer = TestRenderer.create(<RootLayout />)
    })

    expect(renderer!.root.findByType(AppProviders)).toBeTruthy()
    expect(renderer!.root.findByProps({ testID: 'stack' })).toBeTruthy()
  })

  it('renders the three workspace tabs from the workspace contract', () => {
    let renderer: TestRenderer.ReactTestRenderer

    TestRenderer.act(() => {
      renderer = TestRenderer.create(<TabLayout />)
    })

    expect(
      renderer!.root.findByProps({
        testID: 'tab-screen-threads/index',
        accessibilityLabel: 'Threads'
      })
    ).toBeTruthy()
    expect(
      renderer!.root.findByProps({
        testID: 'tab-screen-library/index',
        accessibilityLabel: 'Library'
      })
    ).toBeTruthy()
    expect(
      renderer!.root.findByProps({
        testID: 'tab-screen-settings/index',
        accessibilityLabel: 'Settings'
      })
    ).toBeTruthy()
  })

  it('redirects the root route into the threads workspace', () => {
    let renderer: TestRenderer.ReactTestRenderer

    TestRenderer.act(() => {
      renderer = TestRenderer.create(<RootIndex />)
    })

    expect(
      renderer!.root.findByProps({
        testID: 'redirect',
        accessibilityLabel: '/(tabs)/threads'
      })
    ).toBeTruthy()
  })
})
