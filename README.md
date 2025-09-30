# Eternal Veil

**Speak in silence. Disappear without a trace.**

A secure peer-to-peer chat application with end-to-end encryption, ephemeral identities, and zero-knowledge architecture.

## 🚀 Live Demo

Visit the deployed application: [https://eternal-veil.vercel.app](https://eternal-veil.vercel.app)

## ✨ Features

- **End-to-End Encryption**: Military-grade AES-GCM encryption with ECDH P-256 key exchange
- **Ephemeral Identity**: Generate anonymous identities without phone numbers or personal information
- **Peer-to-Peer**: Direct WebRTC connections bypass servers entirely
- **Self-Destruct Messages**: Burn messages after reading with cryptographic deletion
- **Zero-Knowledge Server**: Servers never see your keys, messages, or metadata
- **Open Source**: Fully auditable code with reproducible builds

## 🔒 Security

- **Cryptographic Implementation**:
  - AES-GCM 256-bit encryption for message content
  - ECDH P-256 for key exchange
  - Ed25519 for identity signatures
  - Web Crypto API for all operations

- **Trust Model**:
  - Trust-on-First-Use (TOFU) with fingerprint verification
  - Out-of-band verification via QR codes
  - Emoji-phrase handshake alternative
  - No central authority or PKI required

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Crypto**: Web Crypto API
- **Storage**: LocalStorage for settings and keys
- **PWA**: Progressive Web App capabilities
- **Deployment**: Vercel static hosting

## 📱 PWA Features

- **Installable**: Add to home screen on mobile and desktop
- **Offline Capable**: Works without internet connection
- **Responsive**: Optimized for all device sizes
- **Secure**: HTTPS-only with security headers

## 🚀 Local Development

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd eternal-veil
   ```

2. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 3000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:3000
   ```

3. Open your browser to `http://localhost:3000`

## 📦 Deployment to Vercel

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: GitHub Integration
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Automatic deployments on every push

### Option 3: Drag & Drop
1. Go to [vercel.com](https://vercel.com)
2. Drag the project folder to the deployment area
3. Deploy instantly

## 🔧 Configuration

The project includes:
- `vercel.json` - Vercel deployment configuration with security headers
- `package.json` - Project metadata and scripts
- Progressive Web App manifest (embedded in HTML)

## 🎨 Design System

- **Color Scheme**: Dark theme with red accents (#B30000)
- **Typography**: Orbitron (headlines), Inter (body), Roboto Mono (code)
- **Animations**: Smooth transitions with custom easing
- **Responsive**: Mobile-first design with breakpoints

## 🔐 Privacy & Security

- **No Data Collection**: Zero telemetry or analytics
- **Client-Side Only**: All processing happens in your browser
- **Secure Headers**: CSP, HSTS, and other security headers
- **Open Source**: Fully auditable codebase

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## ⚠️ Security Notice

This is a demonstration application. For production use:
- Implement proper key encryption in storage
- Add comprehensive WebRTC P2P networking
- Conduct security audits
- Add comprehensive testing

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Remember: Your privacy is your power. Use it wisely.**