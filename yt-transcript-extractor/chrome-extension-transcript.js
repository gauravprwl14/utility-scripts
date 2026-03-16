// ==UserScript==
// @name         YT Transcript Extractor
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Add a Copy button to export transcript, highlights, and metadata as JSON
// @author       Your Name
// @match        https://www.longcut.ai/analyze/*
// @match        https://www.longcut.ai
// @match        https://longcut.ai/analyze/*
// @icon         https://www.longcut.ai/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        buttonCheckInterval: 1000, // 1s interval for slow loads
        maxRetries: 240,            // retry for up to 4 minutes
        successFeedbackDuration: 2000
    };

    /**
     * Extract YouTube URL from page URL query parameter
     */
    function extractYouTubeUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const encodedUrl = urlParams.get('url');
            return encodedUrl ? decodeURIComponent(encodedUrl) : null;
        } catch (error) {
            console.error('Error extracting YouTube URL:', error);
            return null;
        }
    }

    /**
     * Extract video ID from URL
     */
    function extractVideoId(youtubeUrl) {
        if (!youtubeUrl) return null;
        try {
            const url = new URL(youtubeUrl);
            return url.searchParams.get('v') || url.pathname.split('/').pop();
        } catch (error) {
            console.error('Error extracting video ID:', error);
            return null;
        }
    }

    /**
     * Try to fetch title from YouTube oEmbed API (fallback)
     */
    async function fetchYouTubeTitleFromAPI(youtubeUrl) {
        if (!youtubeUrl) return null;
        
        try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
            const response = await fetch(oembedUrl);
            
            if (response.ok) {
                const data = await response.json();
                return data.title || null;
            }
        } catch (error) {
            console.warn('Could not fetch title from YouTube API:', error);
        }
        
        return null;
    }

    /**
     * Extract page title (video title)
     */
    function extractTitle() {
        // First, try to get title from YouTube iframe player (most reliable)
        try {
            // Find the YouTube iframe
            const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com/embed"]');
            for (const iframe of youtubeIframes) {
                try {
                    // Try to access iframe content (may fail due to CORS)
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        const ytTitleLink = iframeDoc.querySelector('a.ytp-title-link.yt-uix-sessionlink');
                        if (ytTitleLink && ytTitleLink.textContent.trim()) {
                            const title = ytTitleLink.textContent.trim();
                            if (title && title.length > 3 && !title.toLowerCase().includes('longcut')) {
                                console.log('📺 Found title from YouTube iframe player:', title);
                                return title;
                            }
                        }
                    }
                } catch (e) {
                    // CORS restriction - can't access iframe content
                    console.log('📺 Cannot access YouTube iframe due to CORS restrictions');
                }
            }
        } catch (error) {
            console.warn('Could not access YouTube iframe title:', error);
        }

        // Try document title first (often contains video title)
        if (document.title && document.title !== 'Longcut.ai' && !document.title.includes('Analyze')) {
            // Clean up the title (remove site name suffix if present)
            const cleanTitle = document.title.split('|')[0].split('-')[0].trim();
            if (cleanTitle && cleanTitle.length > 3) {
                return cleanTitle;
            }
            console.warn('Document title is not suitable, trying other selectors:', document.title);
        }


        // Try multiple selectors for title on the page
        const titleSelectors = [
            'h1',
            'h2',
            '[class*="title"]',
            '[class*="heading"]',
            'meta[property="og:title"]',
            'meta[name="twitter:title"]',
            'meta[name="title"]'
        ];

        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const title = selector.includes('meta') 
                    ? element.getAttribute('content') 
                    : element.textContent.trim();
                
                // Validate title is meaningful
                if (title && title.length > 3 && !title.toLowerCase().includes('longcut') && !title.includes('Sign in')) {
                    return title;
                }
            }
        }

        // Try to find YouTube video title in embedded iframe or links
        const youtubeLink = document.querySelector('a[href*="youtube.com/watch"]');
        if (youtubeLink && youtubeLink.textContent.trim()) {
            return youtubeLink.textContent.trim();
        }

        // Try to extract from any heading-like elements
        const headings = document.querySelectorAll('h1, h2, h3, [class*="font-bold"], [class*="font-semibold"]');
        for (const heading of headings) {
            const text = heading.textContent.trim();
            if (text && text.length > 10 && text.length < 200 && !text.includes('Export') && !text.includes('Sign in') && !text.toLowerCase().includes('longcut')) {
                return text;
            }
        }

        return 'Untitled Video';
    }

    /**
     * Extract video duration from the page
     */
    function extractDuration() {
        // Look for duration display (format: "0:00 / 7:22")
        const durationRegex = /(\d+:\d+)\s*\/\s*(\d+:\d+)/;
        const bodyText = document.body.textContent;
        const match = bodyText.match(durationRegex);
        
        if (match && match[2]) {
            return match[2];
        }

        // Fallback: look for specific duration elements
        const timeElements = document.querySelectorAll('[class*="time"], .font-mono');
        for (const el of timeElements) {
            const text = el.textContent.trim();
            if (/^\d+:\d+$/.test(text) && text !== '0:00') {
                return text;
            }
        }

        return null;
    }

    /**
     * Extract transcript segments from the page
     */
    function extractTranscript() {
        const segments = [];
        const segmentElements = document.querySelectorAll('[data-segment-index]');

        segmentElements.forEach((element) => {
            const index = parseInt(element.getAttribute('data-segment-index'), 10);
            const textElement = element.querySelector('p');
            
            if (textElement) {
                const text = textElement.textContent.trim();
                if (text) {
                    segments.push({
                        index: index,
                        text: text
                    });
                }
            }
        });

        return segments;
    }

    /**
     * Extract full transcript as plain text
     */
    function extractTranscriptText(segments) {
        return segments.map(seg => seg.text).join(' ');
    }

    /**
     * Extract highlights/chapters from the page
     */
    function extractHighlights() {
        const highlights = [];
        
        // Look for highlight buttons in the timeline section
        const highlightButtons = document.querySelectorAll('button[class*="w-full"][class*="px-3"][class*="py-1.5"]');

        highlightButtons.forEach((button) => {
            const titleElement = button.querySelector('span.font-medium');
            const timestampElement = button.querySelector('.font-mono');
            const colorDot = button.querySelector('[class*="rounded-full"]');

            if (titleElement && timestampElement) {
                const highlight = {
                    title: titleElement.textContent.trim(),
                    timestamp: timestampElement.textContent.trim(),
                    color: null
                };

                // Extract background color if available
                if (colorDot) {
                    const bgColor = window.getComputedStyle(colorDot).backgroundColor;
                    highlight.color = bgColor;
                }

                highlights.push(highlight);
            }
        });

        return highlights;
    }

    /**
     * Extract summary/key takeaways if available
     */
    function extractSummary() {
        // Look for summary sections
        const summarySelectors = [
            '[class*="summary"]',
            '[class*="takeaway"]',
            '[class*="overview"]'
        ];

        for (const selector of summarySelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }

        // If highlights exist, use them as a summary
        const highlights = extractHighlights();
        if (highlights.length > 0) {
            return highlights.map(h => `• ${h.title} (${h.timestamp})`).join('\n');
        }

        return null;
    }

    /**
     * Gather all data and create JSON object
     */
    async function gatherAllData() {
        const youtubeUrl = extractYouTubeUrl();
        const videoId = extractVideoId(youtubeUrl);
        let title = extractTitle();
        console.log('📺 Initial extracted title:', title);
        const duration = extractDuration();
        const transcriptSegments = extractTranscript();
        const transcriptText = extractTranscriptText(transcriptSegments);
        const highlights = extractHighlights();
        const summary = extractSummary();

        // If title is generic/invalid, try to fetch from YouTube API
        const isGenericTitle = title === 'Untitled Video' || title.toLowerCase().includes('longcut');
        if (isGenericTitle && youtubeUrl) {
            console.log('📺 Attempting to fetch title from YouTube API (current title: "' + title + '")...');
            const youtubeTitle = await fetchYouTubeTitleFromAPI(youtubeUrl);
            if (youtubeTitle) {
                title = youtubeTitle;
                console.log('✅ Retrieved title from YouTube:', title);
            } else {
                console.warn('⚠️ Could not retrieve title from YouTube API, using fallback title.');
            }
        } else  {
            console.log('📺 Extracted title from page:', title);
        }

        return {
            youtubeUrl: youtubeUrl,
            videoId: videoId,
            title: title,
            duration: duration,
            highlights: highlights,
            transcript: {
                segments: transcriptSegments,
                fullText: transcriptText
            },
            summary: summary,
            extractedAt: new Date().toISOString(),
            sourceUrl: window.location.href
        };
    }

    /**
     * Copy data to clipboard
     */
    async function copyToClipboard(data) {
        const jsonString = JSON.stringify(data, null, 2);

        try {
            // Modern Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(jsonString);
                return true;
            }

            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = jsonString;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            return successful;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Show success feedback on button
     */
    function showSuccessFeedback(button) {
        const originalHTML = button.innerHTML;
        const originalBg = button.style.backgroundColor;

        // Change button to show success
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Copied!</span>
        `;
        button.style.backgroundColor = '#10b981';
        button.style.color = 'white';

        // Revert after delay
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.backgroundColor = originalBg;
            button.style.color = '';
        }, CONFIG.successFeedbackDuration);
    }

    /**
     * Show error feedback
     */
    function showErrorFeedback(button) {
        const originalHTML = button.innerHTML;
        
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Error</span>
        `;
        button.style.backgroundColor = '#ef4444';
        button.style.color = 'white';

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.backgroundColor = '';
            button.style.color = '';
        }, CONFIG.successFeedbackDuration);
    }

    /**
     * Handle Copy button click
     */
    async function handleCopyClick(event) {
        event.preventDefault();
        const button = event.currentTarget;

        try {
            // Gather all data
            const data = await gatherAllData();
            
            // Log data to console for debugging
            console.log('Extracted data:', data);

            // Copy to clipboard
            const success = await copyToClipboard(data);

            if (success) {
                showSuccessFeedback(button);
                console.log('✅ Data copied to clipboard successfully!');
            } else {
                showErrorFeedback(button);
                console.error('❌ Failed to copy data to clipboard');
            }
        } catch (error) {
            console.error('Error during copy operation:', error);
            showErrorFeedback(button);
        }
    }

    /**
     * Create and style the Copy button
     */
    function createCopyButton() {
        const button = document.createElement('button');
        button.setAttribute('data-slot', 'button');
        button.setAttribute('data-tampermonkey', 'copy-transcript');
        button.className = 'inline-flex items-center justify-center whitespace-nowrap font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 px-3 has-[>svg]:px-2.5 h-6 gap-1.5 rounded-full border-slate-200 text-[11px] shadow-none transition hover:border-slate-300 hover:bg-white/80';
        
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span>Copy</span>
        `;

        // Ensure async/await works for the click handler
        button.addEventListener('click', async (event) => {
            await handleCopyClick(event);
        });
        
        return button;
    }

    /**
     * Clear all storage and cookies for this domain
     */
    function clearAllStorageAndCookies() {
        console.log('[TM] Clearing all storage and cookies after Longcut.ai initialization...');
        try {
            // Clear localStorage
            localStorage.clear();
        } catch (e) { console.warn('localStorage clear failed', e); }
        try {
            // Clear sessionStorage
            sessionStorage.clear();
        } catch (e) { console.warn('sessionStorage clear failed', e); }
        // Clear all IndexedDB databases
        if (window.indexedDB && indexedDB.databases) {
            indexedDB.databases().then(dbs => {
                dbs.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                });
            }).catch(e => console.warn('IndexedDB clear failed', e));
        }
        // Clear all cookies for this domain
        if (document.cookie && document.cookie.length > 0) {
            document.cookie.split(';').forEach(function(cookie) {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + location.hostname.replace(/^www\./, '');
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
            });
        }
        console.log('🧹 All storage and cookies cleared for this domain.');
    }

    /**
     * Inject the Copy button next to the Export button
     */
    function injectCopyButton() {
        // Check if button already exists
        if (document.querySelector('[data-tampermonkey="copy-transcript"]')) {
            console.log('[TM] Copy button already exists, skipping injection.');
            return true;
        }

        // Find the Export button (loosen selector: any button with Export text)
        const exportButtons = Array.from(document.querySelectorAll('button'));
        console.log('[TM] Found', exportButtons.length, 'buttons on the page.');
        const exportButton = exportButtons.find((btn, idx) => {
            const childMatch = Array.from(btn.childNodes).some(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent.trim().toLowerCase() === 'export';
                }
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
                    return node.textContent.trim().toLowerCase() === 'export';
                }
                return false;
            });
            const textMatch = btn.textContent.trim().toLowerCase().includes('export');
            if (childMatch || textMatch) {
                console.log(`[TM] Export button candidate at index ${idx}:`, btn, 'textContent:', btn.textContent);
            }
            return childMatch || textMatch;
        });

        if (!exportButton) {
            console.log('[TM] Export button not found.');
            return false;
        }
        console.log('[TM] Export button found:', exportButton, 'textContent:', exportButton.textContent);

        // Find the parent container
        const container = exportButton.parentElement;
        if (!container) {
            console.log('[TM] Export button has no parent container.');
            return false;
        }
        console.log('[TM] Export button parent container:', container);

        // Create and inject the Copy button after Export button
        const copyButton = createCopyButton();
        if (exportButton.nextSibling) {
            container.insertBefore(copyButton, exportButton.nextSibling);
            console.log('[TM] Copy button inserted after Export button.');
        } else {
            container.appendChild(copyButton);
            console.log('[TM] Copy button appended to container.');
        }

        console.log('✅ Copy button injected successfully!');
        return true;
    }

    /**
     * Initialize the script with retry logic
     */
    function initialize() {
        let retries = 0;

        const checkAndInject = () => {
            console.log(`[TM] Attempt #${retries + 1} to inject Copy button...`);
            const success = injectCopyButton();
            
            if (success) {
                console.log('🎉 YT Transcript Extractor extension loaded!');
                // Clear all storage AFTER Longcut.ai has initialized and loaded the page
                clearAllStorageAndCookies();
                return;
            }

            retries++;
            if (retries < CONFIG.maxRetries) {
                setTimeout(checkAndInject, CONFIG.buttonCheckInterval);
            } else {
                console.warn('⚠️ Could not find Export button after multiple retries');
            }
        };

        checkAndInject();
    }

    /**
     * Set up MutationObserver to handle dynamic content
     */
    function setupObserver() {
        let lastInjectTime = 0;
        const observer = new MutationObserver((mutations) => {
            // Debounce rapid mutations
            const now = Date.now();
            if (now - lastInjectTime < 500) return;
            lastInjectTime = now;
            // Try to inject if not present
            if (!document.querySelector('[data-tampermonkey="copy-transcript"]')) {
                console.log('[TM] MutationObserver triggered, attempting injection.');
                injectCopyButton();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    // Start the script
    console.log('🚀 YT Transcript Extractor script starting...');
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Set up observer for dynamic content
    setupObserver();

    // Also try to inject when window loads (backup)
    window.addEventListener('load', () => {
        setTimeout(initialize, 1000);
    });

})();
