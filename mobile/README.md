# CATCH Mobile App

React Native + Expo app for Android and iOS.

## Quick Start

```bash
cd mobile
npm install
npx expo start
# Press 'a' for Android emulator, 'i' for iOS simulator, scan QR for device
```

## Environment Variables

Create `mobile/.env.local`:
```
EXPO_PUBLIC_AI_SERVICE_URL=http://<your-machine-ip>:8000
EXPO_PUBLIC_LOGIC_SERVICE_URL=http://<your-machine-ip>:3001
```

Use your machine IP (not localhost) when testing on physical devices.

## Key Screens

- `CameraScreen` - main scan UI, image capture + compression + recognition + deal display
- `DealsScreen` (planned M6) - deal history and notifications
- `SettingsScreen` (planned M6) - preferences and FCM token management

## Edge Processing (Tier-1)

Before uploading, the app:
1. Checks blur (via sharpness heuristic)  
2. Resizes to 640px wide  
3. Compresses to JPEG quality 0.75 (~150-250KB)

This reduces upload time significantly on mid-range phones over mall WiFi.