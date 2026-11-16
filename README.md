# Bloom

Bloom is a personal wellness tracker for Android, built with Expo, React Native, TypeScript, Expo Router, and SQLite. Track everyday habits and wellness routines in one place, with your data kept on your device.

> **Project status:** The release APK has been tested on an Android device, and all app features were confirmed working in that device test. TypeScript checks, the Jest test suite, Expo dependency compatibility, and an Android bundle export have also been verified. See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for verification details.

## Features

- Habit tracking with daily completion and weekly progress.
- Water logging, custom amounts, and a personal daily goal.
- Morning and evening skincare checklists.
- Journal entries and daily mood check-ins.
- A garden that grows with your progress and tracks achievements.
- Daily quotes and four themes: Soft Bloom, Lavender, Sage, and Dark.
- On-device data storage; no account or cloud service required.

## Install the Android APK

The tested APK will be published as an asset on the [GitHub Releases page](https://github.com/shubhamvermaaa71/Bloom/releases/latest).

1. Open the Releases page on your Android device and download the APK.
2. Open the downloaded file and follow Android's install prompts.
3. If Android asks, allow your browser or file manager to install apps from that source.

## Run from source

### Requirements

- Node.js LTS and npm.
- Android phone with a compatible Expo Go app, or an Android emulator.
- Git to clone the repository.

Expo Go only supports SDK versions compatible with the Expo Go release installed on your device. If your Expo Go version is incompatible, use the Android build instructions below.

### Start with Expo Go

```bash
git clone https://github.com/shubhamvermaaa71/Bloom.git
cd Bloom
npm ci
npx expo start
```

Open Expo Go on your Android device and scan the QR code. Keep the computer and phone on the same network, or use Expo CLI's tunnel connection option if your network prevents direct access.

To launch on an available Android emulator:

```bash
npm run android
```

The repository includes an npm lockfile and `.npmrc` dependency-resolution settings. Use `npm ci` for a clean, reproducible install.

## Build Android from source

### Option 1: Build and run locally

For a local Android build, install Android Studio with the Android SDK and Java JDK configured, then start an Android emulator or connect an Android device with USB debugging enabled. From the project directory, run:

```bash
npm ci
npx expo run:android
```

Expo generates the native Android project if needed, compiles the app, and installs it on the available emulator or connected device. This is a local development build; it does not produce the signed release APK. No EAS account is needed.

### Option 2: Build an APK or AAB with EAS

The EAS profiles are configured in [`eas.json`](./eas.json):

- **Preview** creates an installable APK for testing.
- **Production** creates an Android App Bundle (AAB), typically used for Play Store submission.

Install and sign in to EAS CLI:

```bash
npm install --global eas-cli
eas login
```

Build an APK:

```bash
eas build --platform android --profile preview
```

Build a production AAB:

```bash
eas build --platform android --profile production
```

EAS builds the Android native app from this repository's source. When a build completes, download the APK or AAB from the build link printed by EAS. The production AAB is not a directly installable APK. An EAS account and internet access are required for cloud builds.

## Verify the source

```bash
npm run typecheck
npm test
```

## Privacy and data

Bloom does not require login and does not send journal or wellness data to a Bloom cloud backend. App data is stored in a standard SQLite database on the device. 

## Known limitations

- Expo Go may display its own launcher icon and splash screen; use the tested APK to see the standalone Android branding.
