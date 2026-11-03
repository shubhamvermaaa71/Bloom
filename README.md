# Bloom — Personal Wellness Tracker

A local-first wellness tracker built with Expo SDK 58, React Native 0.88, TypeScript, Expo Router and standard Expo SQLite. The project is configured for Expo Go; it does not require SQLCipher, a custom development client, login, or a cloud backend.

## Implemented workflows
- No login, registration, account, or cloud backend.
- First-launch name setup, short tutorial, tutorial replay.
- Five primary tabs: Home, Habits, Journal, Progress, Settings.
- Daily quote selected by local calendar date and stable during that date.
- Home shows a maximum of three habits, incomplete first, then completed; full habit list remains in Habits.
- Habit create/edit/delete and daily completion records.
- Water logging, custom amount, optional user-defined goal, undo, daily total and history service.
- Morning/night skincare checklists, completion state and guided step-by-step mode.
- Journal create/edit/delete. Entries are stored as ordinary local SQLite text.
- Mood check-in, editing today's selection and recent history.
- Bloom Garden growth points, five stages and persisted achievement unlocks.
- Four persistent themes: Soft Bloom, Lavender, Sage, Dark.
- Weekly habit progress based on saved daily records.
- No notification or reminder features or permissions.
- Database upgrades cancel any legacy scheduled reminders once.
- SQLite schema versioning/migrations, repository separation and EAS build profiles.

## Storage and privacy
Bloom has no account or cloud backend. App data is stored locally in a standard SQLite database on the device. SQLCipher and application-level journal encryption have been removed to keep the project simple and compatible with Expo Go. Local SQLite storage is **not encrypted by this app**; do not store highly sensitive information in the journal. Device-level security and backups are controlled by Android.

## Expo Go setup
Use Node.js LTS and npm. From this project directory:

If you previously tried installing dependencies and got an `ERESOLVE` peer-dependency error, first remove the old install and lockfile:

**PowerShell (Windows):**
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npx expo start -c
```

The project pins React and React DOM to the Expo SDK 58-compatible `19.3.0` release. The included `.npmrc` enables legacy peer resolution for transitive UI packages with overly restrictive peer declarations. Do not run `npx expo install --fix` unless Expo reports a specific SDK package mismatch.

Open Expo Go on your Android phone and scan the QR code. Ensure Expo Go is compatible with Expo SDK 58. If Metro reports a package-version mismatch, run:

```bash
npx expo install --fix
npx expo start -c
```

The app uses `expo-sqlite`, which is included in Expo Go for this SDK. Native launcher icon and splash changes are visible in a standalone EAS build, not necessarily inside Expo Go.

## Typecheck and tests
```bash
npm run typecheck
npm test
```

## EAS Android builds
```bash
npm install -g eas-cli
eas login
eas build:configure
npm run build:preview
npm run build:production
```

`preview` produces an installable APK. `production` produces an Android App Bundle (AAB).

## Manual device QA checklist
1. Start in Expo Go and complete onboarding.
2. Close/reopen the app; confirm name and onboarding state persist.
3. Create 4+ habits; Home should show only 3 and incomplete habits first.
4. Toggle, edit and delete habits.
5. Log quick-add and custom water amounts; verify total and undo.
6. Set a personal water goal and verify progress.
7. Add Morning and Night skincare steps; mark complete; try guided mode.
8. Create, edit, delete journal entries; verify content persists after restart.
9. Save and edit mood; inspect history.
10. Earn achievements and confirm they remain unlocked.
11. Switch all four themes and restart.
12. Review weekly progress against actual daily records.
13. Review the water fill and its continuous wave movement in the running app.
14. Reset all data; confirm onboarding returns.

## Known limitations
- No physical-device QA has been performed as part of this source update.
- Native launcher icon and splash-screen branding require a standalone build to verify.
