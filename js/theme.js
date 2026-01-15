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

            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user's response
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Theme.init());
