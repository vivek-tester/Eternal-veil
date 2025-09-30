// Eternal Veil - Secure P2P Chat Application
class EternalVeil {
    constructor() {
        this.currentPage = 'landing-page';
        this.currentChat = null;
        this.contacts = new Map();
        this.messages = new Map();
        this.settings = this.loadSettings();
        this.cryptoKeys = null;
        this.peerConnections = new Map();
        this.soundEnabled = false;
        this.entropyLevel = 0;
        this.isGenerating = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupRouting();
        this.setupCrypto();
        this.setupPWA();
        this.setupSounds();
        this.loadDemoData();
        
        // Initialize current page
        this.showPage('landing-page');
    }

    // === ROUTING & NAVIGATION ===
    setupRouting() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-route]');
            if (target) {
                e.preventDefault();
                const route = target.getAttribute('data-route');
                this.navigate(route);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const route = e.state?.route || '/';
            this.navigate(route, false);
        });
    }

    navigate(route, pushState = true) {
        if (pushState) {
            history.pushState({ route }, '', route);
        }

        // Map routes to page IDs
        const routeMap = {
            '/': 'landing-page',
            '/features': 'features-page',
            '/security': 'security-page',
            '/app': 'app-shell',
            '/app/generate': 'generate-page',
            '/app/import': 'import-page',
            '/app/contacts': 'contacts-page',
            '/settings': 'settings-page'
        };

        const pageId = routeMap[route] || 'landing-page';
        this.showPage(pageId);

        // Initialize page-specific functionality
        this.initPageFunctionality(pageId);
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            this.playSound('page_load');
        }
    }

    initPageFunctionality(pageId) {
        switch (pageId) {
            case 'generate-page':
                this.initIdentityGeneration();
                break;
            case 'import-page':
                this.initKeyImport();
                break;
            case 'app-shell':
                this.initChatInterface();
                break;
            case 'contacts-page':
                this.initContacts();
                break;
            case 'settings-page':
                this.initSettings();
                break;
        }
    }

    // === CRYPTOGRAPHY ===
    async setupCrypto() {
        // Check if keys exist in IndexedDB
        this.cryptoKeys = await this.loadKeys();
    }

    async generateKeys() {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDH",
                    namedCurve: "P-256"
                },
                true,
                ["deriveKey"]
            );

            const signingKeyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDSA",
                    namedCurve: "P-256"
                },
                true,
                ["sign", "verify"]
            );

            return {
                keyPair,
                signingKeyPair,
                fingerprint: await this.generateFingerprint(keyPair.publicKey)
            };
        } catch (error) {
            console.error('Key generation failed:', error);
            throw error;
        }
    }

    async generateFingerprint(publicKey) {
        const exported = await window.crypto.subtle.exportKey("raw", publicKey);
        const hash = await window.crypto.subtle.digest("SHA-256", exported);
        const hashArray = Array.from(new Uint8Array(hash));
        
        // Convert to emoji fingerprint
        const emojis = ['🔐', '🌟', '⚡', '🦋', '🌙', '🔥', '💎', '🎭', '🚀', '🌈', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻'];
        const emojiFingerprint = hashArray.slice(0, 8).map(byte => emojis[byte % emojis.length]).join('');
        
        // Convert to hex fingerprint
        const hexFingerprint = hashArray.slice(0, 8)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .match(/.{4}/g)
            .join(':')
            .toUpperCase();

        return { emoji: emojiFingerprint, hex: hexFingerprint };
    }

    async encryptMessage(message, recipientPublicKey) {
        if (!this.cryptoKeys) throw new Error('No keys available');

        const sharedKey = await window.crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: recipientPublicKey
            },
            this.cryptoKeys.keyPair.privateKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt"]
        );

        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            sharedKey,
            data
        );

        return {
            encrypted: new Uint8Array(encrypted),
            iv: iv
        };
    }

    // === IDENTITY GENERATION ===
    initIdentityGeneration() {
        this.entropyLevel = 0;
        this.isGenerating = false;
        this.showGenerationStep('entropy-step');
        this.setupEntropyCollection();
    }

    setupEntropyCollection() {
        const canvas = document.querySelector('#entropy-canvas canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const particles = [];
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.entropyLevel >= 100) return;
            
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            particles.push({
                x, y,
                life: 1.0,
                size: Math.random() * 3 + 1
            });
            
            this.entropyLevel = Math.min(100, this.entropyLevel + 0.5);
            this.updateEntropyDisplay();
            
            if (this.entropyLevel >= 100) {
                setTimeout(() => this.startKeyGeneration(), 500);
            }
        });

        // Animate particles
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= 0.02;
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(179, 0, 0, ${p.life * 0.8})`;
                ctx.fill();
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }

    updateEntropyDisplay() {
        const progressFill = document.getElementById('entropy-progress');
        const progressText = document.getElementById('entropy-text');
        
        if (progressFill) progressFill.style.width = `${this.entropyLevel}%`;
        if (progressText) progressText.textContent = `${Math.floor(this.entropyLevel)}% collected`;
    }

    async startKeyGeneration() {
        if (this.isGenerating) return;
        this.isGenerating = true;
        
        this.showGenerationStep('generation-step');
        this.playSound('key_complete');
        
        try {
            // Simulate key generation time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.cryptoKeys = await this.generateKeys();
            await this.saveKeys(this.cryptoKeys);
            
            this.showGenerationStep('backup-step');
            this.setupSeedPhraseBackup();
        } catch (error) {
            console.error('Key generation failed:', error);
            this.showToast('Key generation failed. Please try again.', 'error');
            this.showGenerationStep('entropy-step');
            this.entropyLevel = 0;
            this.isGenerating = false;
        }
    }

    showGenerationStep(stepId) {
        document.querySelectorAll('.flow-step').forEach(step => {
            step.classList.remove('active');
        });
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.add('active');
        }
    }

    setupSeedPhraseBackup() {
        // Remove existing event listeners to prevent duplicates
        const revealBtn = document.getElementById('reveal-btn');
        const seedPhrase = document.getElementById('seed-phrase');
        const copyBtn = document.getElementById('copy-seed');
        const downloadBtn = document.getElementById('download-key');
        const confirmBtn = document.getElementById('confirm-backup');
        
        let isRevealed = false;
        let isConfirmed = false;

        if (revealBtn) {
            revealBtn.replaceWith(revealBtn.cloneNode(true));
            const newRevealBtn = document.getElementById('reveal-btn');
            
            newRevealBtn.addEventListener('click', () => {
                if (!isRevealed) {
                    seedPhrase.classList.remove('blurred');
                    newRevealBtn.textContent = '👁️ Hide Words';
                    isRevealed = true;
                } else {
                    seedPhrase.classList.add('blurred');
                    newRevealBtn.textContent = '👁️ Reveal Words';
                    isRevealed = false;
                }
            });
        }

        if (copyBtn) {
            copyBtn.replaceWith(copyBtn.cloneNode(true));
            const newCopyBtn = document.getElementById('copy-seed');
            
            newCopyBtn.addEventListener('click', async () => {
                if (!isRevealed) {
                    this.showToast('Please reveal the seed phrase first', 'warning');
                    return;
                }
                
                const words = Array.from(document.querySelectorAll('.seed-word')).map(el => el.textContent);
                await navigator.clipboard.writeText(words.join(' '));
                this.showToast('Seed phrase copied to clipboard', 'success');
            });
        }

        if (downloadBtn) {
            downloadBtn.replaceWith(downloadBtn.cloneNode(true));
            const newDownloadBtn = document.getElementById('download-key');
            
            newDownloadBtn.addEventListener('click', () => {
                this.downloadKeystore();
            });
        }

        if (confirmBtn) {
            confirmBtn.replaceWith(confirmBtn.cloneNode(true));
            const newConfirmBtn = document.getElementById('confirm-backup');
            
            newConfirmBtn.addEventListener('click', () => {
                if (!isRevealed) {
                    this.showToast('Please reveal and backup your seed phrase first', 'warning');
                    return;
                }
                
                isConfirmed = true;
                this.showGenerationStep('complete-step');
                this.displayFingerprint();
            });
        }
    }

    displayFingerprint() {
        if (!this.cryptoKeys?.fingerprint) return;
        
        const emojiDisplay = document.querySelector('.fingerprint-display .emoji-fingerprint');
        const hexDisplay = document.querySelector('.fingerprint-display .fingerprint-hex');
        
        if (emojiDisplay) emojiDisplay.textContent = this.cryptoKeys.fingerprint.emoji;
        if (hexDisplay) hexDisplay.textContent = this.cryptoKeys.fingerprint.hex;
    }

    async downloadKeystore() {
        if (!this.cryptoKeys) return;
        
        try {
            const keystore = {
                version: "1.0",
                keyPair: await this.exportKeyPair(this.cryptoKeys.keyPair),
                signingKeyPair: await this.exportKeyPair(this.cryptoKeys.signingKeyPair),
                fingerprint: this.cryptoKeys.fingerprint,
                created: Date.now()
            };
            
            const keystoreJson = JSON.stringify(keystore, null, 2);
            const blob = new Blob([keystoreJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `eternal-veil-keystore-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showToast('Keystore downloaded successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to export keystore', 'error');
        }
    }

    async exportKeyPair(keyPair) {
        const publicKey = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        
        return {
            publicKey: Array.from(new Uint8Array(publicKey)),
            privateKey: Array.from(new Uint8Array(privateKey))
        };
    }

    // === KEY IMPORT ===
    initKeyImport() {
        const fileInput = document.getElementById('key-file');
        const textInput = document.getElementById('key-text');
        const passphraseInput = document.getElementById('passphrase');
        const importBtn = document.getElementById('import-btn');
        const errorDiv = document.getElementById('import-error');

        const checkImportReady = () => {
            const hasFile = fileInput?.files.length > 0;
            const hasText = textInput?.value.trim().length > 0;
            const hasPassphrase = passphraseInput?.value.length > 0;
            
            if (importBtn) {
                importBtn.disabled = !(hasFile || hasText) || !hasPassphrase;
            }
        };

        fileInput?.addEventListener('change', checkImportReady);
        textInput?.addEventListener('input', checkImportReady);
        passphraseInput?.addEventListener('input', checkImportReady);

        if (importBtn) {
            importBtn.replaceWith(importBtn.cloneNode(true));
            const newImportBtn = document.getElementById('import-btn');
            
            newImportBtn.addEventListener('click', async () => {
                try {
                    let keystoreData;
                    
                    if (fileInput?.files.length > 0) {
                        const file = fileInput.files[0];
                        keystoreData = await file.text();
                    } else {
                        keystoreData = textInput.value.trim();
                    }
                    
                    await this.importKeystore(keystoreData, passphraseInput.value);
                    this.showToast('Identity imported successfully', 'success');
                    this.navigate('/app');
                } catch (error) {
                    console.error('Import failed:', error);
                    this.showError(errorDiv, error.message || 'Import failed. Please check your keystore and passphrase.');
                }
            });
        }
    }

    async importKeystore(keystoreData, passphrase) {
        try {
            const keystore = JSON.parse(keystoreData);
            
            if (!keystore.version || !keystore.keyPair || !keystore.signingKeyPair) {
                throw new Error('Invalid keystore format');
            }
            
            // Import keys (simplified - in production would decrypt with passphrase)
            const keyPair = await this.importKeyPair(keystore.keyPair);
            const signingKeyPair = await this.importKeyPair(keystore.signingKeyPair);
            
            this.cryptoKeys = {
                keyPair,
                signingKeyPair,
                fingerprint: keystore.fingerprint
            };
            
            await this.saveKeys(this.cryptoKeys);
        } catch (error) {
            throw new Error('Failed to import keystore: ' + error.message);
        }
    }

    async importKeyPair(exportedKeyPair) {
        const publicKeyData = new Uint8Array(exportedKeyPair.publicKey);
        const privateKeyData = new Uint8Array(exportedKeyPair.privateKey);
        
        const publicKey = await window.crypto.subtle.importKey(
            "raw",
            publicKeyData,
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        );
        
        const privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            privateKeyData,
            { name: "ECDH", namedCurve: "P-256" },
            true,
            ["deriveKey"]
        );
        
        return { publicKey, privateKey };
    }

    showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    // === CHAT INTERFACE ===
    initChatInterface() {
        this.setupMessageComposer();
        this.setupChatActions();
        this.loadChatHistory();
    }

    setupMessageComposer() {
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const voiceBtn = document.getElementById('voice-btn');
        const attachBtn = document.getElementById('attach-btn');
        const burnBtn = document.getElementById('burn-btn');

        // Remove existing listeners and replace elements to prevent duplicates
        if (messageInput) {
            const newInput = messageInput.cloneNode(true);
            messageInput.parentNode.replaceChild(newInput, messageInput);
            
            // Auto-resize textarea
            newInput.addEventListener('input', (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                
                const currentSendBtn = document.getElementById('send-btn');
                if (currentSendBtn) {
                    currentSendBtn.disabled = !e.target.value.trim();
                }
            });

            // Send message on Enter (Shift+Enter for new line)
            newInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const currentSendBtn = document.getElementById('send-btn');
                    if (currentSendBtn && !currentSendBtn.disabled) {
                        this.sendMessage();
                    }
                }
            });
        }

        if (sendBtn) {
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            newSendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (burnBtn) {
            const newBurnBtn = burnBtn.cloneNode(true);
            burnBtn.parentNode.replaceChild(newBurnBtn, burnBtn);
            newBurnBtn.addEventListener('click', () => this.showBurnModal());
        }

        if (voiceBtn) {
            const newVoiceBtn = voiceBtn.cloneNode(true);
            voiceBtn.parentNode.replaceChild(newVoiceBtn, voiceBtn);
            newVoiceBtn.addEventListener('click', () => this.startVoiceRecording());
        }

        if (attachBtn) {
            const newAttachBtn = attachBtn.cloneNode(true);
            attachBtn.parentNode.replaceChild(newAttachBtn, attachBtn);
            newAttachBtn.addEventListener('click', () => this.showFileDialog());
        }
    }

    setupChatActions() {
        const verifyBtn = document.getElementById('verify-contact');
        if (verifyBtn) {
            const newVerifyBtn = verifyBtn.cloneNode(true);
            verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
            newVerifyBtn.addEventListener('click', () => this.showVerificationModal());
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const message = messageInput?.value.trim();
        
        if (!message) return;
        
        try {
            // Add to local messages
            this.addMessage('outgoing', message, Date.now());
            
            // Clear input
            if (messageInput) {
                messageInput.value = '';
                messageInput.style.height = 'auto';
            }
            if (sendBtn) {
                sendBtn.disabled = true;
            }
            
            // Play sound
            this.playSound('message_send');
            
            // In a real implementation, encrypt and send via WebRTC
            console.log('Sending encrypted message:', message);
            
            // Simulate receiving a response for demo
            setTimeout(() => {
                this.addMessage('incoming', 'Message received and decrypted successfully!', Date.now());
                this.playSound('message_receive');
            }, 1000);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showToast('Failed to send message', 'error');
        }
    }

    addMessage(type, content, timestamp, options = {}) {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        
        const bubbleElement = document.createElement('div');
        bubbleElement.className = 'message-bubble';
        bubbleElement.innerHTML = `<p>${this.escapeHtml(content)}</p>`;
        
        const metaElement = document.createElement('div');
        metaElement.className = 'message-meta';
        metaElement.innerHTML = `<span class="message-time">${this.formatTime(timestamp)}</span>`;
        
        messageElement.appendChild(bubbleElement);
        messageElement.appendChild(metaElement);
        
        // Add burn timer if it's a burn message
        if (options.burnTimer) {
            this.addBurnTimer(bubbleElement, options.burnTimer);
        }
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addBurnTimer(bubbleElement, seconds) {
        const timerElement = document.createElement('div');
        timerElement.className = 'burn-timer';
        timerElement.innerHTML = `🔥 ${seconds}s`;
        bubbleElement.appendChild(timerElement);
        
        const interval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(interval);
                this.burnMessage(bubbleElement.closest('.message'));
            } else {
                timerElement.innerHTML = `🔥 ${seconds}s`;
            }
        }, 1000);
    }

    burnMessage(messageElement) {
        messageElement.style.animation = 'message-burn 700ms ease-out forwards';
        
        setTimeout(() => {
            messageElement.remove();
        }, 700);
        
        this.playSound('burn_message');
    }

    loadChatHistory() {
        // Clear existing messages first
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // Load demo message
        this.addMessage('incoming', 'Welcome to Eternal Veil! This conversation is end-to-end encrypted and your identity is anonymous.', Date.now() - 60000);
    }

    startVoiceRecording() {
        this.showToast('Voice recording functionality would access microphone', 'info');
    }

    showFileDialog() {
        this.showToast('File attachment functionality would open file dialog', 'info');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString();
        }
    }

    // === MODALS ===
    showVerificationModal() {
        this.showModal('verification-modal');
    }

    showBurnModal() {
        this.showModal('burn-modal');
        
        // Set up burn confirmation handler
        setTimeout(() => {
            const confirmBtn = document.getElementById('confirm-burn');
            if (confirmBtn) {
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                newConfirmBtn.addEventListener('click', () => {
                    const timer = document.getElementById('burn-timer')?.value || 10;
                    this.sendBurnMessage(timer);
                    this.hideModal();
                });
            }
        }, 100);
    }

    sendBurnMessage(timer) {
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const message = messageInput?.value.trim();
        
        if (!message) {
            this.showToast('Please enter a message to send', 'warning');
            return;
        }
        
        this.addMessage('outgoing', message, Date.now(), { burnTimer: parseInt(timer) });
        
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }
        if (sendBtn) {
            sendBtn.disabled = true;
        }
        
        this.playSound('message_send');
    }

    showModal(modalId) {
        const backdrop = document.getElementById('modal-backdrop');
        const modal = document.getElementById(modalId);
        
        if (backdrop && modal) {
            backdrop.classList.remove('hidden');
            modal.classList.remove('hidden');
            
            // Focus management
            const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            firstFocusable?.focus();
        }
    }

    hideModal() {
        const backdrop = document.getElementById('modal-backdrop');
        const modals = backdrop?.querySelectorAll('.modal');
        
        if (backdrop) {
            backdrop.classList.add('hidden');
            modals?.forEach(modal => modal.classList.add('hidden'));
        }
    }

    // === CONTACTS ===
    initContacts() {
        const searchInput = document.getElementById('contact-search');
        const addBtn = document.getElementById('add-contact');
        const scanBtn = document.getElementById('scan-qr');
        
        searchInput?.addEventListener('input', (e) => {
            this.filterContacts(e.target.value);
        });
        
        addBtn?.addEventListener('click', () => {
            this.showAddContactDialog();
        });
        
        scanBtn?.addEventListener('click', () => {
            this.startQRScanner();
        });
    }

    filterContacts(query) {
        const contactCards = document.querySelectorAll('.contact-card');
        contactCards.forEach(card => {
            const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const visible = name.includes(query.toLowerCase());
            card.style.display = visible ? 'flex' : 'none';
        });
    }

    showAddContactDialog() {
        this.showToast('Add contact functionality would open a modal', 'info');
    }

    startQRScanner() {
        this.showToast('QR scanner would access camera', 'info');
    }

    // === SETTINGS ===
    initSettings() {
        this.setupSettingsTabs();
        this.setupToggles();
        this.setupVolumeControl();
    }

    setupSettingsTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.settings-panel');
        
        tabBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                const targetTab = newBtn.getAttribute('data-tab');
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                newBtn.classList.add('active');
                
                // Show corresponding panel
                panels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `${targetTab}-panel`) {
                        panel.classList.add('active');
                    }
                });
            });
        });
    }

    setupToggles() {
        const toggles = document.querySelectorAll('input[type="checkbox"]');
        toggles.forEach(toggle => {
            // Load saved setting
            const setting = toggle.id;
            if (this.settings[setting] !== undefined) {
                toggle.checked = this.settings[setting];
            }
            
            // Save on change
            toggle.addEventListener('change', () => {
                this.settings[setting] = toggle.checked;
                this.saveSettings();
                this.applySettings();
            });
        });
    }

    setupVolumeControl() {
        const volumeSlider = document.getElementById('volume-slider');
        const testSoundBtn = document.getElementById('test-sound');
        
        if (volumeSlider) {
            volumeSlider.value = this.settings.volume || 50;
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume = parseInt(e.target.value);
                this.saveSettings();
            });
        }
        
        if (testSoundBtn) {
            const newTestBtn = testSoundBtn.cloneNode(true);
            testSoundBtn.parentNode.replaceChild(newTestBtn, testSoundBtn);
            newTestBtn.addEventListener('click', () => {
                this.playSound('message_send');
            });
        }
    }

    // === SOUND SYSTEM ===
    setupSounds() {
        this.soundEnabled = this.settings.soundEffects || false;
        this.volume = (this.settings.volume || 50) / 100;
    }

    playSound(eventType) {
        if (!this.soundEnabled) return;
        
        // Use the existing audio element for now, in production would have multiple sound files
        const audio = document.getElementById('audio-send');
        if (audio) {
            audio.volume = this.volume;
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    // === PWA FUNCTIONALITY ===
    setupPWA() {
        const installBtn = document.getElementById('install-pwa');
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (installBtn) {
                installBtn.style.display = 'block';
            }
        });

        installBtn?.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showToast('App installed successfully!', 'success');
            }
            
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .catch(err => console.log('Service Worker registration failed:', err));
        }
    }

    // === STORAGE ===
    async saveKeys(keys) {
        // In production, would encrypt keys before storing
        const keystore = {
            keyPair: await this.exportKeyPair(keys.keyPair),
            signingKeyPair: await this.exportKeyPair(keys.signingKeyPair),
            fingerprint: keys.fingerprint
        };
        
        localStorage.setItem('eternal-veil-keys', JSON.stringify(keystore));
    }

    async loadKeys() {
        try {
            const stored = localStorage.getItem('eternal-veil-keys');
            if (!stored) return null;
            
            const keystore = JSON.parse(stored);
            const keyPair = await this.importKeyPair(keystore.keyPair);
            const signingKeyPair = await this.importKeyPair(keystore.signingKeyPair);
            
            return {
                keyPair,
                signingKeyPair,
                fingerprint: keystore.fingerprint
            };
        } catch (error) {
            console.error('Failed to load keys:', error);
            return null;
        }
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem('eternal-veil-settings');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    saveSettings() {
        localStorage.setItem('eternal-veil-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        if (this.settings.reducedMotion) {
            document.body.style.setProperty('--anim-fast', '0ms');
            document.body.style.setProperty('--anim-medium', '0ms');
            document.body.style.setProperty('--anim-long', '0ms');
        }
        
        this.soundEnabled = this.settings.soundEffects || false;
        this.volume = (this.settings.volume || 50) / 100;
    }

    // === UTILITIES ===
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 6 seconds (except errors)
        if (type !== 'error') {
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 6000);
        }
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.remove();
            }
        });
    }

    loadDemoData() {
        // Add demo contact
        this.contacts.set('demo', {
            id: 'demo',
            name: 'Alice Cryptographer',
            fingerprint: { emoji: '🔐🌟⚡🦋🌙🔥💎🎭', hex: 'A1B2:C3D4:E5F6:7890' },
            verified: true,
            online: true
        });
    }

    // === EVENT LISTENERS ===
    setupEventListeners() {
        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop') || 
                e.target.classList.contains('modal-close')) {
                this.hideModal();
            }
        });

        // Keyboard handlers
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // Handle reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addListener((e) => {
            if (e.matches) {
                this.settings.reducedMotion = true;
                this.applySettings();
            }
        });
    }
}

// Add CSS for animations not in main stylesheet
const additionalStyles = `
@keyframes message-burn {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.05); filter: blur(2px); }
    100% { opacity: 0; transform: scale(0.95); filter: blur(4px) hue-rotate(180deg); }
}

.burn-timer {
    font-size: 12px;
    color: #d98a00;
    margin-top: 4px;
    text-align: right;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.eternalVeil = new EternalVeil();
    });
} else {
    window.eternalVeil = new EternalVeil();
}