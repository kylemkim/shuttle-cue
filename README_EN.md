# Shuttle Cue V1.6 — Solo Badminton Trainer

A free, installable badminton training PWA with a pastel sky-blue interface. No sign-in, subscription, or backend server required.

## Languages

Use the 🌐 selector at the top to switch the **display language** between **English**, **日本語 (Japanese)**, and **한국어 (Korean)**. First-time visitors start in their browser language when supported, otherwise in English. Your choice is saved on the device.

**Display language and spoken cue language are separate.** To use an English interface with Japanese audio cues, select English at the top and 日本語 under "Spoken cue language" in mode B, C, or D. Display language switching is locked while a session is active.

## Training modes

- **A. Reaction:** Random beep cues for split-step practice.
- **B. Footwork:** Eight spoken directions; adjust return-to-center time independently from random waiting.
- **C. Grip:** Spoken numbers 1–10 for forehand/backhand grip transitions.
- **D. Combo:** Spoken direction + stroke combinations. Choose two-step cues or one combined sentence. Customize the strokes available at each court position.

Timing sliders support **0.1-second adjustments**. The default D-mode program includes 25 direction/stroke combinations, including Drive and Smash on both sides. All V1.5 core training behaviors remain unchanged.

## Install as an app

Once this site is hosted on HTTPS (for example with GitHub Pages), open it in Android Chrome and choose **Install app** or **Add to Home screen**. It can launch full-screen and caches app files for basic offline use. Device TTS voices may still require internet access or locally installed voice data.

## Updates for the developer

To upgrade an existing V1.5 GitHub Pages site, copy the updated `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, `icons/` folder, and the **new `i18n.js` file** to the repository root. Commit the changes and verify Pages deployment. No new GitHub repository is required.

## Notes

- TTS output uses your browser and device speech engine. Voice quality and timing depend on available voices.
- For very short intervals, speech can be interrupted by the next cue.
- In D mode, **zero delay** in two-step mode still produces two successive utterances; the combined mode produces one utterance.
- Training pauses if the screen is hidden or the app is switched away.
- No account, analytics, or server-side personal data storage is built into the app.
