# ElevenLabs Agent — Web Spatial UI

A React app that runs an **ElevenLabs Conversational AI agent** over **WebRTC** with a layout inspired by ElevenLabs UI:

- **Center**: Main agent view with an animated orb that reacts to mic input and agent output
- **Right side**: Live transcript, summary, and audio level bars (mic + agent)

## Setup

1. **Install dependencies** (already done if you cloned):

   ```bash
   npm install
   ```

2. **Configure your agent**  
   Copy `.env.example` to `.env` and set your agent ID from [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai):

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```

   Use a **public** agent, or implement a backend that returns a signed URL (WebSocket) or conversation token (WebRTC) and call it from the app.

3. **Enable client events (for transcript)**  
   In the ElevenLabs dashboard, open your agent → **Advanced** → enable **Client events** so `onMessage` receives transcriptions and LLM replies.

## Run

```bash
npm run dev
```

Then open the URL shown (e.g. http://localhost:5173). Allow microphone access when prompted and click **Start conversation**.

## Build

```bash
npm run build
npm run preview   # optional: preview production build
```

## Run on visionOS (Apple Vision Pro)

This app is set up with [WebSpatial](https://webspatial.dev/) so you can run it as a **Packaged WebSpatial App** on Apple Vision Pro (visionOS).

### Prerequisites

- **Mac** with **Xcode** and **visionOS Simulator** (Xcode → Settings → Platforms → install visionOS + visionOS Simulator)
- **Icons**: Add PWA icons so the visionOS app can be built. In `public/icons/` add:
  - `icon-512.png` (512×512, purpose: any)
  - `icon-1024-maskable.png` (1024×1024, maskable, no transparency)
  Sample icons: [WebSpatial icon examples](https://webspatial.dev/assets/files/webspatial-icon-examples-cec65dea794c612f8b689d1d17aac9f3.zip)

### Development (simulator)

1. **Start the WebSpatial dev server** (serves the visionOS-specific build with hot reload):

   ```bash
   npm run dev:avp
   ```

   Note the URL (e.g. `http://localhost:5173/webspatial/avp/` or another port).

2. **In another terminal**, run the WebSpatial Builder to package and launch the app in the visionOS simulator:

   ```bash
   XR_DEV_SERVER=http://localhost:5173/webspatial/avp/ npm run run:avp
   ```

   Use the same origin and path as the URL from step 1. The simulator will start, install the app, and load your site from the dev server.

### Build for device / distribution

- **Signed .ipa for your device**: Set `XR_PRE_SERVER` (optional, base URL of your deployed site or leave unset to bundle assets), `XR_BUNDLE_ID`, and `XR_TEAM_ID` (Apple Developer), then:

  ```bash
  npm run build:avp:ipa
  ```

- **Production build (visionOS-specific assets only)**:

  ```bash
  npm run build:avp
  ```

  Output is under `dist/webspatial/avp/`. Deploy that path so the Packaged WebSpatial App can load it (e.g. with `--base` when building the .ipa).

For more options and publishing to App Store Connect, see [WebSpatial Builder docs](https://webspatial.dev/docs/development-guide/enabling-webspatial-in-web-projects/step-2-add-build-tool-for-packaged-webspatial-apps).

## Stack

- **Vite** + **React** + **TypeScript**
- **@elevenlabs/react** — `useConversation`, WebRTC, `onMessage`, volume/frequency helpers
- **Tailwind CSS** — layout and styling
- **lucide-react** — icons
- **WebSpatial** (`@webspatial/react-sdk`, `@webspatial/vite-plugin`, `@webspatial/builder`) — run on visionOS as a Packaged WebSpatial App

## Layout

- **Center**: Agent orb (volume-reactive visualization) and Start/End call button
- **Right column**: Transcript (live), Summary (from last assistant turns), Audio (mic + agent bar visualizer)

All of this uses the same patterns as the official ElevenLabs React/UI examples (orb, transcript, bar visualizer).
