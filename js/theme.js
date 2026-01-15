/**
 * Theme and PWA functionality for Lenny Distilled
 */

const Theme = {
    /**
     * Initialize theme and PWA features
     */
    init() {
        this.initTheme();
        this.initPWA();
    },

    /**
     * Initialize theme toggle
     */
    initTheme() {
        const toggle = document.getElementById('themeToggle');

        // Check for saved preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (systemPrefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Toggle handler
        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            // Track theme toggle
            if (typeof umami !== 'undefined') {
                umami.track('theme-toggle', { theme: newTheme });
            }

            // Enable transition for smooth fade
            document.documentElement.classList.add('theme-transition');

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Update meta theme-color for mobile browsers
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', newTheme === 'dark' ? '#1a1a1a' : '#f47c55');
            }

            // Remove transition class after animation completes
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 300);
        });

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    },

    /**
     * Initialize PWA install functionality
     */
    initPWA() {
        const installButtons = document.getElementById('installButtons');
        const installIos = document.getElementById('installIos');
        const installAndroid = document.getElementById('installAndroid');
        const installModal = document.getElementById('installModal');
        const installModalClose = document.getElementById('installModalClose');

        // Check if running as standalone (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;

        if (isStandalone) {
            // Already installed as PWA, don't show buttons
            return;
        }

        // Detect platform
        const platform = this.detectPlatform();

        // Only show on mobile
        if (platform === 'ios') {
            this.setupIOS(installButtons, installIos, installModal, installModalClose);
        } else if (platform === 'android') {
            this.setupAndroid(installButtons, installAndroid);
        }
        // Desktop: don't show install buttons
    },

    /**
     * Detect platform
     */
    detectPlatform() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // iOS detection
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return 'ios';
        }

        // Android detection
        if (/android/i.test(userAgent)) {
            return 'android';
        }

        return 'desktop';
    },

    /**
     * Setup iOS install button
     */
    setupIOS(container, button, modal, closeButton) {
        // Only show in Safari (other browsers don't support Add to Home Screen)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (!isSafari) {
            return;
        }

        container.style.display = 'flex';
        button.style.display = 'inline-flex';

        // Show modal with instructions
        button.addEventListener('click', () => {
            // Track iOS install attempt
            if (typeof umami !== 'undefined') {
                umami.track('pwa-install', { platform: 'ios' });
            }
            modal.style.display = 'flex';
        });

        // Close modal
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    },

    /**
     * Setup Android install button
     */
    setupAndroid(container, button) {
        let deferredPrompt = null;

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Save the event for later
            deferredPrompt = e;
            // Show the install button
            container.style.display = 'flex';
            button.style.display = 'inline-flex';
        });

        // Handle install button click
        button.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            // Track Android install attempt
            if (typeof umami !== 'undefined') {
                umami.track('pwa-install', { platform: 'android' });
            }

            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user's response
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                if (typeof umami !== 'undefined') {
                    umami.track('pwa-installed', { platform: 'android' });
                }
                container.style.display = 'none';
            }

            // Clear the deferred prompt
            deferredPrompt = null;
        });

        // Hide button if app is installed
        window.addEventListener('appinstalled', () => {
            container.style.display = 'none';
            deferredPrompt = null;
        });
    }
};

/**
 * Share functionality
 */
const Share = {
    init() {
        this.initShareButtons();
    },

    initShareButtons() {
        // Native share buttons (mobile) - both header icons and footer buttons
        const nativeBtns = document.querySelectorAll('.share-native');
        nativeBtns.forEach(btn => {
            if (navigator.share) {
                btn.addEventListener('click', async () => {
                    try {
                        await navigator.share({
                            title: document.title,
                            url: window.location.href
                        });
                    } catch (err) {
                        // User cancelled or error
                    }
                });
            }
        });

        // Copy link buttons - both header icons and footer buttons
        const copyBtns = document.querySelectorAll('.share-copy');
        copyBtns.forEach(copyBtn => {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    copyBtn.classList.add('copied');
                    const originalHTML = copyBtn.innerHTML;
                    const isIcon = copyBtn.classList.contains('share-icon');
                    // For icons, just show checkmark; for buttons, show "Copied" text
                    copyBtn.innerHTML = isIcon
                        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
                        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Copied';
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = originalHTML;
                    }, 2000);
                } catch (err) {
                    // Fallback for older browsers
                    const input = document.createElement('input');
                    input.value = window.location.href;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                }
            });
        });
    }
};

/**
 * Footer quip cycling with split-flap display effect
 */
const FooterQuip = {
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?.,-\'',
    shuffleInterval: null,
    isShuffling: false,

    quips: [
        // The Side Project Addict
        "Side project #47. Yes, I'm counting.",
        "Built instead of finishing the other 99 things on my list.",
        "Another day, another domain purchase.",
        "I'll definitely finish this one. (I say, every time.)",

        // The Flow State Zombie
        "Built at 3am because Claude doesn't need sleep and apparently neither do I.",
        "My sleep schedule died so this could live.",
        "Discovered it was 4am. Worth it.",
        "Fueled by mass amounts of tea and questionable life choices.",

        // The Claude Collaboration
        "Claude wrote the code. I approved the PRs. We're both in denial about who did more.",
        "Pair programmed with an AI that doesn't judge my variable names.",
        "Built with Claude while questioning if I'm the copilot now.",
        "Claude and I finished each other's... functions.",

        // Dry/Meta
        "This footer changes on click. You're welcome for the dopamine.",
        "Keep clicking. I put way too much effort into these.",
        "You're still clicking? I respect the commitment.",
        "Wow, you really have a footer fetish.",
        "Achievement unlocked: Footer Explorer.",
        "There are more. But I won't tell you how many.",
        "You've seen all of them. Just kidding, keep going.",
    ],

    init() {
        const quipElement = document.getElementById('footerQuip');
        const textElement = document.getElementById('quipText');

        if (!quipElement || !textElement) return;

        // Get saved position or start at 0
        let currentIndex = parseInt(localStorage.getItem('quipIndex') || '0', 10);

        // Show the current quip
        textElement.textContent = this.quips[currentIndex % this.quips.length];

        quipElement.addEventListener('click', () => {
            // Move to next quip
            currentIndex = (currentIndex + 1) % this.quips.length;
            localStorage.setItem('quipIndex', currentIndex.toString());

            // Split-flap shuffle to new quip
            if (!this.isShuffling) {
                this.shuffleText(textElement, this.quips[currentIndex]);
            }
        });
    },

    /**
     * Split-flap display shuffle effect - fast & snappy
     */
    shuffleText(element, finalText) {
        this.isShuffling = true;
        let iterations = 0;
        const totalIterations = 12; // ~240ms total

        this.shuffleInterval = setInterval(() => {
            element.textContent = finalText
                .split('')
                .map((char, index) => {
                    // Settle characters progressively from left to right
                    const settlePoint = (iterations / totalIterations) * finalText.length;
                    if (index < settlePoint) {
                        return finalText[index];
                    }
                    // Keep spaces as spaces
                    if (char === ' ') return ' ';
                    // Random character
                    return this.chars[Math.floor(Math.random() * this.chars.length)];
                })
                .join('');

            iterations++;

            if (iterations >= totalIterations) {
                clearInterval(this.shuffleInterval);
                element.textContent = finalText;
                this.isShuffling = false;
            }
        }, 20);
    }
};

/**
 * Keyboard Navigation
 */
const KeyboardNav = {
    focusedIndex: -1,
    items: [],

    init() {
        // Get navigable items (links in lists)
        this.items = Array.from(document.querySelectorAll('.nav-item'));
        if (this.items.length === 0) return;

        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    handleKeydown(e) {
        // Don't interfere with input fields or modals
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (document.querySelector('.shortcuts-modal.visible')) return;

        switch (e.key) {
            case 'ArrowDown':
            case 'j':
                e.preventDefault();
                this.moveFocus(1);
                break;
            case 'ArrowUp':
            case 'k':
                e.preventDefault();
                this.moveFocus(-1);
                break;
            case 'Enter':
                if (this.focusedIndex >= 0 && this.items[this.focusedIndex]) {
                    this.items[this.focusedIndex].click();
                }
                break;
            case 'Backspace':
                e.preventDefault();
                // Go back up the tree
                const breadcrumbLinks = document.querySelectorAll('.breadcrumb a');
                if (breadcrumbLinks.length > 0) {
                    breadcrumbLinks[breadcrumbLinks.length - 1].click();
                }
                break;
        }
    },

    moveFocus(delta) {
        // Track first keyboard nav usage per session
        if (!this.tracked && typeof umami !== 'undefined') {
            umami.track('delight-keyboard-nav');
            this.tracked = true;
        }

        // Remove current focus
        if (this.focusedIndex >= 0 && this.items[this.focusedIndex]) {
            this.items[this.focusedIndex].classList.remove('kb-focused');
        }

        // Calculate new index
        if (this.focusedIndex === -1) {
            this.focusedIndex = delta > 0 ? 0 : this.items.length - 1;
        } else {
            this.focusedIndex += delta;
            if (this.focusedIndex < 0) this.focusedIndex = this.items.length - 1;
            if (this.focusedIndex >= this.items.length) this.focusedIndex = 0;
        }

        // Apply new focus
        const item = this.items[this.focusedIndex];
        if (item) {
            item.classList.add('kb-focused');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
};

/**
 * Shortcuts Modal
 */
const ShortcutsModal = {
    init() {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'shortcuts-modal';
        modal.id = 'shortcutsModal';
        modal.innerHTML = `
            <div class="shortcuts-content">
                <h3>
                    Keyboard Shortcuts
                    <button class="shortcuts-close" aria-label="Close">&times;</button>
                </h3>
                <div class="shortcuts-list">
                    <div class="shortcut-row">
                        <span class="shortcut-desc">Navigate up/down</span>
                        <span class="shortcut-keys">
                            <kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd>
                            <span style="color: var(--color-text-tertiary); margin: 0 0.25rem;">or</span>
                            <kbd class="kbd">j</kbd><kbd class="kbd">k</kbd>
                        </span>
                    </div>
                    <div class="shortcut-row">
                        <span class="shortcut-desc">Go deeper</span>
                        <span class="shortcut-keys"><kbd class="kbd">Enter</kbd></span>
                    </div>
                    <div class="shortcut-row">
                        <span class="shortcut-desc">Go back</span>
                        <span class="shortcut-keys"><kbd class="kbd">←</kbd></span>
                    </div>
                    <div class="shortcut-row">
                        <span class="shortcut-desc">Random insight</span>
                        <span class="shortcut-keys"><kbd class="kbd">r</kbd></span>
                    </div>
                    <div class="shortcut-row">
                        <span class="shortcut-desc">Show shortcuts</span>
                        <span class="shortcut-keys"><kbd class="kbd">?</kbd></span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape') {
                this.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide();
        });

        modal.querySelector('.shortcuts-close').addEventListener('click', () => this.hide());

        // Shortcuts hint button in nav-row
        const hintBtn = document.getElementById('shortcutsHint');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        const modal = document.getElementById('shortcutsModal');
        const wasHidden = !modal.classList.contains('visible');
        modal.classList.toggle('visible');

        // Track when modal is opened
        if (wasHidden && typeof umami !== 'undefined') {
            umami.track('delight-shortcuts-opened');
        }
    },

    hide() {
        const modal = document.getElementById('shortcutsModal');
        modal.classList.remove('visible');
    }
};

/**
 * Feeling Lucky - Random Insight
 */
const FeelingLucky = {
    insights: [],

    init() {
        const button = document.getElementById('feelingLucky');
        if (!button) return;

        // Collect all insight URLs from the page if available, or use data attribute
        const insightsData = button.dataset.insights;
        if (insightsData) {
            this.insights = JSON.parse(insightsData);
        }

        button.addEventListener('click', () => this.goToRandom());

        // Also bind 'r' key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && !e.target.matches('input, textarea')) {
                if (!document.querySelector('.shortcuts-modal.visible')) {
                    this.goToRandom();
                }
            }
        });
    },

    goToRandom() {
        if (this.insights.length === 0) return;
        const randomIndex = Math.floor(Math.random() * this.insights.length);
        window.location.href = this.insights[randomIndex];
    }
};

/**
 * Copy Quote functionality
 */
const CopyQuote = {
    init() {
        const button = document.getElementById('copyQuote');
        if (!button) return;

        button.addEventListener('click', async () => {
            const quote = button.dataset.quote;
            const url = window.location.href;
            const text = `"${quote}"\n— from Lenny's Podcast\n${url}`;

            try {
                await navigator.clipboard.writeText(text);
                button.classList.add('copied');
                const original = button.innerHTML;
                button.innerHTML = '✓ Copied';
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = original;
                }, 2000);

                if (typeof umami !== 'undefined') {
                    umami.track('copy-quote');
                }
            } catch (err) {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
        });
    }
};

/**
 * Easter Eggs - Doom cheat codes
 */
const EasterEggs = {
    buffer: '',
    godMode: false,
    fullAmmo: false,

    init() {
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('input, textarea')) return;

            this.buffer += e.key.toLowerCase();
            // Keep buffer short
            if (this.buffer.length > 10) {
                this.buffer = this.buffer.slice(-10);
            }

            // Check for cheat codes
            if (this.buffer.includes('iddqd') && !this.godMode) {
                this.activateGodMode();
            }
            if (this.buffer.includes('idkfa') && !this.fullAmmo) {
                this.activateFullAmmo();
            }
        });
    },

    clearKeyboardFocus() {
        // Clear any keyboard navigation highlight
        document.querySelectorAll('.kb-focused').forEach(el => el.classList.remove('kb-focused'));
        KeyboardNav.focusedIndex = -1;
    },

    activateGodMode() {
        this.godMode = true;
        this.clearKeyboardFocus();
        const doomguy = document.getElementById('doomguy');
        if (doomguy) {
            doomguy.src = '/img/doomgod.gif';
            doomguy.title = 'God Mode Activated';
            doomguy.classList.add('god-mode');
        }
        if (typeof umami !== 'undefined') {
            umami.track('delight-easter-egg', { type: 'iddqd-godmode' });
        }
        this.buffer = '';
    },

    activateFullAmmo() {
        this.fullAmmo = true;
        this.clearKeyboardFocus();
        const ammoText = document.getElementById('fullAmmo');
        if (ammoText) {
            ammoText.style.display = 'inline';
        }
        if (typeof umami !== 'undefined') {
            umami.track('delight-easter-egg', { type: 'idkfa-fullammo' });
        }
        this.buffer = '';
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Share.init();
    FooterQuip.init();
    KeyboardNav.init();
    ShortcutsModal.init();
    FeelingLucky.init();
    CopyQuote.init();
    EasterEggs.init();
});
