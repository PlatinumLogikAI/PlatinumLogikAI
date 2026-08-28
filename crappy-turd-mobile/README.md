# Crappy Turd — Android wrapper (Capacitor)

Wraps the actual live game (`../crappy-turd/index.html`, bundled here at
`www/index.html` — a copy, not a live link to Netlify) as a native Android
app via [Capacitor](https://capacitorjs.com). No gameplay code was rewritten;
the only changes to the shared game file are a few guarded hooks that no-op
outside the native shell (see "What was added to the game file" below).

- **App name (on-device label):** Crappy Turd
- **Package ID (`applicationId`):** `com.platinumlogik.crappyturd` — permanent
  once published to Google Play. Don't change this later; see the chat
  history for why.
- **Play Store listing title** (a separate field you enter in Play Console,
  not this project): *Crappy Turd: Flap the Sewer*

## What's done

- Capacitor project initialized (`capacitor.config.json`), native `android/`
  project scaffolded via `npx cap add android`, game bundled into
  `www/index.html` and synced into the native project's assets.
- Portrait orientation locked (`AndroidManifest.xml`).
- Immersive status bar + splash screen configured (`capacitor.config.json`,
  matches the game's navy `#122038`).
- Pause-on-background needed **no new code** — the game already listens for
  the page's `visibilitychange` event, and Capacitor's WebView fires that
  correctly on app background/foreground. It just works inside the wrapper.
- Light haptic tap on shield-absorb, stronger tap on death (`Haptics` helper
  near the top of the script block in `index.html`) — real vibration on
  device, silently does nothing in a normal browser.
- Plugins installed: `@capacitor/app`, `@capacitor/haptics`,
  `@capacitor/status-bar`, `@capacitor/splash-screen`.

## What's NOT done — the one real wall

This dev environment has Node, Java 21, and Gradle, but **no Android SDK**,
and its network policy blocks `dl.google.com` (403 Forbidden) — which is
exactly where the Android Gradle Plugin's build artifacts live. Confirmed by
actually running the build, not guessing:

```
Could not resolve com.android.tools.build:gradle:8.13.0.
Could not get resource 'https://dl.google.com/dl/android/maven2/...'.
Received status code 403 from server: Forbidden
```

Everything up to that point works (Gradle wrapper itself downloaded and ran
fine from `services.gradle.org`, which isn't blocked). This is the only
thing standing between this project and a running app — it needs an
environment with the Android SDK and unrestricted network, i.e. your machine.

## Finishing the build (do this locally, in Android Studio)

1. Install [Android Studio](https://developer.android.com/studio) if you
   don't have it — it bundles the Android SDK, so this alone clears the wall
   above.
2. Pull this branch, then open `crappy-turd-mobile/android/` in Android
   Studio directly (File → Open, point at that folder — not the repo root).
3. Let it sync (first sync downloads SDK platform/build-tools; normal, may
   take a few minutes).
4. Run on a device or emulator (the green ▶ button) to sanity-check it before
   touching Google Play at all.
5. When the game itself changes, re-sync the bundle before rebuilding:
   ```
   cp ../crappy-turd/index.html www/index.html
   npx cap sync android
   ```
6. Build → Generate Signed App Bundle / APK, choose **Android App Bundle**,
   and let Android Studio create a new upload keystore (or use an existing
   one). This is the `.aab` Google Play actually wants.
7. In Play Console, **enable Play App Signing** when prompted during upload —
   Google holds the release key, you only hold the upload key, and Google
   can help you recover if you ever lose that one. Don't manage your own
   keystore for this.
8. Upload the `.aab` to a **closed test** track first. New personal
   developer accounts need a closed test with **12 testers, opted in and
   enrolled continuously for 14 days**, before Google unlocks production
   publishing — start rounding up testers now, that's the real bottleneck,
   not the build.

- **App icon** — done. Reuses the game's exact hand-drawn character art
  (same drawing code as `turd.draw()` in `index.html`) on a navy `#122038`
  background with a soft gold glow. All density buckets regenerated
  (`mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/{ic_launcher, ic_launcher_round,
  ic_launcher_foreground}.png`), the adaptive-icon background color updated
  to match (`values/ic_launcher_background.xml`), and the old generic
  Capacitor template vector art removed. Verified at true 48px size
  (smallest launcher size, mdpi) — still reads clearly. A separate
  512×512 Play Store listing icon is at `store-assets/icon-512.png`.

## Still to do (not started)

- **Feature graphic** (1024×500, required for the Play Store listing page) —
  not started.
- Everything Play Console itself (store listing, screenshots, content
  rating, privacy declarations) — no API access to that from here, it's
  browser-only on your Google account.
