/**
 * SkipIt License Management
 *
 * Handles premium license validation and feature gates.
 * Uses ExtensionPay for payment processing.
 *
 * Setup Instructions:
 * 1. Create account at https://extensionpay.com
 * 2. Register your extension and get API key
 * 3. Replace 'YOUR_EXTENSION_ID' below with your ExtensionPay extension ID
 * 4. Download ExtPay.js from ExtensionPay and add to your extension
 */

// ============================================
// CONFIGURATION
// ============================================

// Replace with your ExtensionPay extension ID after registration
const EXTENSIONPAY_ID = "skipit"; // TODO: Replace with actual ID from ExtensionPay

// Free tier platforms (available without payment)
const FREE_PLATFORMS = ["netflix", "youtube"];

// Free tier speed limits
const FREE_SPEED_MIN = 1.0;
const FREE_SPEED_MAX = 2.0;

// Premium speed limits
const PREMIUM_SPEED_MIN = 0.25;
const PREMIUM_SPEED_MAX = 4.0;

// ============================================
// LICENSE MODULE
// ============================================

const License = {
  isPremium: false,
  isLoaded: false,
  extpay: null,

  /**
   * Initialize license checking
   * Call this once when extension loads
   */
  async init() {
    try {
      // Check if ExtPay is available (loaded from ExtPay.js)
      if (typeof ExtPay !== "undefined") {
        this.extpay = ExtPay(EXTENSIONPAY_ID);
        this.extpay.startBackground(); // Required for background script

        // Check license status
        await this.check();

        // Listen for license changes (e.g., user upgrades)
        this.extpay.onPaid.addListener(() => {
          this.isPremium = true;
          this.notifyLicenseChange();
        });
      } else {
        // ExtPay not loaded - fallback to storage-based check
        // This allows testing without ExtensionPay setup
        await this.checkFromStorage();
      }

      this.isLoaded = true;
    } catch (error) {
      console.error("[SkipIt] License init error:", error);
      this.isLoaded = true;
      // Default to free tier on error
      this.isPremium = false;
    }
  },

  /**
   * Check license status with ExtensionPay
   */
  async check() {
    if (!this.extpay) {
      return this.checkFromStorage();
    }

    try {
      const user = await this.extpay.getUser();
      this.isPremium = user.paid === true;

      // Cache in storage for offline/content script access
      await chrome.storage.local.set({
        premiumStatus: this.isPremium,
        lastCheck: Date.now(),
      });

      return this.isPremium;
    } catch (error) {
      console.error("[SkipIt] License check error:", error);
      return this.checkFromStorage();
    }
  },

  /**
   * Fallback: Check license from local storage
   * Used when ExtPay is not available or for content scripts
   */
  async checkFromStorage() {
    try {
      const data = await chrome.storage.local.get([
        "premiumStatus",
        "debugPremium",
      ]);

      // Debug mode: Allow forcing premium for testing
      if (data.debugPremium === true) {
        this.isPremium = true;
        return true;
      }

      this.isPremium = data.premiumStatus === true;
      return this.isPremium;
    } catch (error) {
      this.isPremium = false;
      return false;
    }
  },

  /**
   * Open payment/upgrade page
   */
  openPaymentPage() {
    if (this.extpay) {
      this.extpay.openPaymentPage();
    } else {
      // Fallback: Open ExtensionPay website
      chrome.tabs.create({
        url: "https://extensionpay.com",
      });
    }
  },

  /**
   * Notify all parts of extension about license change
   */
  notifyLicenseChange() {
    chrome.runtime
      .sendMessage({
        action: "licenseChanged",
        isPremium: this.isPremium,
      })
      .catch(() => {
        // Ignore errors if no listeners
      });
  },

  // ============================================
  // FEATURE GATES
  // ============================================

  /**
   * Check if user can use a specific playback speed
   * Free: 1.0x - 2.0x
   * Premium: 0.25x - 4.0x
   */
  canUseSpeed(speed) {
    if (this.isPremium) return true;
    return speed >= FREE_SPEED_MIN && speed <= FREE_SPEED_MAX;
  },

  /**
   * Clamp speed to allowed range for user's tier
   */
  clampSpeed(speed) {
    if (this.isPremium) {
      return Math.max(PREMIUM_SPEED_MIN, Math.min(PREMIUM_SPEED_MAX, speed));
    }
    return Math.max(FREE_SPEED_MIN, Math.min(FREE_SPEED_MAX, speed));
  },

  /**
   * Get speed limits for current tier
   */
  getSpeedLimits() {
    if (this.isPremium) {
      return { min: PREMIUM_SPEED_MIN, max: PREMIUM_SPEED_MAX };
    }
    return { min: FREE_SPEED_MIN, max: FREE_SPEED_MAX };
  },

  /**
   * Check if user can use the extension on a specific platform
   * Free: Netflix, YouTube only
   * Premium: All platforms
   */
  canUsePlatform(platform) {
    if (this.isPremium) return true;
    return FREE_PLATFORMS.includes(platform);
  },

  /**
   * Check if user can use Auto-Skip on a specific platform
   * Free: Netflix, YouTube only
   * Premium: All platforms
   */
  canUseAutoSkip(platform) {
    if (this.isPremium) return true;
    return FREE_PLATFORMS.includes(platform);
  },

  /**
   * Check if user can customize presets
   * Free: No (uses default presets)
   * Premium: Yes
   */
  canCustomizePresets() {
    return this.isPremium;
  },

  /**
   * Check if user can customize keyboard shortcuts
   * Free: No (uses default shortcuts)
   * Premium: Yes
   */
  canCustomizeShortcuts() {
    return this.isPremium;
  },

  /**
   * Get list of platforms available for current tier
   */
  getAvailablePlatforms() {
    if (this.isPremium) {
      return [
        "netflix",
        "youtube",
        "disney",
        "amazon",
        "crunchyroll",
        "hbo",
        "appletv",
        "paramount",
        "peacock",
      ];
    }
    return FREE_PLATFORMS;
  },
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = License;
}
