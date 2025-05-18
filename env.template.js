/*
 * VideoInsights - env.template.js
 * Environment variables template file for the VideoInsights application
 * Contains configuration values for API endpoints and keys
 * Date: 2025-05-18
 */

// IMPORTANT: Copy this file to env.js and add your API keys
// env.js should not be committed to git (it's listed in .gitignore)

window.env = {
  // Add your Google AI Studio API key here
  GOOGLE_AI_STUDIO_API_KEY: "", // NEVER put real API keys in template files
  
  // API configuration
  API_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision",
  MAX_VIDEO_LENGTH_MINUTES: 90
};
