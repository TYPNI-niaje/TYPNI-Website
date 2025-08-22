// Global authentication handler for all pages
// This script manages authentication state across the entire website

(function() {
    'use strict';

    // Global auth state
    window.typniAuth = {
        user: null,
        initialized: false,
        callbacks: []
    };

    // Initialize global auth when DOM is ready
    document.addEventListener('DOMContentLoaded', async function() {
        await initializeGlobalAuth();
    });

    async function initializeGlobalAuth() {
        try {
            // Wait for Supabase UMD library to be available
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window.supabase && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.supabase) {
                console.warn('Supabase UMD library not available');
                return;
            }

            // Initialize Supabase client if not already done
            if (!window.supabaseClient) {
                const supabaseUrl = 'https://lkgqmfqtxpbvwrsguwka.supabase.co';
                const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZ3FtZnF0eHBidndyc2d1d2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODk1MjYsImV4cCI6MjA2MzE2NTUyNn0.bMKMVLW-dwVDfhXFIBr-dxbB9yFZ-isNb5v2VrjoqQA';
                
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storageKey: 'typni_auth',
                        storage: window.localStorage,
                        flowType: 'pkce'
                    }
                });
            }

            // Check current auth state
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (!error && session?.user) {
                window.typniAuth.user = session.user;
                console.log('User authenticated:', session.user.email);
            } else {
                window.typniAuth.user = null;
                console.log('No user session found');
            }

            // Set up auth state change listener
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('Global auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    window.typniAuth.user = session.user;
                    updateNavigation();
                    // Call any registered callbacks
                    window.typniAuth.callbacks.forEach(callback => {
                        try {
                            callback('SIGNED_IN', session.user);
                        } catch (e) {
                            console.error('Error in auth callback:', e);
                        }
                    });
                } else if (event === 'SIGNED_OUT') {
                    window.typniAuth.user = null;
                    updateNavigation();
                    // Call any registered callbacks
                    window.typniAuth.callbacks.forEach(callback => {
                        try {
                            callback('SIGNED_OUT', null);
                        } catch (e) {
                            console.error('Error in auth callback:', e);
                        }
                    });
                }
            });

            window.typniAuth.initialized = true;
            updateNavigation();
            
        } catch (error) {
            console.error('Error initializing global auth:', error);
        }
    }

    // Update navigation based on auth state
    function updateNavigation() {
        const authNavLink = document.getElementById('auth-nav-link');
        const authNavText = document.getElementById('auth-nav-text');
        
        if (!authNavLink || !authNavText) {
            // Navigation elements not found, might be before header is loaded
            return;
        }

        if (window.typniAuth.user) {
            // User is logged in - show profile link
            authNavLink.href = 'profile.html';
            authNavText.textContent = 'My Profile';
            authNavLink.className = 'fas fa-user-circle';
        } else {
            // User is not logged in - show login link
            authNavLink.href = 'login.html';
            authNavText.textContent = 'My Account';
            authNavLink.className = 'fas fa-user';
        }
    }

    // Public API for other scripts to use
    window.typniAuth.onAuthChange = function(callback) {
        if (typeof callback === 'function') {
            window.typniAuth.callbacks.push(callback);
        }
    };

    window.typniAuth.isAuthenticated = function() {
        return !!window.typniAuth.user;
    };

    window.typniAuth.getCurrentUser = function() {
        return window.typniAuth.user;
    };

    window.typniAuth.signOut = async function() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    // Update navigation when header is loaded dynamically
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const result = originalFetch.apply(this, args);
        
        // Check if this is a header fetch
        if (args[0] && args[0].includes('header.html')) {
            result.then(response => {
                if (response.ok) {
                    // Give the header time to render, then update navigation
                    setTimeout(() => {
                        updateNavigation();
                    }, 100);
                }
            });
        }
        
        return result;
    };

})();
