<!--
 * VideoInsights - server/README.md
 * Documentation for the VideoInsights server component
 * Contains installation instructions, API endpoints, and usage information
 * Date: 2025-05-18
 -->

# VideoInsights Server

This is the server component for the VideoInsights application, providing advanced video processing capabilities that aren't possible in a browser-only environment.

## Features

- Process uploaded video files with ffmpeg
- Extract frames from videos for AI analysis
- Direct YouTube video analysis via Google AI Studio
- Secure API key handling (passed from client per request)

## Prerequisites

1. Node.js (version 14 or higher)
2. npm (Node Package Manager)
3. ffmpeg installed on your system

## Installation

1. Install ffmpeg if you don't have it already:
   - **Windows**: 
     - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
     - Add to your PATH environment variable
   - **Mac**: 
     ```
     brew install ffmpeg
     ```
   - **Linux**: 
     ```
     sudo apt update
     sudo apt install ffmpeg
     ```

2. Install Node.js dependencies:
   ```bash
   cd server
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. The server will run on http://localhost:3000 by default

## API Endpoints

- **POST /api/analyze-youtube**
  - Analyze a YouTube video using Google AI Studio
  - Body: `{ "videoUrl": "https://youtube.com/watch?v=...", "apiKey": "your_google_api_key" }`

- **POST /api/upload**
  - Upload and analyze a video file
  - Form data: 
    - `video`: The video file
    - `apiKey`: Your Google AI Studio API key

## Notes

- This server requires ffmpeg to be properly installed and accessible in your system PATH
- Google AI Studio API key is passed from the client for each request (not stored on server)
- The server doesn't store uploaded videos permanently - they're processed and then deleted
- For larger videos, processing may take some time due to video extraction and API processing

## Integration with Frontend

The frontend VideoInsights application is configured to communicate with this server at http://localhost:3000. Make sure the server is running before using the video upload or YouTube analysis features in the frontend application.
