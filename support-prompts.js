// Support Prompts System - Milestone-based support request system
// Implements a non-intrusive, trust-building approach to monetization

const SupportPrompts = {
  // Milestone definitions
  MILESTONES: {
    TIME_SAVED_30MIN: {
      id: 'timeSaved30min',
      threshold: 1800, // 30 minutes in seconds
      message: 'You\'ve saved over 30 minutes with SkipIt! 🎉',
    },
    SKIPS_50: {
      id: 'skips50',
      threshold: 50, // Combined intros + recaps
      message: 'You\'ve skipped 50+ intros and recaps! ⏩',
    },
    DAYS_14: {
      id: 'days14',
      threshold: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      message: 'You\'ve been using SkipIt for 2 weeks! 🎊',
    },
  },

  // Check if a milestone has been reached
  async checkMilestones() {
    const data = await chrome.storage.sync.get(['stats', 'supportPrompt']);
    const stats = data.stats || { introsSkipped: 0, recapsSkipped: 0, totalTimeSaved: 0 };
    const supportPrompt = data.supportPrompt || this.getDefaultPromptState();

    // Don't show if user has opted out
    if (supportPrompt.neverShow || supportPrompt.supported) {
      return null;
    }

    // Check if enough time has passed since last shown (at least 7 days)
    const now = Date.now();
    const lastShown = supportPrompt.lastShown || 0;
    const daysSinceLastShown = (now - lastShown) / (1000 * 60 * 60 * 24);
    
    if (lastShown > 0 && daysSinceLastShown < 7) {
      return null;
    }

    // Check if dismissed too many times (3 strikes rule)
    if (supportPrompt.dismissed >= 3) {
      // Automatically set neverShow
      await this.setNeverShow();
      return null;
    }

    // Check each milestone
    const milestones = [];

    // Time saved milestone
    if (!supportPrompt.milestones.timeSaved30min && 
        stats.totalTimeSaved >= this.MILESTONES.TIME_SAVED_30MIN.threshold) {
      milestones.push({
        ...this.MILESTONES.TIME_SAVED_30MIN,
        value: this.formatTimeSaved(stats.totalTimeSaved)
      });
    }

    // Skips milestone
    const totalSkips = (stats.introsSkipped || 0) + (stats.recapsSkipped || 0);
    if (!supportPrompt.milestones.skips50 && totalSkips >= this.MILESTONES.SKIPS_50.threshold) {
      milestones.push({
        ...this.MILESTONES.SKIPS_50,
        value: totalSkips
      });
    }

    // Days milestone (check installation date)
    const installDate = supportPrompt.installDate || now;
    const daysSinceInstall = now - installDate;
    if (!supportPrompt.milestones.days14 && 
        daysSinceInstall >= this.MILESTONES.DAYS_14.threshold) {
      milestones.push({
        ...this.MILESTONES.DAYS_14,
        value: Math.floor(daysSinceInstall / (1000 * 60 * 60 * 24))
      });
    }

    // Return the first milestone that hasn't been shown yet
    return milestones.length > 0 ? milestones[0] : null;
  },

  // Show support prompt for a specific milestone
  async showPrompt(milestone) {
    const container = document.createElement('div');
    container.id = 'supportPromptOverlay';
    container.className = 'support-prompt-overlay';
    
    container.innerHTML = `
      <div class="support-prompt-content">
        <button class="support-prompt-close" id="supportPromptClose">✕</button>
        <div class="support-prompt-icon">${this.getMilestoneIcon(milestone.id)}</div>
        <h3 class="support-prompt-title">${milestone.message}</h3>
        <p class="support-prompt-subtitle">
          You've saved ${milestone.value} with SkipIt!
        </p>
        <p class="support-prompt-question">Enjoying SkipIt?</p>
        <div class="support-prompt-buttons">
          <button class="support-prompt-btn support-prompt-btn-primary" id="supportPromptDonate">
            ☕ Buy me a coffee
          </button>
          <button class="support-prompt-btn support-prompt-btn-secondary" id="supportPromptLater">
            Maybe later
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Track that prompt was shown
    await this.trackPromptShown(milestone.id);

    // Add event listeners
    document.getElementById('supportPromptClose')?.addEventListener('click', () => {
      this.dismissPrompt(milestone.id);
    });

    document.getElementById('supportPromptDonate')?.addEventListener('click', () => {
      this.handleDonate();
    });

    document.getElementById('supportPromptLater')?.addEventListener('click', () => {
      this.postponePrompt(milestone.id);
    });

    // Fade in animation
    setTimeout(() => {
      container.classList.add('visible');
    }, 10);
  },

  // Get milestone icon
  getMilestoneIcon(milestoneId) {
    const icons = {
      timeSaved30min: '🎉',
      skips50: '⏩',
      days14: '🎊',
    };
    return icons[milestoneId] || '✨';
  },

  // Format time saved for display
  formatTimeSaved(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  },

  // Track that a prompt was shown
  async trackPromptShown(milestoneId) {
    const data = await chrome.storage.sync.get(['supportPrompt']);
    const supportPrompt = data.supportPrompt || this.getDefaultPromptState();

    supportPrompt.shown++;
    supportPrompt.lastShown = Date.now();
    supportPrompt.milestones[milestoneId] = true;

    await chrome.storage.sync.set({ supportPrompt });
  },

  // Handle donate button click
  async handleDonate() {
    const supportPrompt = await this.getPromptState();
    supportPrompt.supported = true;
    supportPrompt.supportedDate = Date.now();
    await chrome.storage.sync.set({ supportPrompt });

    // Open donation page
    chrome.tabs.create({ url: 'https://buymeacoffee.com/jonawy' });

    // Close prompt
    this.closePrompt();
  },

  // Handle postpone
  async postponePrompt(milestoneId) {
    const supportPrompt = await this.getPromptState();
    supportPrompt.postponed++;
    supportPrompt.lastShown = Date.now();
    // Mark milestone as shown but allow it to be shown again at next milestone
    supportPrompt.milestones[milestoneId] = true;
    await chrome.storage.sync.set({ supportPrompt });

    this.closePrompt();
  },

  // Handle dismiss (close button)
  async dismissPrompt(milestoneId) {
    const supportPrompt = await this.getPromptState();
    supportPrompt.dismissed++;
    supportPrompt.lastShown = Date.now();
    supportPrompt.milestones[milestoneId] = true;
    
    // After 3 dismissals, set neverShow
    if (supportPrompt.dismissed >= 3) {
      supportPrompt.neverShow = true;
    }

    await chrome.storage.sync.set({ supportPrompt });
    this.closePrompt();
  },

  // Close the prompt with animation
  closePrompt() {
    const overlay = document.getElementById('supportPromptOverlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  },

  // Set never show flag
  async setNeverShow() {
    const supportPrompt = await this.getPromptState();
    supportPrompt.neverShow = true;
    await chrome.storage.sync.set({ supportPrompt });
  },

  // Get current prompt state
  async getPromptState() {
    const data = await chrome.storage.sync.get(['supportPrompt']);
    return data.supportPrompt || this.getDefaultPromptState();
  },

  // Get default prompt state
  getDefaultPromptState() {
    return {
      shown: 0,
      dismissed: 0,
      postponed: 0,
      supported: false,
      neverShow: false,
      lastShown: 0,
      installDate: Date.now(),
      milestones: {
        timeSaved30min: false,
        skips50: false,
        days14: false,
      },
    };
  },

  // Initialize support prompts system
  async init() {
    // Ensure supportPrompt state exists
    const data = await chrome.storage.sync.get(['supportPrompt']);
    if (!data.supportPrompt) {
      await chrome.storage.sync.set({ 
        supportPrompt: this.getDefaultPromptState() 
      });
    }
  },

  // Check and potentially show prompt (call this from options page)
  async checkAndShow() {
    const milestone = await this.checkMilestones();
    if (milestone) {
      await this.showPrompt(milestone);
    }
  }
};

// Auto-initialize when script loads
SupportPrompts.init();

