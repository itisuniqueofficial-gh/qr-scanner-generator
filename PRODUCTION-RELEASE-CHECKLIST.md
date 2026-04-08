# Production Release Checklist

## Build

- Android Studio project opens successfully
- Gradle sync completes
- Release version name is correct
- Release version code is correct
- Signed AAB generated successfully
- Keystore stored securely
- Keystore not committed to repo

## Functional QA

- Home page loads correctly
- QR scanner works with camera permission
- QR image upload works
- QR generator works
- UPI QR generator works
- UPI redirect opens supported apps
- Offline fallback behaves correctly
- Back navigation works
- External links open correctly
- No obvious crashes on Android 8+

## Store Listing

- App title added
- Short description added
- Full description added
- Screenshots uploaded
- Feature graphic uploaded
- App icon verified
- Privacy policy URL added
- Contact details added

## Compliance

- Data Safety form completed
- Content rating completed
- App category selected
- No misleading claims
- Permissions match actual behavior
- Camera usage clearly justified
- UPI behavior clearly described as external-app based

## Release Flow

- Upload to internal testing
- Test Play-distributed build
- Fix issues if needed
- Move to closed testing
- Publish production release
