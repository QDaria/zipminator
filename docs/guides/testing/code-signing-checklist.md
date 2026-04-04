# Code Signing Checklist — Zipminator

Covers all platforms: macOS (Tauri 2.x), iOS (Flutter), Android (Flutter).

Bundle ID: `com.qdaria.zipminator`
Company: QDaria AS (Norwegian entity)

---

## 1. Apple Developer Program

### 1.1 Organization vs Individual Account

| Factor | Individual ($99/yr) | Organization ($99/yr) |
|--------|---------------------|----------------------|
| Enrollment | Immediate (Apple ID only) | Requires D-U-N-S number + legal entity verification |
| App Store name | Personal name | Company name ("QDaria AS") |
| Team management | Single developer | Multiple team members with roles |
| Enterprise distribution | Not available | Available (separate $299/yr program) |
| Investor perception | Looks like solo project | Looks like real company |
| TestFlight | Yes | Yes |
| Timeline | Same day | 2-4 weeks (D-U-N-S + Apple review) |

**Recommendation**: Organization account under QDaria AS. The company name appears on the App Store and in the "Identified Developer" Gatekeeper dialog on macOS. Worth the D-U-N-S wait for credibility.

### 1.2 D-U-N-S Number (Norwegian Company)

D-U-N-S is a Dun & Bradstreet identifier. Apple requires it for Organization enrollment.

1. Check if QDaria AS already has one: https://www.dnb.com/duns-number/lookup.html
2. Norwegian companies registered in Bronnoysundregistrene are often already in D&B's database
3. If not found, request one free via Apple's lookup tool: https://developer.apple.com/enroll/duns-number/us/
4. Apple routes the request to D&B. Typical turnaround: 5-14 business days
5. You will need: company legal name, address, phone, org number (from Bronnoysundregistrene)
6. The D-U-N-S number is 9 digits. Save it; you will reuse it for Google Play organization account

### 1.3 Enrollment Steps

1. Sign in at https://developer.apple.com/enroll/ with `mo@qdaria.com` Apple ID
2. Select "Organization"
3. Enter D-U-N-S number, legal entity name, address
4. Apple contacts the org phone number listed with D&B for verification
5. Pay $99 USD/year
6. Wait for approval (typically 24-48 hours after phone verification)
7. Once approved, you get access to certificates, provisioning profiles, App Store Connect

### 1.4 Certificates Needed

| Certificate | Purpose | Where Used |
|------------|---------|-----------|
| Developer ID Application | Sign macOS apps distributed outside App Store (DMG) | Tauri desktop app |
| Developer ID Installer | Sign macOS .pkg installers (if needed) | Optional |
| Apple Distribution | Sign iOS/macOS apps for App Store + TestFlight | Flutter iOS app |
| Apple Development | Sign during development/debugging | Local Xcode builds |

Generate via Xcode (Accounts > Manage Certificates) or via Apple Developer portal.

### 1.5 Provisioning Profiles

| Profile | Type | Purpose |
|---------|------|---------|
| iOS Development | Development | Run on test devices from Xcode |
| iOS App Store | Distribution | TestFlight + App Store submission |
| macOS App Store | Distribution | If distributing Tauri app via Mac App Store |

For TestFlight:
1. Create App ID in Apple Developer portal: `com.qdaria.zipminator`
2. Create App Store Distribution provisioning profile linked to that App ID
3. Upload build via Xcode or `xcrun altool`

### 1.6 Notarization (macOS DMG)

Notarization is mandatory for macOS apps distributed outside the App Store since macOS 10.15. Without it, Gatekeeper blocks the app.

Steps:
1. Sign the app with Developer ID Application certificate
2. Submit to Apple's notary service:
   ```bash
   xcrun notarytool submit Zipminator_0.2.0_aarch64.dmg \
     --apple-id "mo@qdaria.com" \
     --team-id "YOUR_TEAM_ID" \
     --password "app-specific-password" \
     --wait
   ```
3. Staple the notarization ticket to the DMG:
   ```bash
   xcrun stapler staple Zipminator_0.2.0_aarch64.dmg
   ```
4. Verify:
   ```bash
   xcrun stapler validate Zipminator_0.2.0_aarch64.dmg
   spctl --assess --type open --context context:primary-signature Zipminator_0.2.0_aarch64.dmg
   ```

App-specific password: Generate at https://appleid.apple.com/account/manage > Sign-In and Security > App-Specific Passwords.

---

## 2. Google Play

### 2.1 Play Console Account

1. Go to https://play.google.com/console/signup
2. Pay $25 one-time fee
3. For organization account: provide company name, address, D-U-N-S number, website
4. Google may require identity verification (passport/ID + company docs)
5. Verification can take 2-7 business days for organizations
6. Use `mo@qdaria.com` as the developer account email

### 2.2 App Signing

Google Play requires AAB (Android App Bundle) format since August 2021. APKs are only accepted for existing apps with exemptions.

**Play App Signing (recommended)**:
- Google manages the app signing key
- You upload with an upload key
- If you lose the upload key, Google can reset it (you cannot reset the app signing key yourself without Play App Signing)
- Enrollment is permanent and irreversible

**Upload key workflow**:
1. Generate an upload keystore:
   ```bash
   keytool -genkey -v -keystore upload-keystore.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias upload \
     -dname "CN=QDaria AS, O=QDaria AS, L=Oslo, C=NO"
   ```
2. Store the keystore file and password securely (1Password, not in git)
3. Enroll in Play App Signing during first upload
4. Google extracts the upload key and gives you a new app signing key managed by them

### 2.3 AAB vs APK

| Format | Play Store | Direct Distribution |
|--------|-----------|-------------------|
| AAB | Required | Not installable directly |
| APK | Rejected for new apps | Installable via sideload |

Build AAB with Flutter:
```bash
flutter build appbundle --release
# Output: app/build/app/outputs/bundle/release/app-release.aab
```

Build APK for direct distribution (beta testers, website download):
```bash
flutter build apk --release --split-per-abi
# Output: app/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk (~30-40MB)
```

---

## 3. Tauri 2.x macOS Code Signing

### 3.1 Current State

File: `browser/src-tauri/tauri.conf.json`
- `signingIdentity: null` (ad-hoc signed)
- `minimumSystemVersion: "11.0"`
- Bundle ID: `com.qdaria.zipminator`

### 3.2 Configuration for Real Signing

Update `browser/src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "11.0",
      "signingIdentity": "Developer ID Application: QDaria AS (TEAM_ID)",
      "providerShortName": "TEAM_ID"
    }
  }
}
```

Replace `TEAM_ID` with the 10-character Apple Team ID visible in the Apple Developer portal.

### 3.3 Environment Variables for CI/CD

Tauri uses these environment variables for macOS signing and notarization:

```bash
# Code signing
APPLE_CERTIFICATE          # Base64-encoded .p12 certificate
APPLE_CERTIFICATE_PASSWORD # Password for the .p12 file
APPLE_SIGNING_IDENTITY     # "Developer ID Application: QDaria AS (TEAM_ID)"

# Notarization
APPLE_ID                   # mo@qdaria.com
APPLE_PASSWORD             # App-specific password (NOT your Apple ID password)
APPLE_TEAM_ID              # 10-character team ID
```

### 3.4 Exporting the Certificate for CI

1. Open Keychain Access on your Mac
2. Find "Developer ID Application: QDaria AS"
3. Right-click > Export Items > save as `certificate.p12` with a strong password
4. Base64-encode it:
   ```bash
   base64 -i certificate.p12 -o certificate-base64.txt
   ```
5. Store in GitHub Secrets:
   - `APPLE_CERTIFICATE` = contents of certificate-base64.txt
   - `APPLE_CERTIFICATE_PASSWORD` = the password you set

### 3.5 GitHub Actions Signing Job

Add to `.github/workflows/release.yml` (or a new Tauri-specific workflow):

```yaml
build-macos:
  runs-on: macos-latest
  steps:
    - uses: actions/checkout@v4

    - name: Install Rust
      uses: dtolnay/rust-toolchain@stable

    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Install frontend dependencies
      working-directory: browser
      run: npm install

    - name: Import certificate
      env:
        APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
        APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
      run: |
        CERTIFICATE_PATH=$RUNNER_TEMP/certificate.p12
        KEYCHAIN_PATH=$RUNNER_TEMP/app-signing.keychain-db
        KEYCHAIN_PASSWORD=$(openssl rand -base64 32)

        echo -n "$APPLE_CERTIFICATE" | base64 --decode -o $CERTIFICATE_PATH
        security create-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
        security set-keychain-settings -lut 21600 $KEYCHAIN_PATH
        security unlock-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
        security import $CERTIFICATE_PATH -P "$APPLE_CERTIFICATE_PASSWORD" \
          -A -t cert -f pkcs12 -k $KEYCHAIN_PATH
        security set-key-partition-list -S apple-tool:,apple: \
          -k "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
        security list-keychain -d user -s $KEYCHAIN_PATH

    - name: Build Tauri app
      uses: tauri-apps/tauri-action@v0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
        APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
        APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
        APPLE_ID: ${{ secrets.APPLE_ID }}
        APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
        APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
      with:
        projectPath: browser

    - name: Upload DMG
      uses: actions/upload-artifact@v4
      with:
        name: Zipminator-macOS
        path: browser/src-tauri/target/release/bundle/dmg/*.dmg
```

The `tauri-apps/tauri-action` handles notarization automatically when `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID` are set.

---

## 4. Flutter Platform Signing

### 4.1 iOS — Xcode Signing

Current state in `app/ios/Runner.xcodeproj/project.pbxproj`:
- `CODE_SIGN_STYLE = Automatic`
- `PRODUCT_BUNDLE_IDENTIFIER = com.qdaria.zipminator`
- No `DEVELOPMENT_TEAM` set

To configure:
1. Open `app/ios/Runner.xcworkspace` in Xcode
2. Select Runner target > Signing & Capabilities
3. Check "Automatically manage signing"
4. Select team: QDaria AS
5. Xcode generates provisioning profiles automatically

For CI (without Xcode UI):
- Set `DEVELOPMENT_TEAM` in project.pbxproj or pass via build args:
  ```bash
  flutter build ipa --release \
    --export-options-plist=ios/ExportOptions.plist
  ```

Create `app/ios/ExportOptions.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>teamID</key>
  <string>YOUR_TEAM_ID</string>
  <key>uploadSymbols</key>
  <true/>
  <key>signingStyle</key>
  <string>automatic</string>
</dict>
</plist>
```

### 4.2 Android — Gradle Signing Config

Current state in `app/android/app/build.gradle.kts`:
- Release build uses `signingConfigs.getByName("debug")` (the TODO is already noted in the file)
- No `key.properties` file exists

Steps to configure:

1. Create `app/android/key.properties` (NEVER commit this file):
   ```properties
   storePassword=<password>
   keyPassword=<password>
   keyAlias=upload
   storeFile=../upload-keystore.jks
   ```

2. Add `key.properties` to `.gitignore` (verify it is already listed)

3. Update `app/android/app/build.gradle.kts`:
   ```kotlin
   import java.util.Properties
   import java.io.FileInputStream

   val keystoreProperties = Properties()
   val keystorePropertiesFile = rootProject.file("key.properties")
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(FileInputStream(keystorePropertiesFile))
   }

   android {
       // ... existing config ...

       signingConfigs {
           create("release") {
               keyAlias = keystoreProperties["keyAlias"] as String?
               keyPassword = keystoreProperties["keyPassword"] as String?
               storeFile = keystoreProperties["storeFile"]?.let { file(it as String) }
               storePassword = keystoreProperties["storePassword"] as String?
           }
       }

       buildTypes {
           release {
               signingConfig = signingConfigs.getByName("release")
           }
       }
   }
   ```

### 4.3 Fastlane (Optional but Recommended)

No Fastlane config exists yet. If adopting it:

```bash
# Install
gem install fastlane

# iOS setup
cd app/ios
fastlane init  # Select "Automate App Store distribution"

# Android setup
cd app/android
fastlane init  # Select "Automate Google Play distribution"
```

Fastlane handles:
- Certificate and profile management (`match`)
- Building and uploading to TestFlight / App Store (`deliver`)
- Building and uploading to Google Play (`supply`)
- Screenshot automation (`snapshot`)

For a small team, Fastlane is not strictly necessary. Flutter CLI + GitHub Actions can handle the same workflows. Consider adopting it when you need automated screenshot generation or manage multiple apps.

---

## 5. GitHub Secrets Required

| Secret | Purpose | Where to Get |
|--------|---------|-------------|
| `APPLE_CERTIFICATE` | Base64 .p12 (Developer ID Application) | Keychain Access export |
| `APPLE_CERTIFICATE_PASSWORD` | .p12 password | You set it during export |
| `APPLE_SIGNING_IDENTITY` | Full cert name | "Developer ID Application: QDaria AS (TEAM_ID)" |
| `APPLE_ID` | Apple account email | mo@qdaria.com |
| `APPLE_PASSWORD` | App-specific password | appleid.apple.com |
| `APPLE_TEAM_ID` | 10-char team ID | Apple Developer portal |
| `ANDROID_KEYSTORE` | Base64 upload keystore | `base64 -i upload-keystore.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | You set it during keytool |
| `ANDROID_KEY_ALIAS` | Key alias | "upload" |
| `ANDROID_KEY_PASSWORD` | Key password | You set it during keytool |

---

## 6. Step-by-Step Action Plan

### Week 1: Apple Developer Setup

- [ ] Check if QDaria AS has a D-U-N-S number (dnb.com lookup)
- [ ] If not, request via Apple's D-U-N-S lookup tool
- [ ] Wait for D-U-N-S (5-14 business days)
- [ ] Enroll in Apple Developer Program as Organization ($99)
- [ ] Wait for Apple approval (24-48 hours after phone verification)

### Week 2-3 (while waiting for D-U-N-S): Google Play + Android Signing

- [ ] Create Google Play Console account ($25) as Organization
- [ ] Generate upload keystore (`keytool -genkey ...`)
- [ ] Store keystore + password in 1Password or similar
- [ ] Create `app/android/key.properties` (local only, gitignored)
- [ ] Update `app/android/app/build.gradle.kts` with release signing config
- [ ] Build release AAB: `flutter build appbundle --release`
- [ ] Create app listing in Play Console (title, description, screenshots)
- [ ] Upload first AAB to internal testing track
- [ ] Enroll in Play App Signing

### Week 3-4: Apple Certificates + iOS

- [ ] Once enrolled, create App ID `com.qdaria.zipminator` in Apple Developer portal
- [ ] Generate Developer ID Application certificate (for Tauri macOS)
- [ ] Generate Apple Distribution certificate (for iOS)
- [ ] Open `app/ios/Runner.xcworkspace`, set team to QDaria AS
- [ ] Confirm automatic signing works locally
- [ ] Build IPA: `flutter build ipa --release`
- [ ] Upload to TestFlight via Xcode or `xcrun altool`
- [ ] Create `app/ios/ExportOptions.plist` for CI builds

### Week 4: Tauri macOS Signing + Notarization

- [ ] Update `browser/src-tauri/tauri.conf.json` with `signingIdentity`
- [ ] Export .p12 from Keychain Access
- [ ] Base64-encode and store in GitHub Secrets
- [ ] Generate app-specific password for notarization
- [ ] Test local signed build:
  ```bash
  cd browser && npm run tauri build
  ```
- [ ] Verify notarization:
  ```bash
  spctl --assess --type execute browser/src-tauri/target/release/bundle/macos/Zipminator.app
  ```
- [ ] Test DMG on a clean Mac (no developer tools) to confirm Gatekeeper passes

### Week 4-5: CI/CD Integration

- [ ] Add all secrets to GitHub repository settings
- [ ] Add macOS signing job to `.github/workflows/release.yml`
- [ ] Add iOS build + TestFlight upload job
- [ ] Add Android AAB build + Play Console upload job
- [ ] Run a test release (tag `v0.3.0-beta.1`) and verify:
  - [ ] macOS DMG is signed and notarized
  - [ ] iOS IPA uploads to TestFlight
  - [ ] Android AAB uploads to internal testing
- [ ] Verify DMG downloads from GitHub Releases and opens without Gatekeeper warnings

### Week 5-6: Store Submissions

- [ ] Submit iOS app for App Store review (after TestFlight testing)
- [ ] Submit Android app for Google Play review (promote from internal to production)
- [ ] Prepare store assets: icon (1024x1024), screenshots (6.7" + 5.5" iPhone, 12.9" iPad), feature graphic (1024x500 for Play)
- [ ] Write store description, privacy policy URL, support URL

---

## 7. Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program (Organization) | $99 | Annual |
| Google Play Console | $25 | One-time |
| D-U-N-S number | Free | One-time |
| **Total first year** | **$124** | |
| **Annual recurring** | **$99** | Apple only |

Optional future costs:
- Apple Developer Enterprise Program: $299/year (for internal distribution to 100+ employees)
- FIPS 140-3 CMVP certification: $80,000-$150,000+ (not needed for beta launch)

---

## 8. Security Notes

- NEVER commit keystores, .p12 files, or `key.properties` to git
- **GAP FOUND**: `app/android/.gitignore` covers `*.keystore` but NOT `*.jks` or `key.properties`. Root `.gitignore` has no signing exclusions at all. Add `*.jks`, `*.p12`, `key.properties` before generating any signing material
- Store all signing credentials in a secrets manager (1Password, GitHub Secrets, or similar)
- Rotate app-specific passwords annually
- Keep a secure backup of the Android upload keystore; losing it requires contacting Google support
- The Apple Developer ID Application certificate is valid for 5 years; set a calendar reminder to renew

---

## 9. Files That Need Modification (When Ready)

| File | Change |
|------|--------|
| `browser/src-tauri/tauri.conf.json` | Set `signingIdentity` to real cert name |
| `app/android/app/build.gradle.kts` | Add release signing config block |
| `app/android/key.properties` | Create (gitignored) with keystore paths |
| `app/ios/ExportOptions.plist` | Create for CI builds |
| `.github/workflows/release.yml` | Add macOS/iOS/Android signing jobs |
| `.gitignore` | Verify `*.jks`, `*.p12`, `key.properties` are listed |

No code changes should be made until the Apple Developer enrollment is approved and certificates are generated.
