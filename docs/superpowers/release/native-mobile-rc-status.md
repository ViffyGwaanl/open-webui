# Native Mobile RC Status

## Build Candidate

- date: 2026-04-08
- branch: `feature/native-platform-core`
- workspace strategy: commit Expo source and patches, do not commit generated `mobile/ios` or `mobile/android` folders

## Verified In This Candidate

- `mobile/`: `npx -p node@22 -p npm@10 npm run typecheck` passed
- `mobile/`: `npx -p node@22 -p npm@10 npm test -- --runInBand` passed with `52/52` suites and `86/86` tests
- iOS simulator release build passed with `npx expo run:ios --configuration Release -d "iPhone 17e"` before the final explicit `react-native-worklets` dependency pin
- iOS install verification passed:
  - `xcrun simctl listapps "iPhone 17e"` shows `com.openwebui.mobile`
  - `xcrun simctl launch "iPhone 17e" com.openwebui.mobile` returned a live process id
- Android release build passed with:
  - `ANDROID_HOME=$HOME/Library/Android/sdk`
  - `ANDROID_SDK_ROOT=$HOME/Library/Android/sdk`
  - `npx expo run:android --variant release`
- Android release build verification was captured before the final explicit `react-native-worklets` dependency pin
- Android install verification passed:
  - `adb shell pm path com.openwebui.mobile` returned the installed `base.apk`
  - release artifact copied to `/tmp/openwebui-native-feature-native-platform-core-20260408.apk`
- Android manual runtime verification already confirmed before this final build round:
  - launch bootstrap no longer hangs
  - tabs render correctly
  - `Settings` opens
  - `Install Review Demo` succeeds
  - `Threads` shows `Open starter thread`
  - thread detail shows `Single`, `Compare`, `RAG`, and `Send`

## Engineering Hygiene

- `.expo/` is now ignored by Git
- `react-native-worklets` is now an explicit dependency instead of only an implicit lockfile artifact
- `patch-package` reapplies the `react-native-reanimated` CMake fix on install
- after the explicit dependency pin, `typecheck`, full Jest, and `expo-doctor` were rerun successfully

## Known Blockers

- Maestro is still blocked by Android driver infrastructure on this machine.
  - repeated failure shape: `io.grpc.StatusRuntimeException: DEADLINE_EXCEEDED`
  - failing runs never reach the first YAML step and stall in `deviceInfo`
  - debug directories:
    - `/Users/gwaanl/.maestro/tests/2026-04-08_113924`
    - `/Users/gwaanl/.maestro/tests/2026-04-08_115424`
    - `/Users/gwaanl/.maestro/tests/2026-04-08_115743`
- The current `Medium_Phone_API_36` Android emulator became system-unstable after reinstall/relaunch during final release verification.
  - observed state: system ANR windows while `mFocusedApp` still points at `com.openwebui.mobile/.MainActivity`
  - this makes fresh post-build Android UI assertions unreliable on this emulator
- Physical-device QA was not executed in this candidate.

## Release Readiness Readout

- Product scope: implemented for standalone local-first native mobile
- Core regression coverage: strong at unit/integration layer
- iOS native build: verified
- Android native build: verified
- final post-pin native rebuild: not rerun after the dependency-only `react-native-worklets` manifest update
- Android post-build runtime QA: environment-contaminated, not a clean sign-off
- Maestro automation: environment-blocked
- Real-device sign-off: pending

## Recommended Next Release Actions

1. Run final smoke QA on a clean Android emulator or physical Android phone.
2. Run iPhone and iPad smoke QA on physical devices or a reset simulator state.
3. Re-attempt Maestro after resetting or recreating the Android emulator image.
4. Capture store screenshots only after the clean-device QA pass.
