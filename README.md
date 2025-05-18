# VideoInsights

![VideoInsights Logo](https://path-to-your-logo/logo.png)

VideoInsights is a web application that automatically analyzes videos and produces rich textual content using Google AI Studio (Gemini). It helps content creators streamline their video production workflow by automatically generating titles, descriptions, summaries, hashtags, and chapter timestamps.

## Features

- **Automated Video Analysis**: Upload videos or provide YouTube URLs for AI-powered analysis
- **Rich Content Generation**:
  - Text response/summary of video content
  - Suggested video title
  - Detailed video description
  - Relevant hashtags and tags
  - Chapter divisions with timestamps
- **Multilingual Support**: Works with multiple languages including English, Hebrew, and more
- **Secure API Key Management**: Store your Google AI Studio API key securely
- **Responsive UI**: Works on both desktop and mobile devices

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Google AI Studio API key (from [Google AI Studio](https://ai.google.dev/))

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/VideoInsights.git
   cd VideoInsights
   ```

2. Configure your environment:
   - Copy `env.template.js` to `env.js`
   - Add your Google AI Studio API key to `env.js`
   ```javascript
   window.env = {
     GOOGLE_AI_STUDIO_API_KEY: "your_api_key_here",
     // other settings...
   };
   ```
   - Alternatively, you can enter your API key in the web interface

3. Server Setup (Optional but Recommended):
   - For full video processing capabilities, set up the server component:
   ```
   cd server
   npm install
   npm start
   ```
   - The server requires ffmpeg to be installed on your system
   - See detailed instructions in `server/README.md`

4. Open the application:
   - Simply open `index.html` in your web browser
   - For basic functionality, no server is required
   - For full video processing capabilities, make sure the server is running

## Security Notes

- The `.env` file and `env.js` are listed in `.gitignore` to prevent accidental commits of your API key
- API keys are stored in your browser's localStorage with basic obfuscation for convenience
- **IMPORTANT**: NEVER put real API keys in template files or commit them to version control
- Ensure you keep your API keys private and do not share them in public repositories
- For production use, consider implementing server-side API key management

## Technical Implementation

The application consists of the following key files:

- `index.html`: Main user interface
- `styles.css`: Styling and layout
- `app.js`: Application logic and API integration
- `env.js`: Environment configuration (API keys, endpoints)
- `.env`: Server-side environment variables (for future server implementation)

## How It Works

1. You provide a YouTube URL or upload a video file
2. The application sends the video content to Google AI Studio (Gemini)
3. Gemini analyzes the video, processing both visual and audio content
4. The AI generates text content based on its analysis
5. Results are displayed in an organized, easy-to-copy format

## Limitations

- Video length is limited to 90 minutes (Google AI Studio constraint)
- API key must be valid and have sufficient quota
- Demo mode provides mock data when no API key is provided

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google AI Studio for the Gemini API
- Font Awesome for icons
- All contributors and testers

---

נוצר על ידי CLINE בשילוב של CLAUDE-3-7-SONNET-20250219

Created with ❤️ for video content creators
