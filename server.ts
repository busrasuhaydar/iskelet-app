import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const aiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (aiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instructions for the anatomical pose generator
const POSE_SYSTEM_INSTRUCTION = `You are a world-class 3D character rigger, biomechanics specialist, and anatomical posing engine for a 3D skeleton studio.
Your role is to translate natural language user descriptions (in ANY language including Turkish, English, etc.) or targeted follow-up edits into exact joint rotation Euler angles (in DEGREES [X, Y, Z]) and figure positions for articulated 3D skeletons.

CRITICAL COORDINATE AND BIOMECHANICAL AXIS RULES:
- Angles are in DEGREES.
- Default neutral T/A pose has all joint rotations at approximately 0.
- SHOULDER: Raising arm forward (anterior flexion, e.g. reaching or embracing) is NEGATIVE X (e.g. -35 to -75 deg). Raising arm backward (extension) is positive X. Z raises arm outward (abduction).
- ELBOW (lower_arm): Human elbows can ONLY bend forward (flexion towards chest/face). In our rig, NEGATIVE X (-10 to -140 deg) flexes the forearm FORWARD towards chest/face (+Z)! NEVER use positive angles that would bend the elbow backward behind the body.
- KNEES (knee_L, knee_R): Human knees bend backward (flexion). In our rig, positive X (0 to 140 deg) bends the knee backward.
- HIPS (hip_L, hip_R): Flexing leg forward (sitting, marching) is negative X (-40 to -90 deg). Extending leg back is positive X.
- NECK/HEAD: X tilts up/down (-X down, +X up), Y turns left/right, Z tilts laterally.

MULTILINGUAL PROMPTS (TURKISH, ENGLISH, ETC.):
- "birbirine sarılan iki iskelet", "sarılma", "kucaklaşma", "two skeletons embracing":
  Create a believable, intimate two-figure embrace:
  Figure 0: positioned at [-0.19, 0, 0], rotated Y: 82 deg (facing partner).
  Figure 1: positioned at [0.19, 0, 0], rotated Y: -98 deg (facing partner).
  Both rib cages touch naturally.
  Figure 0 wraps left arm over Figure 1's upper back (shoulder_L: [-42, 18, 0], lower_arm_L: [-82, 15, 0]) and right arm around Figure 1's waist (shoulder_R: [-32, -18, 2], lower_arm_R: [-76, -15, 0]).
  Figure 1 reciprocates: right arm over Figure 0's upper back (shoulder_R: [-42, -18, 0], lower_arm_R: [-82, -15, 0]) and left arm around waist (shoulder_L: [-32, 18, -2], lower_arm_L: [-76, 15, 0]).
  Heads tilt gently so skulls rest comfortably near shoulders (Figure 0 head: [8, -22, 6], Figure 1 head: [8, 22, -6]).

TARGETED EDITS RULE:
If the user's prompt is a follow-up or targeted edit (e.g. "raise left arm higher", "sol kolunu biraz daha kaldır", "turn head towards skeleton 2", "bend right knee more", "keep everything else exactly as it is"):
You MUST ONLY return changes for the requested joints or figures! Leave all other joints untouched. Set "isTargetedEdit": true.

Return valid JSON with the following structure:
{
  "explanation": "Short description of the biomechanical pose decisions made",
  "isTargetedEdit": boolean,
  "figures": [
    {
      "figureIndex": 0,
      "position": [x, y, z],
      "rotation": [x, y, z],
      "joints": {
        "shoulder_L": [x, y, z],
        "lower_arm_L": [x, y, z]
      }
    }
  ]
}`;

// API Route for Pose AI Generation
app.post('/api/pose-ai', async (req, res) => {
  const { prompt, currentSceneState, isTargetedEdit } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Falling back to local procedural pose solver.',
      offlineFallbackRequired: true,
    });
  }

  try {
    const contents = `User Request: "${prompt}"

Context:
Is Targeted Edit: ${Boolean(isTargetedEdit)}
Current Scene State:
${JSON.stringify(currentSceneState || {}, null, 2)}

Produce the updated joint angles and figure transforms as requested in the JSON format.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: POSE_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const text = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // Clean potential markdown backticks
      const clean = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      parsedData = JSON.parse(clean);
    }

    return res.json({
      success: true,
      result: parsedData,
      source: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('Error in /api/pose-ai:', err);
    return res.status(500).json({
      error: err.message || 'Gemini API call failed',
      offlineFallbackRequired: true,
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(aiClient),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// GOOGLE DRIVE GLTF SKELETON INTEGRATION
// ==========================================
function extractDriveFileId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

async function downloadGoogleDriveFile(fileId: string): Promise<Buffer> {
  const directUrls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://docs.google.com/uc?export=download&id=${fileId}`,
  ];

  for (const targetUrl of directUrls) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const html = await response.text();
        const confirmMatch =
          html.match(/confirm=([0-9A-Za-z_-]+)/) ||
          html.match(/name="confirm"\s+value="([^"]+)"/) ||
          html.match(/id="confirm"[^>]*value="([^"]+)"/);

        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
          const confirmRes = await fetch(confirmUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            redirect: 'follow',
          });
          if (confirmRes.ok && !confirmRes.headers.get('content-type')?.includes('text/html')) {
            const arr = await confirmRes.arrayBuffer();
            return Buffer.from(arr);
          }
        }
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > 1000) {
        return Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.warn(`Attempt with ${targetUrl} failed:`, err);
    }
  }

  throw new Error(`Google Drive download failed for file ${fileId}`);
}

const CONFIG_FILE_PATH = path.resolve(__dirname, 'drive-config.json');
const MODEL_CACHE_DIR = path.resolve(__dirname, 'public', 'models');
const MODEL_CACHE_PATH = path.resolve(MODEL_CACHE_DIR, 'main_skeleton.glb');

if (!fs.existsSync(MODEL_CACHE_DIR)) {
  fs.mkdirSync(MODEL_CACHE_DIR, { recursive: true });
}

function getResolvedModelPath(): string | null {
  if (fs.existsSync(MODEL_CACHE_PATH)) return MODEL_CACHE_PATH;
  const distModel = path.resolve(__dirname, 'dist', 'models', 'main_skeleton.glb');
  if (fs.existsSync(distModel)) return distModel;
  return null;
}

function getStoredDriveConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading drive-config.json:', e);
  }
  return {
    driveUrl: process.env.GOOGLE_DRIVE_MODEL_URL || '',
    modelName: 'Skeleton (Diego Luján García)',
    author: 'Diego Luján García',
    source: 'https://sketchfab.com/3d-models/skeleton-4de7b96a351a4a35b1b6e5415277ff07',
    license: 'CC-BY-4.0',
    lastUpdated: null,
  };
}

function saveStoredDriveConfig(config: any) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving drive-config.json:', e);
  }
}

// 1. Get Drive Config & Status
app.get('/api/drive-config', (_req, res) => {
  const config = getStoredDriveConfig();
  const cachedPath = getResolvedModelPath();
  const hasCachedModel = Boolean(cachedPath);
  let fileSize = 0;
  if (cachedPath) {
    try {
      fileSize = fs.statSync(cachedPath).size;
    } catch {}
  }

  res.json({
    configured: Boolean(config.driveUrl || hasCachedModel),
    driveUrl: config.driveUrl || '',
    hasCachedModel,
    fileSize,
    fileSizeFormatted: fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : null,
    modelName: config.modelName,
    author: config.author,
    license: config.license,
    source: config.source,
  });
});

// 2. Set/Update Drive URL and trigger download & caching
app.post('/api/drive-config', async (req, res) => {
  const { driveUrl } = req.body;
  if (!driveUrl || typeof driveUrl !== 'string') {
    return res.status(400).json({ error: 'driveUrl is required' });
  }

  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) {
    return res.status(400).json({
      error: 'Geçersiz Google Drive linki. Lütfen geçerli bir Google Drive paylaşım linki veya dosya ID girin.',
    });
  }

  try {
    console.log(`Downloading model from Google Drive (ID: ${fileId})...`);
    const buffer = await downloadGoogleDriveFile(fileId);

    fs.writeFileSync(MODEL_CACHE_PATH, buffer);
    const config = getStoredDriveConfig();
    config.driveUrl = driveUrl;
    config.lastUpdated = new Date().toISOString();
    saveStoredDriveConfig(config);

    console.log(`Model successfully cached: ${buffer.length} bytes`);
    return res.json({
      success: true,
      message: 'Google Drive iskelet modeli başarıyla indirildi ve ana iskelet olarak ayarlandı.',
      fileSize: buffer.length,
      fileSizeFormatted: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`,
    });
  } catch (err: any) {
    console.error('Failed to download Google Drive model:', err);
    return res.status(500).json({
      error: err.message || 'Google Drive indirme işlemi başarısız oldu.',
    });
  }
});

// 3. Serve the cached Drive model binary directly
app.get('/api/drive-model', async (_req, res) => {
  const cachedPath = getResolvedModelPath();
  if (cachedPath) {
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', 'inline; filename="main_skeleton.glb"');
    const readStream = fs.createReadStream(cachedPath);
    return readStream.pipe(res);
  }

  // If not cached yet, check if a driveUrl is configured
  const config = getStoredDriveConfig();
  if (config.driveUrl) {
    const fileId = extractDriveFileId(config.driveUrl);
    if (fileId) {
      try {
        const buffer = await downloadGoogleDriveFile(fileId);
        fs.writeFileSync(MODEL_CACHE_PATH, buffer);
        res.setHeader('Content-Type', 'model/gltf-binary');
        return res.send(buffer);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  }

  return res.status(404).json({
    error: 'Henüz bir Google Drive iskelet modeli bağlanmadı.',
    isConfigured: false,
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chromatic Skeleton Pose Studio running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
