# Play Console Release Checklist

## App Identity

- App name matches store listing
- Package name is correct: `com.itisuniqueofficial.qr`
- Privacy policy URL is live
- App icon is final
- Feature graphic is ready

## App Build

- Open `android-app/` in Android Studio
- Sync Gradle successfully
- Build debug APK successfully
- Generate signed AAB successfully
- Keep keystore backed up securely
- Do not commit keystore files

## Functional QA

- App launches correctly
- Splash screen works
- Website loads over HTTPS
- Internal links open inside WebView
- External links open outside app
- QR scanner camera flow works
- QR image upload works
- QR generator works
- UPI QR generator works
- UPI redirect opens supported apps
- Offline fallback works
- Back navigation works
- No crashes during normal use

## Permissions

- Camera permission requested only when needed
- Image/file access works only when user selects a file
- No unnecessary permissions declared

## Policy & Privacy

- Privacy policy URL added to Play Console
- Data Safety form completed
- App description is accurate
- No misleading claims
- No payment processing claims inside app
- UPI handling clearly described as external-app based

## Store Listing

- Title added
- Short description added
- Full description added
- Screenshots uploaded
- App category selected
- Contact email added
- Privacy policy added

## Release Process

- Upload signed AAB
- Complete release notes
- Send to internal testing
- Verify on real devices
- Fix issues if needed
- Move to closed testing
- Publish production release
