/**
 * Robust Supabase Client Initialization with Environment Configuration
 * Fixes race condition where DOMContentLoaded fires before Supabase library loads
 * Implements retry logic with timeout and proper error handling
 * Uses centralized configuration from appConfig
 */

// State tracking
let initializationAttempted = false;
let retryCount = 0;
let initializationTimeout = null;

// Main initialization function
function initializeSupabase() {
    // Check if Supabase library and config are available
    if (typeof supabase !== 'undefined' && typeof window.appConfig !== 'undefined') {
        try {
            const config = window.appConfig;
            console.log(`🚀 Initializing Supabase for ${config.env} environment`);

            // Create client using environment-specific configuration
            window.supabase = supabase.createClient(
                config.supabase.url,
                config.supabase.anonKey
            );

            console.log('✅ Supabase client initialized successfully');
            console.log(`📡 Supabase URL: ${config.supabase.url}`);

            // Clean up
            clearTimeout(initializationTimeout);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Supabase client:', error);
            return false;
        }
    }
    return false;
}

// Retry mechanism with timeout
function retryInitialization() {
    const config = window.appConfig || { env: 'unknown' };
    const maxRetries = config.isDevelopment() ? 50 : 30; // More retries in development
    const retryInterval = config.isDevelopment() ? 200 : 300; // Faster retries in development

    if (retryCount >= maxRetries) {
        console.error(`❌ Supabase initialization timed out after ${Math.floor(maxRetries * retryInterval / 1000)} seconds - library not loaded`);
        clearTimeout(initializationTimeout);
        return;
    }

    retryCount++;
    console.log(`🔄 Retry ${retryCount}/${maxRetries} - Waiting for Supabase library...`);

    // Set timeout for next retry
    initializationTimeout = setTimeout(function() {
        if (initializeSupabase()) {
            // Success - initialization complete
            return;
        }
        // Continue retrying
        retryInitialization();
    }, retryInterval);
}

// Wait for DOMContentLoaded, then start initialization process
document.addEventListener('DOMContentLoaded', function() {
    if (initializationAttempted) {
        console.log('📝 DOMContentLoaded fired after initialization attempt');
        return;
    }

    initializationAttempted = true;
    console.log('🚀 Starting Supabase initialization...');

    // Try immediate initialization first
    if (!initializeSupabase()) {
        // If immediate initialization fails, start retry process
        retryInitialization();
    }
});

// Handle case where script is loaded after DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (!initializationAttempted) {
        initializationAttempted = true;
        console.log('🚀 Starting Supabase initialization (DOM already ready)...');

        if (!initializeSupabase()) {
            retryInitialization();
        }
    }
}

// Provide initialization status for other modules
window.supabaseInitialization = {
    isInitialized: function() {
        return typeof window.supabase !== 'undefined';
    },
    getStatus: function() {
        if (typeof window.supabase !== 'undefined') {
            return 'initialized';
        } else if (initializationAttempted) {
            const config = window.appConfig || {};
            const maxRetries = config.isDevelopment ? 50 : 30;
            return retryCount >= maxRetries ? 'failed' : 'pending';
        } else {
            return 'not_started';
        }
    },
    onInitialized: function(callback) {
        if (typeof window.supabase !== 'undefined') {
            callback();
        } else {
            const checkInterval = setInterval(function() {
                if (typeof window.supabase !== 'undefined') {
                    clearInterval(checkInterval);
                    callback();
                }
            }, 100);
        }
    },
    getEnvironment: function() {
        return window.appConfig ? window.appConfig.env : 'unknown';
    }
};