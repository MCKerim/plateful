# OAuth — Remaining Setup

## Google on iOS

### Google Cloud Console
- Create an **iOS** OAuth client ID (type: iOS, bundle ID: `com.kblanks.plateful`)
- Download `GoogleService-Info.plist`

### Xcode
- Add `GoogleService-Info.plist` to `ios/App/App/` via Xcode (drag & drop, "Copy items if needed")

### Info.plist
- Replace `YOUR_REVERSED_CLIENT_ID` with the `REVERSED_CLIENT_ID` from the plist
  - Format: `com.googleusercontent.apps.YOUR_IOS_CLIENT_ID`

### .env
- Set `VITE_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com`

### Supabase
- Add the iOS client ID to **Authentication → Providers → Google → Authorized Client IDs**

---

## Apple on iOS

### Apple Developer Console
- Enable **Sign in with Apple** capability for `com.kblanks.plateful` under Certificates, Identifiers & Profiles
- Add the capability in Xcode: Signing & Capabilities → + Capability → Sign in with Apple

### Code
- Add Apple login button in `SignUp.tsx` (similar to Google)
- `SocialLogin.initialize()` already runs on mount — add `apple: {}` config if needed
- Call `SocialLogin.login({ provider: 'apple', options: {} })`
- Use `supabase.auth.signInWithIdToken({ provider: 'apple', token: idToken, nonce: rawNonce })`

### Supabase
- Enable **Authentication → Providers → Apple**
- Add your Apple Team ID, Service ID, Key ID, and private key

---

## Apple on Web

### Apple Developer Console
- Create a **Services ID** (type: Services) for `com.kblanks.plateful.web` (or similar)
- Enable **Sign in with Apple** for that Services ID
- Add **Domains and Subdomains**: `app.plateful.cloud`, `localhost`
- Add **Return URLs**:
  ```
  https://upupcsgufoejppoietiu.supabase.co/auth/v1/callback
  https://app.plateful.cloud/signup
  http://localhost:5173/signup
  ```

### Supabase
- Under **Authentication → Providers → Apple**, set the Services ID as the client ID for web

### Code
- Same code path as iOS — capgo handles the web popup flow
- `SocialLogin.initialize()` needs `apple: { clientId: 'YOUR_SERVICES_ID', redirectUrl: '...' }`

---

## Apple on Android

Apple sign-in on Android uses a web-based flow (no native SDK).

### Apple Developer Console
- Same Services ID setup as web (Return URLs must include your Android redirect URI)

### Code
- capgo handles this through the web flow on Android
- Same `SocialLogin.login({ provider: 'apple' })` call — no platform-specific code needed

### Note
- Apple requires a **real device** for testing — Apple sign-in does not work on emulators
