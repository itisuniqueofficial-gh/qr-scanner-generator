# Android App Build Guide

This folder contains the Android Studio project for the WebView-based Android app version of:

`https://qr.itisuniqueofficial.com`

## App Details

- App Name: `QR Scanner & Generator`
- Short Name: `QR Tools`
- Package Name: `com.itisuniqueofficial.qr`
- Minimum Android Version: Android 8.0 (API 26)

## What The App Supports

- Secure WebView loading for `https://qr.itisuniqueofficial.com`
- JavaScript, DOM storage, and service worker friendly behavior
- Camera permission for browser-based QR scanning
- File chooser support for QR image upload
- UPI deep link opening through installed payment apps
- Offline fallback handling
- Android 12+ splash screen support

## Open In Android Studio

1. Open Android Studio.
2. Choose `Open`.
3. Select the `android-app` folder.
4. Let Gradle sync complete.

## Build Debug APK

1. Open the project in Android Studio.
2. Select `Build`.
3. Choose `Build Bundle(s) / APK(s)`.
4. Choose `Build APK(s)`.

## Generate Signed AAB For Play Console

1. Open Android Studio.
2. Go to `Build`.
3. Choose `Generate Signed Bundle / APK`.
4. Select `Android App Bundle`.
5. Create or choose your keystore.
6. Choose the `release` build variant.
7. Finish the wizard.

The generated `.aab` file can then be uploaded to Google Play Console.

## Play Console Notes

- Privacy policy URL:
  `https://qr.itisuniqueofficial.com/privacy-policy.html`
- The app uses camera permission only for QR scanning.
- File/image access is used only for QR image upload and reading.
- UPI handling is delegated to external installed payment apps.

## Recommended Testing

- Android 8, 10, 12, 13, and 14+
- Camera scanning flow
- Image upload flow
- Offline launch behavior
- UPI redirect behavior
- Back navigation inside WebView

## Important Notes

- The app allows only the secure site host inside WebView.
- External links open outside the app.
- Unsafe SSL pages are blocked.
- The Android app depends on the live website and its PWA caching behavior for the best experience.
