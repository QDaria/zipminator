# Zipminator Video Generation & Landing Page

🎬 **AI-Powered Video Generation for Zipminator Cybersecurity Suite**

This project contains the video generation scripts and landing page assets for Zipminator, created using Google's Gemini 3.0 High model.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Gemini API key from Google AI Studio

### Setup

1. **Install dependencies:**
```bash
cd landing-page
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

3. **Generate the video specification:**
```bash
npm run generate-video
```

## 📁 Project Structure

```
landing-page/
├── public/
│   └── logos/               # QDaria and Zipminator brand assets
│       ├── QDwordmark2.svg
│       ├── QDaria_logo_teal Large.png
│       ├── Q|Daria>.svg
│       ├── Q|D>.svg
│       ├── Z.svg            # Zipminator logomark
│       └── zipminator.svg   # Zipminator full logo
├── scripts/
│   └── generate-zipminator-video.js  # Main video generation script
├── docs/
│   └── VIDEO_SCRIPT.md      # Complete video script and specifications
├── video-output/            # Generated video specifications
│   ├── zipminator-video-specification.json
│   └── README.md
├── package.json
└── .env.example
```

## 🎯 What Makes This Special

This video generation follows the gemini-flow multi-modal orchestration pattern but is specifically designed to highlight **Zipminator's exceptional capabilities**:

### 🌟 Zipminator's Unique Advantages

1. **🔬 Multi-Provider Quantum Entropy**
   - Only platform combining Rigetti Computing + IBM Quantum
   - True non-deterministic entropy from real quantum computers
   - Automatic failover between providers

2. **🔐 Homomorphic Encryption**
   - Compute on encrypted data without decryption
   - Zero-knowledge security
   - Paillier cryptosystem implementation

3. **🛡️ DoD 5220.22-M Certified Deletion**
   - Three-pass forensic-proof data destruction
   - Military-grade secure deletion
   - When it's gone, it's truly gone

4. **⚡ FIPS 203 ML-KEM Ready**
   - Built on Kyber post-quantum standards
   - Future-proof against quantum attacks
   - Post-quantum cryptography compliance

5. **🔍 GDPR-Compliant PII Auto-Redaction**
   - Automatic detection of sensitive data
   - Norwegian FNR, SSN, credit cards
   - Privacy compliance built-in

6. **🏢 Enterprise-Grade Trust**
   - Used by DNB for financial security
   - Powers Norsk Tipping's quantum-fair gaming
   - Production-proven reliability

7. **👨‍💻 Developer-Friendly API**
   - Quantum security in 3 lines of code
   - Simple, intuitive interface
   - Comprehensive documentation

## 🎬 Video Specifications

- **Model:** Gemini 3.0 High
- **Duration:** 90 seconds
- **Resolution:** 4K (3840x2160)
- **Frame Rate:** 60fps
- **Scenes:** 9 meticulously crafted scenes
- **Style:** Corporate professional with quantum-tech aesthetic

### Scene Highlights

1. **Introduction** - QDaria brand animation
2. **Multi-Provider Quantum** - Rigetti + IBM integration
3. **Homomorphic Encryption** - Zero-knowledge computing
4. **DoD Deletion** - Military-grade security
5. **FIPS 203 Compliance** - Post-quantum ready
6. **PII Auto-Redaction** - Privacy compliance
7. **Industry Trust** - DNB, Norsk Tipping testimonials
8. **Developer API** - Simple code demonstration
9. **Call to Action** - Brand reinforcement

## 🎨 Brand Assets

All logos are included in `public/logos/`:

- **QDaria Logos:** Wordmark, teal logo, symbol
- **Zipminator Logos:** Full logo, logomark "Z"
- **Colors:**
  - QDaria Teal: `#00CED1`
  - Zipminator Deep Blue: `#1E3A8A`
  - Accent Amber: `#F59E0B`

## 🛠️ Usage

### Generate Video Specification

```bash
npm run generate-video
```

This will:
1. Connect to Gemini 3.0 High model
2. Generate scene-by-scene specifications
3. Create voiceover timing and delivery instructions
4. Generate background music composition prompts
5. Provide logo integration guidelines
6. Output complete video specification JSON

### Output Files

After running the generator, you'll find:

- `video-output/zipminator-video-specification.json` - Complete specification
- `video-output/README.md` - Production instructions
- `docs/VIDEO_SCRIPT.md` - Human-readable script

## 📊 Comparison with Gemini-Flow Example

| Feature | Gemini-Flow Example | Zipminator Video |
|---------|---------------------|------------------|
| **Model** | Gemini 2.0 Flash | Gemini 3.0 High |
| **Use Case** | Generic multi-service demo | Quantum cybersecurity |
| **Unique Angle** | 8 Google AI services | Multi-provider quantum entropy |
| **Key Message** | "One API to rule them all" | "World's most advanced security" |
| **Target Audience** | Developers | Enterprise CTOs/CISOs |
| **Video Style** | General tech demo | Corporate professional |
| **Duration** | 60 seconds | 90 seconds |
| **Scene Count** | 5 generic scenes | 9 specialized scenes |

## 🎯 Key Differentiators

While gemini-flow showcases unified API access to Google services, **Zipminator focuses on**:

1. **Real-world quantum computing integration** (not simulation)
2. **Military-grade security standards** (DoD, FIPS)
3. **Privacy compliance** (GDPR, PII redaction)
4. **Enterprise trust** (DNB, Norsk Tipping)
5. **Post-quantum cryptography readiness**
6. **Multi-provider redundancy** (Rigetti + IBM)

## 🚀 Next Steps

### For Video Production

1. Review `docs/VIDEO_SCRIPT.md` for complete creative direction
2. Use scene prompts from `video-output/zipminator-video-specification.json`
3. Render scenes using video editing software or AI video generators
4. Record voiceover following timing instructions
5. Compose background music or use stock tracks matching specifications
6. Integrate QDaria and Zipminator logos per branding guidelines
7. Export in multiple formats (4K, HD, social media)

### For Landing Page

1. Embed video on Zipminator landing page
2. Use video stills for hero images
3. Extract key frames for feature highlights
4. Create social media clips from full video
5. Add captions for accessibility

## 📖 Documentation

- [Complete Video Script](docs/VIDEO_SCRIPT.md)
- [Zipminator Main README](../README.md)
- [Installation Guide](../docs/INSTALLATION.md)
- [Pricing & Plans](../docs/PRICING.md)

## 🤝 Credits

- **Created by:** QDaria Inc.
- **AI Model:** Google Gemini 3.0 High
- **Quantum Partners:** Rigetti Computing, IBM Quantum
- **Enterprise Customers:** DNB, Norsk Tipping

## 📄 License

Proprietary - © 2025 QDaria Inc.

---

**🎬 Experience the future of cybersecurity. Watch Zipminator in action.**
