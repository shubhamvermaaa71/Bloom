# Bloom implementation status — Expo Go simplified build

This source update removes SQLCipher configuration, SecureStore-based journal key management, and application-level journal encryption. Journal entries now use ordinary SQLite text fields. The app uses standard `expo-sqlite` without the SQLCipher config plugin, so it does not require a custom native development client for database access in Expo Go.

The existing screens, local repositories, onboarding, flower branding, themes, garden, quotes, habit tracking, skincare, mood tracking, and progress have been retained. Notification and reminder workflows have been removed; the versioned upgrade only cancels any reminders scheduled by older versions.

**Verified:** TypeScript compilation, Jest (2 suites, 5 tests), Expo SDK dependency compatibility, and Android bundle export. Physical-device startup, screen-by-screen visual inspection, SQLite persistence on-device, and multi-loop water-animation inspection have not been verified in this environment.

Storage is local but not encrypted by this app. Do not store highly sensitive information in the journal.


## Expo Go dependency configuration
- `expo` targets SDK 58; `react` and `react-dom` are pinned to `19.3.0`.
- `react-native` is pinned to `0.88.1`.
- Added `.npmrc` with `legacy-peer-deps=true` to avoid ERESOLVE failures from transitive peer declarations in the dependency graph.
