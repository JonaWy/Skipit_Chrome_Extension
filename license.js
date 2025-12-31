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

// Free tier platforms (now all platforms)
const FREE_PLATFORMS = [
  "netflix",
  "youtube",
  "disney",
  "amazon",
  "crunchyroll",
  "appletv",
  "paramount",
];

// Speed limits (unrestricted)
const SPEED_MIN = 0.25;
const SPEED_MAX = 4.0;

// ============================================
// LICENSE MODULE
// ============================================

const License = {
  isPremium: true, // Always premium/free
  isLoaded: true,

  /**
   * Initialize license checking
   * Call this once when extension loads
   */
  async init() {
    this.isPremium = true;
    this.isLoaded = true;
  },

  /**
   * Check license status
   */
  async check() {
    return true;
  },

  /**
   * Fallback: Check license from local storage
   */
  async checkFromStorage() {
    return true;
  },

  /**
   * Open payment/upgrade page -> Redirect to donation
   */
  openPaymentPage() {
    // TODO: Add donation link here
    chrome.tabs.create({
      url: "https://www.buymeacoffee.com/", // Placeholder
    });
  },

  /**
   * Notify all parts of extension about license change
   */
  notifyLicenseChange() {
    chrome.runtime
      .sendMessage({
        action: "licenseChanged",
        isPremium: true,
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
   */
  canUseSpeed(speed) {
    return true;
  },

  /**
   * Clamp speed to allowed range
   */
  clampSpeed(speed) {
    return Math.max(SPEED_MIN, Math.min(SPEED_MAX, speed));
  },

  /**
   * Get speed limits
   */
  getSpeedLimits() {
    return { min: SPEED_MIN, max: SPEED_MAX };
  },

  /**
   * Check if user can use the extension on a specific platform
   */
  canUsePlatform(platform) {
    return true;
  },

  /**
   * Check if user can use Auto-Skip on a specific platform
   */
  canUseAutoSkip(platform) {
    return true;
  },

  /**
   * Check if user can customize presets
   */
  canCustomizePresets() {
    return true;
  },

  /**
   * Check if user can customize keyboard shortcuts
   */
  canCustomizeShortcuts() {
    return true;
  },

  /**
   * Get list of platforms available
   */
  getAvailablePlatforms() {
    return FREE_PLATFORMS;
  },
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = License;
}
