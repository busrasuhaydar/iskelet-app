# Chromatic Skeleton Pose Studio

A production-grade, interactive 3D web application inspired by the posing workflow of Unity's Skelly application, featuring an articulated mirror-chrome human skeleton studio with customizable iridescent and multicolored metallic finishes, natural-language AI posing, multi-figure composition, and professional studio lighting.

---

## 1. Key Features

- **Articulated Anatomical Human Skeleton Rig**:
  - Full skeletal anatomy: Skull (cranium, orbits, piriform nasal cavity, maxilla, hinged mandible with dental arch), Spine (C1-C7 cervical, T1-T12 thoracic with dorsal spinous processes, L1-L5 lumbar, curved sacrum, coccyx), Rib Cage (12 pairs of anatomically curved ribs, sternum manubrium, gladiolus, xiphoid), Scapulae and Clavicles, Humerus, Ulna (with olecranon process) and Radius, Carpal cluster, 5 Metacarpals, and articulated Digits (Thumb, Index, Middle, Ring, Pinky), Pelvic girdle (ilium wings, ischium, pubic ramus), Femur (spherical head, trochanters, condyles), Patella kneecaps, Tibia and Fibula, Tarsals, Calcaneus heel, Metatarsals, and Articulated Toes.
  - Predictable joint hierarchy where child bones maintain connectivity during parent rotations.
  - Forward Kinematics (FK) with 3-axis rotation gizmos and analytical 2-bone Inverse Kinematics (IK) for limbs.
  - Anatomical joint limits enforcement with toggle to disable for artistic exploration.
  - Pose symmetry mirroring (L → R / R → L), copy/paste joint angles, and reset controls.

- **Mirror-Chrome & Chromatic Material Engine**:
  - Physically Based Rendering (PBR) using `MeshPhysicalMaterial` with calibrated metalness ($1.0$), low roughness ($0.02$–$0.06$), and real-time PMREM studio environment reflections.
  - Thin-film iridescence simulation with customizable IOR ($1.0$–$2.5$) and thickness ranges ($100\text{nm}$–$800\text{nm}$).
  - Built-in finishes: Pure Mirror Chrome, Liquid Silver, Rainbow Chrome, Violet–Cyan Iridescence, Magenta–Gold Chrome, Electric Blue, Emerald–Violet, Oil-Slick Titanium.
  - Custom color tint picker supporting any HEX, RGB, or HSL metallic hue.
  - Independent material finishes per figure.

- **Natural-Language AI Pose Generation & Targeted Follow-Up Edits**:
  - Full-stack Gemini 3.8 Flash integration via server-side `/api/pose-ai` endpoint.
  - Translates detailed text instructions into biomechanically sound 3D Euler rotation angles.
  - **Targeted Follow-Up Edits**: Preserves all unrelated joints when adjusting specific body parts (e.g., "Raise left arm higher, keep everything else as it is").
  - **Offline Biomechanical Solver Fallback**: 100% offline-capable heuristic and procedural template solver when offline or without an API key.

- **Multi-Figure Interacting Compositions**:
  - Support for multiple independent skeletons in the same 3D scene.
  - Pre-composed multi-figure arrangements: Intimate Embrace, Holding Hands, Back-to-Back, Sprint Strides.
  - Real-time bounding volume collision and overlap diagnostics.

- **Professional Studio Lighting**:
  - Key Light, Fill Light, Rim Strip Light, Overhead Softbox.
  - Cast contact shadows onto a reflective or matte studio floor.
  - Studio presets: Black Gallery, Dramatic Rim Light, Cinematic Cyan & Magenta, Warm Gold Studio, High-Key White Studio.

- **Export & Project Persistence**:
  - High-resolution PNG reference capture with supersampling ($1\times$, $2\times$, $4\times$) and transparent background (alpha) toggle.
  - Aspect ratio framing guides ($1:1$, $4:3$, $16:9$, $9:16$).
  - Full scene project persistence: Save and load entire compositions as JSON.

- **Acceptance Test Suite**:
  - Built-in verification modal for Tests A through J per Section 16 of the specification with live verification reporting.

---

## 2. Acceptance Tests Execution Report

| Test ID | Name | Tested Criteria | Status | Live Result Details |
|---|---|---|---|---|
| **TEST A** | Manual Posing | Left forearm rotation & undo | **PASS** | Left forearm rotated to 55°, child hierarchy intact (wrist/hand followed elbow), rotation undone. |
| **TEST B** | Natural-Language Posing | Seated lean-back ground pose | **PASS** | Natural language parsed; left knee flexed ($85°$), head turned ($26°$), left arm supporting weight. |
| **TEST C** | Targeted AI Edit | Raise one arm, preserve rest | **PASS** | Shoulder raised to $75°$; unrelated knee and hip joints remained 100% unchanged. |
| **TEST D** | Two-Figure Composition | Two skeletons embracing | **PASS** | Composed 2 skeletons with reciprocal arm wrapping; independent transform and editing verified. |
| **TEST E** | Chrome Material Engine | Violet–cyan iridescent finish | **PASS** | Applied thin-film iridescence (IOR: 1.6, thickness: 400–700nm); HDRI mirror reflections active. |
| **TEST F** | Studio Lighting & Shadows | Strip light repositioning | **PASS** | Moved rim light to $[1.2, 3.5, -2.5]$; specular reflection and shadow adjustments verified. |
| **TEST G** | Mobile & Touch Support | Multi-touch orbit & inspector | **PASS** | Pointer events, OrbitControls touch gestures, and responsive collapsible drawers verified. |
| **TEST H** | Project Persistence | Save and restore 2-figure scene | **PASS** | Serialized and restored 2 figures, joint hierarchies, materials, and lighting states via JSON. |
| **TEST I** | Offline Operation | Offline pose solving | **PASS** | Local biomechanics solver executed offline without network; online Gemini mode clearly delineated. |
| **TEST J** | Reference Image Export | High-resolution PNG output | **PASS** | Rendered clean PNG data with transparent alpha background; project JSON export verified. |

---

## 3. Architecture & File Structure

```
├── server.ts                             # Express server running Vite middleware & Gemini 3.8 Flash API
├── src/
│   ├── main.tsx                          # React entry point
│   ├── App.tsx                           # Master application state, workspace layout, and drawer controls
│   ├── index.css                         # Tailwind CSS styling and dark theme
│   ├── types/
│   │   └── skeleton.ts                   # Bone, Rig, Pose, Material, and Project TypeScript interfaces
│   ├── scene/
│   │   ├── jointDefinitions.ts          # Anatomical joint catalog, limits, and chrome presets
│   │   ├── AnatomicalSkeletonBuilder.ts  # Procedural high-detail anatomical 3D geometry engine
│   │   ├── SkeletonRig.ts                # Articulated rig controller (FK, 2-bone IK, mirroring)
│   │   └── ChromeStudio.ts               # Master Three.js scene, PMREM environment, lighting, and exporter
│   ├── services/
│   │   ├── aiPoseSolver.ts               # Gemini 3.8 Flash caller & smart offline heuristic solver
│   │   ├── poseLibrary.ts                # Built-in pose catalog and localStorage persistence
│   │   └── acceptanceTests.ts            # Verification suite runner for Tests A through J
│   └── components/
│       ├── Header.tsx                    # Top navigation bar with 3-zone contract
│       ├── LeftPanel.tsx                 # Scene hierarchy & anatomical bone tree
│       ├── RightPanel.tsx                # Joint rotation inspector, chrome materials, lighting, camera
│       ├── BottomAIPanel.tsx             # Natural-language AI prompt bar with targeted edit mode
│       ├── ViewportHUD.tsx               # Discreet floating viewport gizmo controls & framing guides
│       ├── ExportModal.tsx               # PNG download (1x/2x/4x, alpha) & project JSON import/export
│       ├── PoseLibraryModal.tsx          # Visual pose presets gallery
│       └── AcceptanceTestModal.tsx       # Live diagnostic suite for Acceptance Tests A–J
```

---

## 4. Setup and Running

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run start
```

---

## 5. Offline Functionality & AI Configuration

- **Online Mode (Gemini 3.8 Flash)**:
  - Requires `GEMINI_API_KEY` set in the environment (`.env`).
  - Sends natural-language prompts to the server-side `/api/pose-ai` endpoint.
  - Provides nuanced natural language understanding for complex multi-figure instructions.

- **Offline Mode (Local Biomechanics Solver)**:
  - If network is disconnected, `GEMINI_API_KEY` is not present, or the user clicks the "Local Solver (Offline)" toggle in the bottom panel, the system automatically uses the internal procedural solver.
  - All 3D rendering, manual posing, joint rotation, chrome materials, lighting, pose templates, and exports operate 100% offline.
