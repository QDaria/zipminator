# Zipminator Video Creation Guide

This document explains how to create the Zipminator promotional video using the provided specification file.

## How to Create the Actual Zipminator Video

The specification file contains detailed scene descriptions. Here's how to turn it into an actual video:

## 🎬 AI Video Generation Tools

### Recommended Tools

1. **Runway Gen-2** (<https://runwayml.com>)
   - Best for cinematic quality
   - Upload scene prompts from the specification
   - Generate 4-second clips, then concatenate

2. **Pika Labs** (<https://pika.art>)
   - Good for motion graphics
   - Text-to-video from scene descriptions

3. **Stable Video Diffusion**
   - Open source option
   - Requires local setup

### Using the Specification

```bash
# Each scene in video-output/zipminator-video-specification.json has:
- sceneId: Scene number
- prompt: Full scene description
- generatedData: Detailed shot-by-shot breakdown
- voiceover: Voice script
- duration: Scene length
```

## 📋 Step-by-Step Process

### Step 1: Generate Individual Scenes

For each of the 9 scenes:

1. Copy the `generatedData` text from the JSON file
2. Paste into your chosen AI video tool
3. Add parameters:
   - Duration: Use the specified `duration` field
   - Quality: 4K if available
   - Style: "Cinematic, corporate, quantum computing aesthetic"
   - Colors: Teal #00CED1, Deep Blue #1E3A8A, Amber #F59E0B

### Step 2: Add Logos

- Import logos from `landing-page/public/logos/`
- Scene 1: QDaria logo animation (0-5s)
- Throughout: Zipminator watermark (lower right, 30% opacity)
- Scene 9: Both logos side-by-side

### Step 3: Record Voiceover

Use the `voiceover` field from each scene:

**Tools:**

- **ElevenLabs** (<https://elevenlabs.io>) - AI voice generation
- **Professional voice artist** on Fiverr/Upwork
- Voice style: "Professional, authoritative female"

**Script:**

```
Scene 1: "Introducing Zipminator from QDaria - The world's most sophisticated cybersecurity suite."
Scene 2: "The only platform combining multi-provider quantum entropy from Rigetti Computing and IBM Quantum with military-grade encryption."
... (see specification for full script)
```

### Step 4: Add Background Music

**Style:** Corporate-futuristic-upbeat
**Tempo:** 120-130 BPM
**Duration:** 90 seconds

**Music Sources:**

- Epidemic Sound (<https://epidemicsound.com>)
- Artlist (<https://artlist.io>)
- AudioJungle (<https://audiojungle.net>)

Search for: "corporate technology", "quantum computing", "futuristic"

### Step 5: Video Assembly

Use video editing software:

1. **Adobe Premiere Pro** (Professional)
2. **DaVinci Resolve** (Free, powerful)
3. **Final Cut Pro** (Mac)
4. **iMovie** (Simple, free on Mac)

**Assembly Steps:**

```
1. Import all 9 scene videos
2. Arrange on timeline sequentially
3. Add 0.5s crossfade transitions between scenes
4. Add voiceover track (synchronized to scenes)
5. Add background music (-18dB)
6. Mix audio levels (voiceover -6dB, music -18dB)
7. Add logo overlays
8. Color grade (boost teal, blue, amber)
9. Export as MP4 H.264, 4K, 60fps
```

## 🚀 Quick Start with Runway Gen-2

```bash
# 1. Go to https://runwayml.com/gen-2
# 2. For Scene 1, paste this prompt:

"Cinematic corporate video: QDaria logo animates from quantum particles in deep space.
Teal particles (#00CED1) form entanglement patterns, converging into sleek logo.
Background: deep blue (#1E3A8A) with quantum circuit diagrams.
Style: Ultra-modern, professional, 4K, 60fps, cinematic lighting."

# 3. Generate 10-second clip
# 4. Repeat for all 9 scenes
# 5. Download and combine in video editor
```

## 💡 Alternative: Hire a Professional

**Where to find video producers:**

- **Fiverr** - Budget-friendly ($100-$500)
- **Upwork** - Mid-range ($500-$2000)
- **Production House** - Premium ($5000+)

**What to provide:**

- The `zipminator-video-specification.json` file
- Logos from `public/logos/`
- `docs/VIDEO_SCRIPT.md` for reference

## 📊 Expected Costs

| Option | Cost | Time | Quality |
|--------|------|------|---------|
| AI Tools (DIY) | $50-200/mo | 4-8 hours | Good |
| Freelancer | $300-800 | 1-2 weeks | Great |
| Agency | $3000-10000 | 2-4 weeks | Excellent |

## 🎯 Deliverables

Once complete, you should have:

- ✅ Full 4K version (3840x2160) - 90 seconds
- ✅ HD version (1920x1080)
- ✅ Social media square (1080x1080)
- ✅ Mobile vertical (1080x1920)

---

**Need help?** The specification contains everything a video producer needs to create the video exactly as designed.
