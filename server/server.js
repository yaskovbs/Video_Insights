const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for your front-end
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const framesDir = path.join(__dirname, 'frames');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// API route for YouTube video analysis
app.post('/api/analyze-youtube', async (req, res) => {
  try {
    const { videoUrl, apiKey } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'No video URL provided' });
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key provided' });
    }
    
    console.log(`Processing YouTube video: ${videoUrl}`);
    
    // Extract YouTube video ID
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Call Google AI API for analysis
    const analysisResults = await analyzeYouTubeVideo(videoUrl, videoId, apiKey);
    res.json(analysisResults);
    
  } catch (error) {
    console.error('Error analyzing YouTube video:', error);
    res.status(500).json({ 
      error: 'Failed to analyze YouTube video', 
      message: error.message 
    });
  }
});

// API route for video file uploads and analysis
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    const videoFile = req.file;
    const apiKey = req.body.apiKey;
    
    if (!videoFile) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key provided' });
    }
    
    console.log(`Processing uploaded video: ${videoFile.originalname}`);
    
    // Process the video and extract frames
    const analysisResults = await processVideo(videoFile.path, apiKey);
    
    // Clean up the uploaded file
    fs.unlinkSync(videoFile.path);
    
    res.json(analysisResults);
    
  } catch (error) {
    console.error('Error processing video file:', error);
    
    // Clean up any uploaded file in case of error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process video', 
      message: error.message 
    });
  }
});

// Extract YouTube Video ID from a URL
function extractYouTubeVideoId(url) {
  try {
    const videoUrl = new URL(url);
    
    if (videoUrl.hostname.includes('youtube.com')) {
      const params = new URLSearchParams(videoUrl.search);
      return params.get('v');
    }
    
    if (videoUrl.hostname === 'youtu.be') {
      return videoUrl.pathname.substring(1);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}

// Process video file using ffmpeg
async function processVideo(videoPath, apiKey) {
  console.log(`Extracting frames from: ${videoPath}`);
  
  try {
    // Create a unique ID for this processing job
    const jobId = Date.now().toString();
    const outputFramePath = path.join(framesDir, `frame-${jobId}-%03d.jpg`);
    
    // Execute ffmpeg command to extract frames
    // Extract 5 frames evenly distributed throughout the video
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "select='not(mod(n,${Math.floor(25*30/5)}))'" -vframes 5 -q:v 2 "${outputFramePath}"`;
    
    console.log(`Running ffmpeg command: ${ffmpegCommand}`);
    execSync(ffmpegCommand);
    
    // Get the extracted frames
    const frameFiles = fs.readdirSync(framesDir)
      .filter(file => file.startsWith(`frame-${jobId}`))
      .map(file => path.join(framesDir, file))
      .sort(); // Sort to ensure frames are in order
    
    if (frameFiles.length === 0) {
      throw new Error('Failed to extract frames from video');
    }
    
    console.log(`Extracted ${frameFiles.length} frames`);
    
    // Use the middle frame for analysis
    const middleFrameIndex = Math.floor(frameFiles.length / 2);
    const frameToAnalyze = frameFiles[middleFrameIndex];
    
    // Analyze the frame with Google AI
    const results = await analyzeVideoFrame(frameToAnalyze, apiKey);
    
    // Clean up the extracted frames
    frameFiles.forEach(frame => {
      if (fs.existsSync(frame)) {
        fs.unlinkSync(frame);
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('Error in video processing:', error);
    throw new Error(`Video processing failed: ${error.message}`);
  }
}

// Analyze YouTube video with Google AI API
async function analyzeYouTubeVideo(videoUrl, videoId, apiKey) {
  try {
    // Prepare the request to Google AI API
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this YouTube video with URL: ${videoUrl}.
                     Please provide the following in a structured format:
                     1. A suggested title (engaging and descriptive)
                     2. A text response summarizing the main content and key points
                     3. A detailed description with 2-3 paragraphs
                     4. Relevant hashtags and tags (max 8)
                     5. Chapter divisions with timestamps (at least 5 sections)
                     
                     Format your response with clear section headers.`
            },
            {
              video_url: videoUrl
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    };
    
    return await callGeminiAPI(requestData, apiKey);
    
  } catch (error) {
    console.error('Error in YouTube video analysis:', error);
    throw error;
  }
}

// Analyze a video frame with Google AI API
async function analyzeVideoFrame(framePath, apiKey) {
  try {
    console.log(`Analyzing frame: ${framePath}`);
    
    // Read the frame file as base64
    const frameData = fs.readFileSync(framePath, { encoding: 'base64' });
    
    // Prepare the request to Google AI API
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this video frame. This is from a video.
                     Please provide the following in a structured format:
                     1. A suggested title (engaging and descriptive)
                     2. A text response summarizing what you can see in this frame
                     3. A detailed description with 2-3 paragraphs about what this video might contain
                     4. Relevant hashtags and tags (max 8)
                     5. Suggested chapter divisions with timestamps
                     
                     Format your response with clear section headers.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: frameData
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
    
    return await callGeminiAPI(requestData, apiKey);
    
  } catch (error) {
    console.error('Error in frame analysis:', error);
    throw error;
  }
}

// Call the Gemini API and process the response
async function callGeminiAPI(requestData, apiKey) {
  try {
    console.log('Calling Google AI API...');
    
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    console.log('Received response from Google AI API');
    
    // Process the Gemini API response
    return processGeminiResponse(response.data);
    
  } catch (error) {
    console.error('Error calling Google AI API:', error.response?.data || error.message);
    throw new Error(`API call failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Process the Gemini API response
function processGeminiResponse(response) {
  try {
    console.log('Processing API response');
    
    // Extract the text from the response
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!responseText) {
      throw new Error('Empty response from API');
    }
    
    // Parse the response text to extract structured information
    const result = {
      title: extractSection(responseText, 'title', 'suggested title'),
      response: extractSection(responseText, 'summary', 'text response'),
      description: extractSection(responseText, 'description', 'detailed description'),
      tags: extractTags(responseText),
      chapters: extractChapters(responseText)
    };
    
    // If parsing failed, use simple fallback approach
    if (!result.title) {
      const lines = responseText.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        result.title = lines[0].replace(/^(Title:|1\.|\*)/, '').trim();
      } else {
        result.title = "Analysis Result";
      }
    }
    
    if (!result.response) {
      result.response = responseText.substring(0, 500) + '...';
    }
    
    if (!result.description) {
      result.description = responseText;
    }
    
    console.log('Processed response:', result);
    return result;
    
  } catch (error) {
    console.error('Error processing API response:', error);
    return {
      title: "Analysis Result",
      response: "The system was unable to properly analyze the content.",
      description: "An error occurred while processing the AI response. The raw response has been included below.\n\n" + response,
      tags: ["#Error", "#AnalysisFailed"],
      chapters: [
        { time: "00:00", title: "Beginning" },
        { time: "01:00", title: "Middle" },
        { time: "02:00", title: "End" }
      ]
    };
  }
}

// Helper functions to extract information from response text
function extractSection(text, sectionName, altName) {
  // Try different patterns for section headers
  const patterns = [
    new RegExp(`(?:${sectionName}|${altName})[:\\s]*(.*?)(?=\\n\\s*\\d+\\.|\\n\\s*[A-Za-z]+:|\n\n|$)`, 'is'),
    new RegExp(`(?:${sectionName}|${altName})[:\\s]*(.*?)(?=\\n\\s*\\d+\\.|\\n\\s*[A-Za-z]+:|\n\n|$)`, 'is'),
    new RegExp(`\\d+\\.\\s*(?:${sectionName}|${altName})[:\\s]*(.*?)(?=\\n\\s*\\d+\\.|\\n\\s*[A-Za-z]+:|\n\n|$)`, 'is')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  return '';
}

function extractTags(text) {
  // Look for hashtags section
  let tagsSection = extractSection(text, 'tags', 'hashtags');
  
  if (tagsSection) {
    // Split by commas, spaces, or newlines
    return tagsSection.split(/[,\n]/)
      .map(tag => tag.trim())
      .filter(tag => tag)
      .map(tag => tag.startsWith('#') ? tag : '#' + tag.replace(/\s+/g, ''))
      .slice(0, 8); // Limit to 8 tags
  }
  
  // Fallback: extract hashtags from anywhere in the text
  const hashtagRegex = /#[a-zA-Z0-9]+/g;
  const matches = text.match(hashtagRegex) || [];
  return matches.slice(0, 8); // Limit to 8 tags
}

function extractChapters(text) {
  // Look for a chapters/timestamps section
  const chaptersSection = text.match(/chapters|timestamps[:\s]*(.*?)(?=\n\s*\d+\.|\n\s*[A-Za-z]+:|\n\n|$)/is);
  
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
    { time: "05:00", title: "Main Content" },
    { time: "10:00", title: "Additional Information" },
    { time: "15:00", title: "Key Points" },
    { time: "20:00", title: "Conclusion" }
  ];
}

// Start the server
app.listen(port, () => {
  console.log(`Video processing server running on port ${port}`);
  console.log(`Server directories:`);
  console.log(` - Uploads: ${uploadsDir}`);
  console.log(` - Frames: ${framesDir}`);
});
