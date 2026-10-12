import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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
- ELBOW (lower_arm): Human elbows can ONLY bend forward (flexion towards chest/face). In our rig, positive X (0 to 140 deg) flexes the forearm FORWARD! NEVER use negative angles that would bend the elbow backward.
- KNEES (knee_L, knee_R): Human knees bend backward (flexion). In our rig, positive X (0 to 140 deg) bends the knee backward.
- HIPS (hip_L, hip_R): Flexing leg forward (sitting, marching) is negative X (-40 to -90 deg). Extending leg back is positive X.
- NECK/HEAD: X tilts up/down (-X down, +X up), Y turns left/right, Z tilts laterally.

MULTILINGUAL PROMPTS (TURKISH, ENGLISH, ETC.):
- "birbirine sarılan iki iskelet", "sarılma", "kucaklaşma", "two skeletons embracing":
  Create a believable, intimate two-figure embrace:
  Figure 0: positioned at [-0.19, 0, 0], rotated Y: 82 deg (facing partner).
  Figure 1: positioned at [0.19, 0, 0], rotated Y: -98 deg (facing partner).
  Both rib cages touch naturally.
  Figure 0 wraps left arm over Figure 1's upper back (shoulder_L: [-42, 18, 0], lower_arm_L: [82, 15, 0]) and right arm around Figure 1's waist (shoulder_R: [-32, -18, 2], lower_arm_R: [76, -15, 0]).
  Figure 1 reciprocates: right arm over Figure 0's upper back (shoulder_R: [-42, -18, 0], lower_arm_R: [82, -15, 0]) and left arm around waist (shoulder_L: [-32, 18, -2], lower_arm_L: [76, 15, 0]).
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
