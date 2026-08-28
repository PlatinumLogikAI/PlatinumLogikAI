# Play Store launch checklist — what's left

Everything below is what stands between this project and a live Google Play
listing, in the order you'll actually hit it. Assets already built (icon,
feature graphic, screenshots) are marked done with their paths; everything
else needs either your local machine (build) or your Google account
(Play Console — a good fit for Claude Cowork, since it's all logged-in
browser form-filling).

## 1. Build & sign the AAB — blocking, must happen on your machine

Not possible in this dev sandbox (no Android SDK, `dl.google.com` blocked by
network policy — see the main `README.md` for the exact error). Steps:

1. Install Android Studio (bundles the SDK).
2. Open `crappy-turd-mobile/android/` directly in Android Studio.
3. Let it sync.
4. Run on a device/emulator once to sanity-check.
5. Build → Generate Signed App Bundle, choose **Android App Bundle**, let
   Android Studio create the upload keystore.
6. **Enable Play App Signing** when Play Console offers it on first upload —
   don't self-manage the release key.

This produces the `.aab` file every later step needs.

## 2. Store listing assets — done

| Asset | Requirement | Status | Path |
|---|---|---|---|
| App icon | 512×512 PNG | ✅ done | `store-assets/icon-512.png` |
| Feature graphic | 1024×500 PNG/JPG | ✅ done | `store-assets/feature-graphic.png` |
| Phone screenshots | 2–8 images, JPEG/PNG, 320–3840px, 16:9–9:16 ratio | ✅ done (6, 840×1260) | `store-assets/screenshots/` |

No more asset generation needed — these upload as-is.

## 3. Store listing text — draft below, ready to paste and tweak

**App name:** Crappy Turd: Flap the Sewer

**Short description** (80 char max):
> Flap a sentient turd through the sewer. One log. Infinite pipes. Zero dignity.

**Full description** (4000 char max, draft):
> One log. Infinite pipes. Zero dignity.
>
> Crappy Turd is a Flappy-Bird-style arcade game with a toilet-humor twist —
> flap your way through an endless gauntlet of sewer pipes, dodge sneaky
> plungers, and see how far one determined turd can go before getting
> FLUSHED.
>
> • Classic one-tap flap gameplay, easy to learn, hard to master
> • TP Shield power-up — grab a toilet paper roll for a free hit
> • Chili Packet power-up — temporary speed boost through the sewer
> • Moving plungers add a real-time dodge challenge as you progress
> • Rising difficulty — pipes tighten and speed up the further you get
> • Fully original hand-drawn art and synthesized sound, no stock assets
> • Free, no ads, no accounts, no data collected
>
> How far can you flap before you get flushed?

Feel free to edit tone/length — this is a starting draft, not final copy.

**Category:** Games → Arcade (or Casual)

**Contact email:** whatever you want publicly listed for this app (required
field — can be different from your developer account login email).

## 4. Content rating questionnaire (IARC)

Answer honestly based on the actual game — cartoon toilet humor, no
violence, no real-world gambling, no user-generated content, no
in-app purchases, no ads. This should land at the lowest rating tier
(Everyone / PEGI 3-ish), but the questionnaire itself decides — just answer
accurately rather than guessing the outcome.

## 5. Data safety section — answer is known, it's simple

Checked the actual game code: it makes **no network requests** and stores
only two things in on-device `localStorage` — mute preference and high
score. Nothing is transmitted anywhere, no analytics SDK, no accounts, no
ads SDK.

→ In the Data Safety form: **"No data collected"**, all categories left
unchecked. This is accurate, not a shortcut.

## 6. Privacy policy — not yet done, this is a real gap

Play Console requires a privacy policy URL even when the answer is "we
don't collect anything" — the policy just needs to say so. This project
doesn't have one hosted yet.

The simplest fix: a one-page static HTML file saying "Crappy Turd collects
no personal data; the only local storage used is your mute setting and high
score, stored on your device only," deployed alongside the game at
`games.crappyturd.platinumlogik.com/privacy.html` (Netlify already
auto-deploys this branch, so this is just adding one file to `crappy-turd/`
and pushing).

**Say the word and I'll draft and deploy that page** — it's a five-minute
addition, not a Play-Console-only task.

## 7. Pricing & distribution

- Free
- No ads: No
- Contains ads: No
- Countries: your choice (default to all unless you want to limit)
- Not designed for children primarily (unless you want to declare otherwise
  — toilet humor skews teen/adult in tone even though it's not explicit)

## 8. Closed testing track — the real bottleneck, start this early

New personal developer accounts must run a closed test with **12 testers,
opted in and continuously enrolled for 14 days**, before Google unlocks
production publishing. The 14-day clock doesn't start until real testers
have actually opted in — so:

1. Upload the signed `.aab` to a new closed test track.
2. Create a tester list (email addresses or a Google Group) — recruit these
   people now, this is the actual bottleneck, not the build or the listing.
3. Share the opt-in URL Play Console generates.
4. Once 12 are enrolled, wait out the 14 days.
5. Then apply for production access.

## 9. Submit for review

Once the closed test requirement clears and the store listing is complete
(all sections above show green checks in Play Console), promote the release
to production and submit. Google's review typically takes a few hours to a
few days.

---

**Suggested order to actually work this:** build the signed AAB locally
(§1) and start recruiting closed-test testers (§8) at the same time, since
both take real calendar time — then fill in the listing (§3–7) whenever,
and deal with the privacy policy (§6) whenever, since it's quick.
