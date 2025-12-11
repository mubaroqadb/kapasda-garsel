/**
 * Environment Configuration System
 * Handles different environments: development, production, GitHub Pages
 * Provides centralized configuration for Supabase and application settings
 */

// Detect current environment
function detectEnvironment() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // GitHub Pages environment detection
    if (hostname.endsWith('.github.io') || hostname === 'localhost') {
        return 'github-pages';
    }

    // Production environment detection
    if (hostname.includes('kapasda') || hostname.includes('garut')) {
        return 'production';
    }

    // Default to development
    return 'development';
}

// Environment-specific configurations
const ENV_CONFIGS = {
    'development': {
        name: 'development',
        debug: true,
        supabase: {
            url: 'https://vedwbuflttjrnhueymer.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE'
        },
        api: {
            baseUrl: 'http://localhost:3000/api',
            timeout: 10000
        },
        features: {
            analytics: false,
            errorReporting: false
        }
    },
    'github-pages': {
        name: 'github-pages',
        debug: false,
        supabase: {
            url: 'https://vedwbuflttjrnhueymer.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE'
        },
        api: {
            baseUrl: 'https://kapasda-garsel.github.io/api',
            timeout: 15000
        },
        features: {
            analytics: true,
            errorReporting: true
        },
        githubPages: {
            basePath: '/kapasda-garsel/',
            repo: 'kapasda-garsel'
        }
    },
    'production': {
        name: 'production',
        debug: false,
        supabase: {
            url: 'https://vedwbuflttjrnhueymer.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE'
        },
        api: {
            baseUrl: 'https://api.kapasda-garut.com/api',
            timeout: 15000
        },
        features: {
            analytics: true,
            errorReporting: true
        }
    }
};

// Initialize and export configuration
const config = {
    env: detectEnvironment(),
    ...ENV_CONFIGS[detectEnvironment()],

    // Helper methods
    isDevelopment: function() {
        return this.env === 'development';
    },
    isGitHubPages: function() {
        return this.env === 'github-pages';
    },
    isProduction: function() {
        return this.env === 'production';
    },
    getBasePath: function() {
        return this.githubPages ? this.githubPages.basePath : '/';
    },
    getFullUrl: function(path) {
        const basePath = this.getBasePath();
        return `${window.location.origin}${basePath}${path}`;
    }
};

// Log configuration in development mode
if (config.debug) {
    console.log('📋 Environment Configuration:', config);
    console.log(`🌍 Running in ${config.env} environment`);
}

// Export configuration globally
window.appConfig = config;

// Also export for ES modules
export default config;