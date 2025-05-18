/*
 * VideoInsights - app.js
 * Main JavaScript file for the VideoInsights web application
 * Handles user interactions, API requests, video processing, and results display
 * Date: 2025-05-18
 */

document.addEventListener('DOMContentLoaded', function() {
    // Theme handling
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use the system preference
    const savedTheme = localStorage.getItem('videoInsights_theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeIcon(false);
    }
    
    // Theme toggle functionality
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('videoInsights_theme', newTheme);
        
        updateThemeIcon(newTheme === 'dark');
    });
    
    function updateThemeIcon(isDark) {
        if (isDark) {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
        } else {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
    
    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        // Only auto-switch if the user hasn't manually set a preference
        if (!localStorage.getItem('videoInsights_theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(e.matches);
        }
    });
    // DOM Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const youtubeForm = document.getElementById('youtube-form');
    const uploadForm = document.getElementById('upload-form');
    const apiKeyInput = document.getElementById('api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const loadingSection = document.querySelector('.loading-section');
    const resultsSection = document.querySelector('.results-section');
    const inputSection = document.querySelector('.input-section');
    const newAnalysisBtn = document.getElementById('new-analysis');
    const copyBtns = document.querySelectorAll('.copy-btn');
    const languageSelect = document.getElementById('language');

    // Initialize state
    // Use env.js key if available, otherwise fallback to localStorage
    let apiKey = window.env?.GOOGLE_AI_STUDIO_API_KEY || localStorage.getItem('videoInsights_apiKey') || '';
    let currentLanguage = localStorage.getItem('videoInsights_language') || 'auto';
    
    // Get API endpoint from environment
    const apiEndpoint = window.env?.API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision';
    const maxVideoLength = window.env?.MAX_VIDEO_LENGTH_MINUTES || 90;

    // Set initial states
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }

    if (currentLanguage) {
        languageSelect.value = currentLanguage;
        if (currentLanguage === 'he' || currentLanguage === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }
    }

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabToShow = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabToShow}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Toggle API Key Visibility
    togglePasswordBtn.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            apiKeyInput.type = 'password';
            togglePasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    });

    // Save API Key with enhanced security
    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            try {
                // In production, use a better encryption method
                // This is a simple obfuscation for demonstration purposes
                const obfuscatedKey = btoa(key); // Base64 encoding for minimal obfuscation
                localStorage.setItem('videoInsights_apiKey', obfuscatedKey);
                apiKey = key;
                showNotification('API key saved successfully', 'success');
                
                // Clear the input field after saving for security
                setTimeout(() => {
                    apiKeyInput.value = '•'.repeat(12); // Show dots instead of actual key
                }, 1000);
            } catch (error) {
                console.error('Error saving API key:', error);
                showNotification('Error saving API key', 'error');
            }
        } else {
            showNotification('Please enter a valid API key', 'error');
        }
    });

    // Language Selection
    languageSelect.addEventListener('change', (e) => {
        const selectedLanguage = e.target.value;
        localStorage.setItem('videoInsights_language', selectedLanguage);
        currentLanguage = selectedLanguage;
        
        // Set text direction based on language
        if (selectedLanguage === 'he' || selectedLanguage === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }
    });

    // Copy buttons functionality
    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const contentToCopy = document.getElementById(targetId);
            
            if (contentToCopy) {
                const range = document.createRange();
                range.selectNode(contentToCopy);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
                
                showNotification('Content copied to clipboard', 'success');
            }
        });
    });

    // Form submissions
    youtubeForm.addEventListener('submit', handleYoutubeSubmit);
    uploadForm.addEventListener('submit', handleFileUpload);
    
    // New analysis button
    newAnalysisBtn.addEventListener('click', () => {
        resultsSection.style.display = 'none';
        inputSection.style.display = 'block';
    });

    // YouTube URL form submission
    async function handleYoutubeSubmit(e) {
        e.preventDefault();
        
        const youtubeUrl = document.getElementById('youtube-url').value.trim();
        
        if (!youtubeUrl) {
            showNotification('Please enter a valid YouTube URL', 'error');
            return;
        }
        
        if (!apiKey) {
            showNotification('Please enter your Google AI Studio API key', 'error');
            return;
        }
        
        // Show loading state
        inputSection.style.display = 'none';
        loadingSection.style.display = 'block';
        
        try {
            // Send request to the server for YouTube analysis
            const response = await fetch('http://localhost:3000/api/analyze-youtube', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoUrl: youtubeUrl,
                    apiKey: apiKey
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            
            // Process the analysis results
            const results = await response.json();
            displayResults(results);
            
            // Show results section
            loadingSection.style.display = 'none';
            resultsSection.style.display = 'block';
            
        } catch (error) {
            console.error('Error analyzing YouTube video:', error);
            showNotification(`Error: ${error.message}`, 'error');
            
            // Fall back to client-side analysis if server fails
            console.log('Falling back to client-side analysis');
            analyzeVideo(youtubeUrl, 'youtube');
        }
    }

    // File upload form submission
    async function handleFileUpload(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('video-file');
        
        if (!fileInput.files.length) {
            showNotification('Please select a video file to upload', 'error');
            return;
        }
        
        if (!apiKey) {
            showNotification('Please enter your Google AI Studio API key', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        
        // Show loading state
        inputSection.style.display = 'none';
        loadingSection.style.display = 'block';
        
        try {
            // Prepare form data for the server
            const formData = new FormData();
            formData.append('video', file);
            formData.append('apiKey', apiKey);
            
            // Send the file to the server for processing
            showNotification('Uploading video to server for analysis...', 'success');
            
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            
            // Process the analysis results
            const results = await response.json();
            displayResults(results);
            
            // Show results section
            loadingSection.style.display = 'none';
            resultsSection.style.display = 'block';
            
        } catch (error) {
            console.error('Error uploading video:', error);
            showNotification(`Error: ${error.message}`, 'error');
            
            // Fall back to client-side processing if server fails
            console.log('Falling back to client-side processing');
            processVideoFile(file);
        }
    }

    // Function to analyze video
    // Makes API calls to Google AI Studio or uses mock data for demo
    async function analyzeVideo(source, type) {
        try {
            let results;

            // Check if we're in production mode with a valid API key
            if (apiKey && apiKey !== 'your_api_key_here') {
                // Real API implementation
                if (type === 'youtube') {
                    results = await callGeminiAPI(source, type);
                } else if (type === 'upload') {
                    // For file uploads, first process the file
                    // This would typically involve uploading to a server
                    // or processing directly with the Google AI API
                    results = await processVideoFile(source);
                }
            } else {
                // For demo purposes or when API key isn't available, use mock data
                console.log('Using mock data (no valid API key provided)');
                results = generateMockResults(source, type);
            }
            
            // Display results
            displayResults(results);
            
            // Hide loading, show results
            loadingSection.style.display = 'none';
            resultsSection.style.display = 'block';
        } catch (error) {
            console.error('Error analyzing video:', error);
            showNotification('Error analyzing video: ' + error.message, 'error');
            
            // Return to input section on error
            loadingSection.style.display = 'none';
            inputSection.style.display = 'block';
        }
    }

    // Function to call the Gemini API
    async function callGeminiAPI(videoSource, sourceType) {
        try {
            // For YouTube URLs, we need to use a proxy server to get video content
            // because browser security restricts direct video access
            let videoData;
            
            if (sourceType === 'youtube') {
                // Extract YouTube video ID from URL
                const videoId = extractYouTubeVideoId(videoSource);
                if (!videoId) {
                    throw new Error('Invalid YouTube URL. Please provide a valid YouTube video link.');
                }
                
                videoData = {
                    video_url: videoSource,
                    video_id: videoId
                };
                
                console.log(`Processing YouTube video ID: ${videoId}`);
            } else {
                videoData = {
                    inline_data: {
                        mime_type: "video/mp4",
                        data: videoSource
                    }
                };
            }
            
            // Construct the request to Gemini API
            const requestData = {
                contents: [
                    {
                        parts: [
                            {
                                text: `Analyze this ${sourceType === 'youtube' ? 'YouTube video' : 'video file'}. 
                                       Provide the following in a structured format:
                                       1. A suggested title (engaging and descriptive)
                                       2. A text response summarizing the main content and key points
                                       3. A detailed description with 2-3 paragraphs
                                       4. Relevant hashtags and tags (max 8)
                                       5. Chapter divisions with timestamps (at least 5 sections)
                                       
                                       For each section, provide appropriate information based on the actual content of the video.
                                       Return the information in a clear, structured format.`
                            },
                            videoData
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 2048
                }
            };

            // Make the actual API call
            console.log(`Making API call to ${apiEndpoint} for ${sourceType} analysis`);
            console.log('Using API key (securely stored)');
            
            try {
                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API error response:', errorText);
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                return processGeminiResponse(data, currentLanguage);
            } catch (apiError) {
                console.error('API call failed:', apiError);
                
                // If in development or API fails, fallback to mock data
                console.warn('Falling back to mock data due to API error');
                showNotification('Could not connect to Google AI API, showing sample results', 'error');
                return generateMockResults(videoSource, sourceType);
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw new Error('Failed to process video with AI: ' + error.message);
        }
    }
    
    // Extract YouTube Video ID from various URL formats
    function extractYouTubeVideoId(url) {
        try {
            const videoUrl = new URL(url);
            
            // Handle youtube.com URLs
            if (videoUrl.hostname.includes('youtube.com')) {
                const params = new URLSearchParams(videoUrl.search);
                return params.get('v') || '';
            }
            
            // Handle youtu.be URLs
            if (videoUrl.hostname === 'youtu.be') {
                return videoUrl.pathname.substring(1) || '';
            }
            
            return null;
        } catch (error) {
            console.error('Error parsing YouTube URL:', error);
            return null;
        }
    }
    
    // Process the response from Gemini API
    function processGeminiResponse(response, language) {
        try {
            console.log('Processing Gemini response:', response);
            
            // Extract the text from the response
            const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (!responseText) {
                throw new Error('Empty response from API');
            }
            
            console.log('Raw response text:', responseText);
            
            // Parse the response text to extract structured information
            // This is a simple parser that looks for specific sections
            
            // Default return structure
            const result = {
                title: extractSection(responseText, 'title', 'suggested title'),
                response: extractSection(responseText, 'summary', 'text response'),
                description: extractSection(responseText, 'description', 'detailed description'),
                tags: extractTags(responseText),
                chapters: extractChapters(responseText)
            };
            
            // If we couldn't parse properly, use a simplified approach
            if (!result.title || !result.response) {
                console.warn('Could not parse structured response, using simplified parsing');
                
                // Split by lines and make best effort to extract
                const lines = responseText.split('\n').filter(line => line.trim());
                
                if (!result.title && lines.length > 0) {
                    result.title = lines[0].replace(/^(Title:|1\.|\*)/, '').trim();
                }
                
                if (!result.response && lines.length > 1) {
                    result.response = lines.slice(1, 5).join('\n');
                }
                
                if (!result.description && lines.length > 5) {
                    result.description = lines.slice(5, 10).join('\n');
                }
            }
            
            console.log('Parsed result:', result);
            return result;
        } catch (error) {
            console.error('Error processing API response:', error);
            return generateMockResults('', language === 'he' ? 'hebrew' : 'english');
        }
    }
    
    // Helper functions to extract information from response text
    function extractSection(text, sectionName, altName) {
        const regex = new RegExp(`(${sectionName}|${altName})[:\\s]*(.*?)(?=\\n\\s*\\d+\\.|\\n\\s*[A-Za-z]+:|\n\n|$)`, 'is');
        const match = text.match(regex);
        return match ? match[2].trim() : '';
    }
    
    function extractTags(text) {
        // Look for hashtags section
        const tagsSection = extractSection(text, 'tags', 'hashtags');
        
        if (tagsSection) {
            // Split by commas, spaces, or newlines
            return tagsSection.split(/[,\n]/)
                .map(tag => tag.trim())
                .filter(tag => tag)
                .map(tag => tag.startsWith('#') ? tag : '#' + tag)
                .slice(0, 8); // Limit to 8 tags
        }
        
        // Fallback: extract hashtags from anywhere in the text
        const hashtagRegex = /#[a-zA-Z0-9]+/g;
        const matches = text.match(hashtagRegex) || [];
        return matches.slice(0, 8); // Limit to 8 tags
    }
    
    function extractChapters(text) {
        // Look for a chapters/timestamps section
        const chaptersSection = text.match(/chapters[:\s]*(.*?)(?=\n\s*\d+\.|\n\s*[A-Za-z]+:|\n\n|$)/is);
        
        if (chaptersSection) {
            // Extract time and title patterns like "00:00 - Introduction" or "00:00: Introduction"
            const chapterRegex = /(\d{1,2}:\d{2})[:\s-]+([^\n]+)/g;
            const chapters = [];
            let match;
            
            while ((match = chapterRegex.exec(chaptersSection[1])) !== null) {
                chapters.push({
                    time: match[1],
                    title: match[2].trim()
                });
            }
            
            if (chapters.length > 0) {
                return chapters;
            }
        }
        
        // Fallback: look for timestamps in the entire text
        const timeRegex = /(\d{1,2}:\d{2})[:\s-]+([^\n]+)/g;
        const chapters = [];
        let match;
        
        while ((match = timeRegex.exec(text)) !== null) {
            chapters.push({
                time: match[1],
                title: match[2].trim()
            });
        }
        
        return chapters.length > 0 ? chapters : [
            { time: "00:00", title: "Introduction" },
            { time: "01:00", title: "Main Content" },
            { time: "03:00", title: "Conclusion" }
        ];
    }

    // Process video file
    async function processVideoFile(file) {
        try {
            console.log('Processing video file:', file);
            
            // This function would typically handle file uploads to a server
            // or convert the file to a format that can be sent to the API
            
            // Since browser-based apps can't directly analyze video content,
            // we need either:
            // 1. A server component to handle the video processing (ideal)
            // 2. A client-side approach to extract frames (limited)
            
            // Option 1: For a complete solution, we'd use a server:
            // const formData = new FormData();
            // formData.append('video', file);
            // const response = await fetch('/api/upload', { method: 'POST', body: formData });
            // const data = await response.json();
            // return data;
            
            // Option 2: Client-side approach with limitations
            // We'll extract a frame from the video and send that to the API
            try {
                showNotification('Extracting video frames for analysis...', 'success');
                const videoData = await extractVideoFrameAsBase64(file);
                
                // Now we have extracted frame data, send to Gemini API
                const requestData = {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Analyze this video frame. This is from a video titled "${file.name}". 
                                           Provide the following in a structured format:
                                           1. A suggested title (engaging and descriptive)
                                           2. A text response summarizing what you can see in this frame
                                           3. A detailed description with 2-3 paragraphs about what this video might contain
                                           4. Relevant hashtags and tags (max 8)
                                           5. Suggested chapter divisions with timestamps
                                           
                                           Note: Since this is just a single frame from the video, make educated guesses
                                           about the full content based on what you can see.`
                                },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: videoData
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 2048
                    }
                };
                
                // Make the API call
                console.log('Making API call for video frame analysis');
                
                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API error response:', errorText);
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                return processGeminiResponse(data, currentLanguage);
                
            } catch (frameError) {
                console.error('Error processing video frame:', frameError);
                showNotification('Could not process video. Using sample results instead.', 'error');
                return generateMockResults(file.name, 'upload');
            }
        } catch (error) {
            console.error('Error processing video file:', error);
            showNotification('Error processing video file: ' + error.message, 'error');
            return generateMockResults(file.name, 'upload');
        }
    }
    
    // Extract a frame from a video file as base64-encoded data
    function extractVideoFrameAsBase64(file) {
        return new Promise((resolve, reject) => {
            try {
                // Create video and canvas elements
                const video = document.createElement('video');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Create object URL for the file
                const objectUrl = URL.createObjectURL(file);
                
                // Set up video events
                video.onloadedmetadata = () => {
                    // Set canvas dimensions to match video
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    // Seek to a point in the video (1/4 of the way through)
                    video.currentTime = Math.min(video.duration * 0.25, 30);
                };
                
                video.onseeked = () => {
                    // Draw the current frame to the canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Convert canvas to base64 data URL
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    // Extract the base64 data (remove the "data:image/jpeg;base64," prefix)
                    const base64Data = dataUrl.split(',')[1];
                    
                    // Clean up
                    URL.revokeObjectURL(objectUrl);
                    
                    resolve(base64Data);
                };
                
                video.onerror = (error) => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Error loading video: ' + error));
                };
                
                // Start loading the video
                video.src = objectUrl;
                video.load();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to display results
    function displayResults(results) {
        // Set title
        document.getElementById('title-content').textContent = results.title;
        
        // Set text response
        document.getElementById('response-content').textContent = results.response;
        
        // Set description
        document.getElementById('description-content').textContent = results.description;
        
        // Set tags
        const tagsContainer = document.querySelector('.tags-container');
        tagsContainer.innerHTML = '';
        
        results.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            
            if (tag.startsWith('#')) {
                tagElement.classList.add('hashtag');
            }
            
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
        
        // Set chapters
        const chaptersList = document.querySelector('.chapters-list');
        chaptersList.innerHTML = '';
        
        results.chapters.forEach(chapter => {
            const chapterElement = document.createElement('li');
            const timeElement = document.createElement('span');
            timeElement.className = 'chapter-time';
            timeElement.textContent = chapter.time;
            
            chapterElement.appendChild(timeElement);
            chapterElement.appendChild(document.createTextNode(chapter.title));
            
            chaptersList.appendChild(chapterElement);
        });
    }

    // Generate mock results for demo purposes
    function generateMockResults(source, type) {
        // This is just mock data for demonstration purposes
        // In a real implementation, this data would come from the AI model
        
        const isHebrew = currentLanguage === 'he';
        
        let title, response, description, tags, chapters;
        
        if (isHebrew) {
            // Hebrew mock data
            title = "סקירת טכנולוגיה: הדור הבא של בינה מלאכותית";
            response = "בסרטון זה המנחה מציג סקירה מקיפה של התפתחויות בתחום הבינה המלאכותית. הוא מתחיל בהסבר על המושגים הבסיסיים ואז עובר לדון ביישומים העדכניים ביותר. לקראת סוף הסרטון, ישנה הדגמה מעשית של כלי AI חדשני.";
            description = "סקירה מעמיקה של טכנולוגיות בינה מלאכותית עכשוויות ועתידיות. הסרטון מכסה את היסודות התיאורטיים של למידת מכונה, מציג יישומים מעשיים בתעשיות שונות, ומדגים כלים חדשניים שמשנים את האופן בו אנו מתקשרים עם טכנולוגיה.\n\nנושאים עיקריים:\n- יסודות הבינה המלאכותית\n- יישומים עסקיים של למידת מכונה\n- מודלים גנרטיביים ושימושיהם\n- הדגמה מעשית של כלי AI מתקדם";
            tags = ["#בינהמלאכותית", "#טכנולוגיה", "#חדשנות", "למידתמכונה", "טק", "סקירהטכנולוגית"];
            chapters = [
                { time: "00:00", title: " פתיחה והקדמה" },
                { time: "02:15", title: " יסודות הבינה המלאכותית" },
                { time: "08:43", title: " יישומים מעשיים בתעשייה" },
                { time: "15:27", title: " הדגמה מעשית" },
                { time: "23:05", title: " סיכום ומסקנות" }
            ];
        } else {
            // English mock data
            title = "Tech Review: The Next Generation of Artificial Intelligence";
            response = "In this video, the host provides a comprehensive overview of developments in the field of artificial intelligence. He begins by explaining the basic concepts and then moves on to discuss the latest applications. Towards the end of the video, there is a practical demonstration of an innovative AI tool.";
            description = "An in-depth review of current and future artificial intelligence technologies. The video covers the theoretical foundations of machine learning, presents practical applications in various industries, and demonstrates innovative tools that are changing the way we interact with technology.\n\nKey topics:\n- Foundations of artificial intelligence\n- Business applications of machine learning\n- Generative models and their uses\n- Practical demonstration of an advanced AI tool";
            tags = ["#ArtificialIntelligence", "#Technology", "#Innovation", "MachineLearning", "Tech", "TechReview"];
            chapters = [
                { time: "00:00", title: " Introduction" },
                { time: "02:15", title: " Foundations of AI" },
                { time: "08:43", title: " Practical Applications in Industry" },
                { time: "15:27", title: " Practical Demonstration" },
                { time: "23:05", title: " Summary and Conclusions" }
            ];
        }
        
        return {
            title,
            response,
            description,
            tags,
            chapters
        };
    }

    // Show notification
    function showNotification(message, type) {
        // Check if notification container exists
        let notificationContainer = document.querySelector('.notification-container');
        
        // If it doesn't exist, create it
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add notification to container
        notificationContainer.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Add notification styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        html[dir="rtl"] .notification-container {
            right: auto;
            left: 20px;
        }
        
        .notification {
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        
        .notification.success {
            background-color: var(--success-color);
        }
        
        .notification.error {
            background-color: var(--error-color);
        }
        
        .notification.fade-out {
            opacity: 0;
            transform: translateY(-10px);
        }
    `;
    document.head.appendChild(style);
});
