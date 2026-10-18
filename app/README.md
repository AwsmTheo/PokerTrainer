# PokerTrainer for iPhone

The iPhone app is the trainer page ([`preflop-seat-drill.html`](../preflop-seat-drill.html)) wrapped with [Capacitor](https://capacitorjs.com/). The page is copied into the app unchanged, so every drill added to the website is in the next app build too. The app works offline.

The app adds two things the website can't do, in [`native.js`](native.js):

- **Practice reminders.** At 7pm on a day you haven't opened the app, it sends a reminder. It asks for permission the first time it opens, and you can turn reminders off in the iPhone's Settings.
- **Haptics.** Answering buzzes the phone: a "success" buzz for a right answer, a softer one for a miss.

Progress is saved inside the app, separately from the website in Safari.

## What's here

| Path | What it is |
| --- | --- |
| `build-web.js` | Builds `www/`: the trainer page plus a `<script>` tag for `native.js`. |
| `native.js` | The reminders and haptics. Does nothing outside the app. |
| `capacitor.config.json` | App id (`com.awsmtheo.pokertrainer`) and name. |
| `ios/` | The Xcode project. App icon and launch screen are in `ios/App/App/Assets.xcassets`. |
| `make-images.py` | Draws the icon and launch screen. Re-run (needs Pillow) only to change them. |

## Builds

The [iPhone app workflow](../.github/workflows/ios.yml) runs on a Mac in GitHub Actions:

- **Every pull request** that touches the app or the trainer page gets a simulator build. It needs no Apple account and checks the app still compiles.
- **Run workflow** on the Actions tab (with "upload" ticked) builds a signed copy and uploads it to TestFlight. That needs the setup below.

## One-time setup to publish

1. **Join the Apple Developer Program** at [developer.apple.com/programs](https://developer.apple.com/programs/) ($99 a year). Note your **Team ID** from the Membership page.
2. **Create the app** in [App Store Connect](https://appstoreconnect.apple.com/) under Apps, then +, New App: platform iOS, name "PokerTrainer" (or another if taken), bundle ID `com.awsmtheo.pokertrainer` (register it under Certificates, Identifiers & Profiles first if it isn't offered), SKU anything.
3. **Create an API key** in App Store Connect under Users and Access, Integrations, App Store Connect API. Give it the **Admin** role (the build needs it to create signing certificates). Download the `.p8` file (you can only download it once) and note the **Key ID** and **Issuer ID**.
4. **Add four repository secrets** in GitHub under Settings, Secrets and variables, Actions:
   - `APPLE_TEAM_ID`: the Team ID
   - `ASC_KEY_ID`: the Key ID
   - `ASC_ISSUER_ID`: the Issuer ID
   - `ASC_KEY_P8`: the whole contents of the `.p8` file
5. **Run the workflow** from the Actions tab. When it finishes, the build appears in App Store Connect under TestFlight after Apple processes it, and you can install it on your phone with the TestFlight app.
6. **Submit for review** from App Store Connect once you're happy with it. You'll need screenshots, a description, a privacy policy URL, and the age rating questionnaire. Answer "frequent/intense simulated gambling", since the drills are poker; the rating comes out as the highest age band. For App Privacy, the app collects no data.

To release an update, change `MARKETING_VERSION` (the version people see, such as 1.1) in the Xcode project if you want, then run the workflow again. The build number goes up on its own.

## Working on it on a Mac

```
cd app
npm install
npm run sync        # builds www/ and copies it into the Xcode project
npx cap open ios    # opens Xcode; pick a simulator or your phone and press Run
```
