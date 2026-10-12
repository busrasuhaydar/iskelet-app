import React, { useEffect, useRef, useState } from 'react';
import { ChromeStudio } from './scene/ChromeStudio';
import { SkeletonRig } from './scene/SkeletonRig';
import {
  JointKey,
  EulerDegrees,
  MaterialSettings,
  LightingStudioState,
  GizmoMode,
  TransformSpace,
  SkeletonFigureData,
} from './types/skeleton';
import { CHROME_MATERIAL_PRESETS, DEFAULT_NEUTRAL_POSE } from './scene/jointDefinitions';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { BottomAIPanel } from './components/BottomAIPanel';
import { ViewportHUD } from './components/ViewportHUD';
import { ExportModal } from './components/ExportModal';
import { PoseLibraryModal } from './components/PoseLibraryModal';
import { AcceptanceTestModal } from './components/AcceptanceTestModal';
import { ImportModelModal } from './components/ImportModelModal';
import { AcceptanceTestRunner } from './services/acceptanceTests';
import { AIPoseSolver } from './services/aiPoseSolver';
import { BUILTIN_POSE_TEMPLATES } from './services/poseLibrary';
import { PanelLeft, PanelRight } from 'lucide-react';

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<ChromeStudio | null>(null);
  const runnerRef = useRef<AcceptanceTestRunner | null>(null);

  // App UI state
  const [activeTab, setActiveTab] = useState<'viewport' | 'materials' | 'lighting' | 'library' | 'tests'>('viewport');
  const [figuresList, setFiguresList] = useState<SkeletonRig[]>([]);
  const [activeFigureId, setActiveFigureId] = useState<string | null>(null);
  const [selectedJointKey, setSelectedJointKey] = useState<JointKey | null>(null);

  // Viewport & Gizmo state
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('rotate');
  const [transformSpace, setTransformSpace] = useState<TransformSpace>('local');
  const [framingRatio, setFramingRatio] = useState<'none' | '1:1' | '4:3' | '16:9' | '9:16'>('none');
  const [lightingState, setLightingState] = useState<LightingStudioState | null>(null);

  // Mobile drawer visibility
  const [showLeftDrawer, setShowLeftDrawer] = useState(true);
  const [showRightDrawer, setShowRightDrawer] = useState(true);

  // Undo / Redo history stack
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // AI Pose state
  const [isAILoading, setIsAILoading] = useState(false);
  const [lastAIExplanation, setLastAIExplanation] = useState<string | null>(null);
  const [lastAISource, setLastAISource] = useState<'gemini-3.8-flash' | 'local_solver' | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // 1. Initialize ChromeStudio on mount
  useEffect(() => {
    if (!viewportRef.current) return;

    const studio = new ChromeStudio(viewportRef.current, {
      onJointSelected: (_fId, jKey) => {
        setSelectedJointKey(jKey);
      },
      onFigureSelected: (fId) => {
        setActiveFigureId(fId);
      },
      onPoseChanged: () => {
        pushHistoryState();
      },
    });

    studioRef.current = studio;
    runnerRef.current = new AcceptanceTestRunner(studio);
    setLightingState({ ...studio.lightingState });

    // Create Initial Figure: Primary Mirror Chrome Skeleton
    const initialFigureData: SkeletonFigureData = {
      id: 'figure_1',
      name: 'Chrome Skeleton 1 (Primary)',
      visible: true,
      locked: false,
      ikEnabled: false,
      enforceJointLimits: true,
      material: { ...CHROME_MATERIAL_PRESETS.pure_mirror },
      pose: {
        ...JSON.parse(JSON.stringify(DEFAULT_NEUTRAL_POSE)),
        joints: { ...BUILTIN_POSE_TEMPLATES.contrapposto.joints },
      },
    };

    const initialRig = studio.addFigure(initialFigureData);
    setFiguresList([initialRig]);
    setActiveFigureId(initialRig.id);

    // Initial snapshot in history
    const initialSnapshot = captureSceneSnapshot(studio);
    setHistory([initialSnapshot]);
    setHistoryIndex(0);

    return () => {
      studio.dispose();
      studioRef.current = null;
    };
  }, []);

  // Helper to snapshot scene state for undo/redo
  const captureSceneSnapshot = (studio: ChromeStudio) => {
    return Array.from(studio.figures.values()).map((rig) => ({
      id: rig.id,
      pose: JSON.parse(JSON.stringify(rig.currentPose)),
    }));
  };

  const pushHistoryState = () => {
    if (!studioRef.current) return;
    const snap = captureSceneSnapshot(studioRef.current);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, snap];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !studioRef.current) return;
    const targetSnap = history[historyIndex - 1];
    applySceneSnapshot(targetSnap);
    setHistoryIndex(historyIndex - 1);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || !studioRef.current) return;
    const targetSnap = history[historyIndex + 1];
    applySceneSnapshot(targetSnap);
    setHistoryIndex(historyIndex + 1);
  };

  const applySceneSnapshot = (snap: any[]) => {
    if (!studioRef.current) return;
    snap.forEach((item) => {
      const rig = studioRef.current?.figures.get(item.id);
      if (rig) {
        rig.applyPose(item.pose);
      }
    });
  };

  // ==========================================
  // FIGURE ACTIONS
  // ==========================================

  const handleSelectFigure = (id: string) => {
    if (!studioRef.current) return;
    studioRef.current.setActiveFigure(id);
    setActiveFigureId(id);
    setSelectedJointKey(null);
  };

  const handleAddFigure = () => {
    if (!studioRef.current) return;
    const newId = `figure_${Date.now()}`;
    const newFigureData: SkeletonFigureData = {
      id: newId,
      name: `Chrome Skeleton ${studioRef.current.figures.size + 1}`,
      visible: true,
      locked: false,
      ikEnabled: false,
      enforceJointLimits: true,
      material: { ...CHROME_MATERIAL_PRESETS.rainbow_chrome },
      pose: {
        ...JSON.parse(JSON.stringify(DEFAULT_NEUTRAL_POSE)),
        position: [0.65, 0, 0],
      },
    };

    const rig = studioRef.current.addFigure(newFigureData);
    setFiguresList(Array.from(studioRef.current.figures.values()));
    setActiveFigureId(rig.id);
    pushHistoryState();
  };

  const handleDuplicateFigure = (id: string) => {
    if (!studioRef.current) return;
    const rig = studioRef.current.duplicateFigure(id);
    if (rig) {
      setFiguresList(Array.from(studioRef.current.figures.values()));
      setActiveFigureId(rig.id);
      pushHistoryState();
    }
  };

  const handleRemoveFigure = (id: string) => {
    if (!studioRef.current) return;
    studioRef.current.removeFigure(id);
    setFiguresList(Array.from(studioRef.current.figures.values()));
    setActiveFigureId(studioRef.current.activeFigureId);
    pushHistoryState();
  };

  const handleModelImported = (rig: SkeletonRig) => {
    if (!studioRef.current) return;
    setFiguresList(Array.from(studioRef.current.figures.values()));
    setActiveFigureId(rig.id);
    pushHistoryState();
  };

  const handleToggleVisibility = (id: string) => {
    const rig = studioRef.current?.figures.get(id);
    if (rig) {
      rig.setVisible(!rig.visible);
      setFiguresList([...Array.from(studioRef.current!.figures.values())]);
    }
  };

  const handleToggleLock = (id: string) => {
    const rig = studioRef.current?.figures.get(id);
    if (rig) {
      rig.locked = !rig.locked;
      setFiguresList([...Array.from(studioRef.current!.figures.values())]);
    }
  };

  const handleToggleIK = (id: string) => {
    const rig = studioRef.current?.figures.get(id);
    if (rig) {
      rig.setIKEnabled(!rig.ikEnabled);
      setFiguresList([...Array.from(studioRef.current!.figures.values())]);
    }
  };

  const handleToggleLimits = (id: string) => {
    const rig = studioRef.current?.figures.get(id);
    if (rig) {
      rig.enforceJointLimits = !rig.enforceJointLimits;
      setFiguresList([...Array.from(studioRef.current!.figures.values())]);
    }
  };

  // ==========================================
  // JOINT MANIPULATION
  // ==========================================

  const handleSelectJoint = (key: JointKey | null) => {
    if (!studioRef.current) return;
    studioRef.current.selectJoint(key);
    setSelectedJointKey(key);
  };

  const handleUpdateJointRotation = (key: JointKey, angles: EulerDegrees) => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.setJointRotation(key, angles);
    pushHistoryState();
  };

  const handleResetJoint = (key: JointKey) => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.resetJoint(key);
    pushHistoryState();
  };

  const handleResetLimb = (category: any) => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.resetLimb(category);
    pushHistoryState();
  };

  const handleResetAllPose = () => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.resetAllPose();
    pushHistoryState();
  };

  const handleMirrorPose = (fromSide: 'L' | 'R') => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.mirrorPose(fromSide);
    pushHistoryState();
  };

  // ==========================================
  // MATERIAL & LIGHTING
  // ==========================================

  const handleUpdateMaterial = (settings: MaterialSettings) => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig || !studioRef.current) return;
    rig.updateMaterial(settings, studioRef.current.getEnvironmentTexture());
    setFiguresList([...Array.from(studioRef.current.figures.values())]);
  };

  const handleApplyLightingPreset = (presetId: string) => {
    if (!studioRef.current) return;
    studioRef.current.applyLightingPreset(presetId);
    setLightingState({ ...studioRef.current.lightingState });
  };

  const handleUpdateLighting = (state: LightingStudioState) => {
    if (!studioRef.current) return;
    studioRef.current.lightingState = state;
    studioRef.current.buildStudioLights();
    setLightingState({ ...state });
  };

  // ==========================================
  // POSE PRESETS & NATURAL LANGUAGE AI
  // ==========================================

  const handleApplyPoseTemplate = (templateId: string) => {
    const template = BUILTIN_POSE_TEMPLATES[templateId];
    if (!template || !studioRef.current) return;

    if (templateId === 'embrace_A' || templateId === 'embrace_B') {
      // If applying an embrace preset, set up 2 interacting skeletons automatically!
      if (studioRef.current.figures.size < 2) {
        handleAddFigure();
      }
      const figs = Array.from(studioRef.current.figures.values());
      figs[0].applyPose({
        position: BUILTIN_POSE_TEMPLATES.embrace_A.position,
        rotation: BUILTIN_POSE_TEMPLATES.embrace_A.rotation,
        joints: BUILTIN_POSE_TEMPLATES.embrace_A.joints as any,
      });
      figs[1].applyPose({
        position: BUILTIN_POSE_TEMPLATES.embrace_B.position,
        rotation: BUILTIN_POSE_TEMPLATES.embrace_B.rotation,
        joints: BUILTIN_POSE_TEMPLATES.embrace_B.joints as any,
      });
      setFiguresList(Array.from(studioRef.current.figures.values()));
    } else if (templateId === 'duel_A' || templateId === 'duel_B') {
      if (studioRef.current.figures.size < 2) {
        handleAddFigure();
      }
      const figs = Array.from(studioRef.current.figures.values());
      figs[0].applyPose({
        position: BUILTIN_POSE_TEMPLATES.duel_A.position,
        rotation: BUILTIN_POSE_TEMPLATES.duel_A.rotation,
        joints: BUILTIN_POSE_TEMPLATES.duel_A.joints as any,
      });
      figs[1].applyPose({
        position: BUILTIN_POSE_TEMPLATES.duel_B.position,
        rotation: BUILTIN_POSE_TEMPLATES.duel_B.rotation,
        joints: BUILTIN_POSE_TEMPLATES.duel_B.joints as any,
      });
      setFiguresList(Array.from(studioRef.current.figures.values()));
    } else {
      const activeRig = studioRef.current.getActiveFigure();
      if (activeRig) {
        activeRig.applyPose({
          position: template.position,
          rotation: template.rotation,
          joints: template.joints as any,
        });
        setFiguresList(Array.from(studioRef.current.figures.values()));
      }
    }

    pushHistoryState();
  };

  const handleGeneratePose = async (prompt: string, forceOffline: boolean) => {
    if (!studioRef.current) return;
    setIsAILoading(true);

    try {
      const currentFigures = Array.from(studioRef.current.figures.values()).map((rig) => ({
        id: rig.id,
        pose: rig.currentPose,
      }));

      const solution = await AIPoseSolver.solvePose(prompt, currentFigures, forceOffline);

      setLastAIExplanation(solution.explanation);
      setLastAISource(solution.source);

      // If solution contains 2 figures and we only have 1, automatically spawn the 2nd figure!
      if (solution.figures.length >= 2 && studioRef.current.figures.size < 2) {
        handleAddFigure();
      }

      const figs = Array.from(studioRef.current.figures.values());
      const activeRig = studioRef.current.getActiveFigure();

      solution.figures.forEach((update) => {
        // If single-figure request, prioritize the currently active selected figure (custom or procedural)
        let targetRig: SkeletonRig | undefined;
        if (solution.figures.length === 1 && activeRig) {
          targetRig = activeRig;
        } else {
          targetRig = figs[update.figureIndex] || activeRig || figs[0];
        }

        if (targetRig) {
          if (update.position) targetRig.setPosition(update.position);
          if (update.rotation) targetRig.setRotation(update.rotation);
          if (update.joints) {
            Object.entries(update.joints).forEach(([jKey, angles]) => {
              if (angles) {
                targetRig!.setJointRotation(jKey as JointKey, angles);
              }
            });
          }
        }
      });

      setFiguresList(Array.from(studioRef.current.figures.values()));
      pushHistoryState();
    } catch (err: any) {
      console.error('Error generating pose:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  // ==========================================
  // PROJECT PERSISTENCE
  // ==========================================

  const handleLoadProject = (projectJson: string) => {
    if (!studioRef.current) return;
    try {
      const project = JSON.parse(projectJson);
      if (project.figures && Array.isArray(project.figures)) {
        // Clear existing figures
        Array.from(studioRef.current.figures.keys()).forEach((fId) => {
          studioRef.current?.removeFigure(fId);
        });

        // Add figures from project
        project.figures.forEach((fData: SkeletonFigureData) => {
          studioRef.current?.addFigure(fData);
        });

        if (project.lighting) {
          studioRef.current.lightingState = project.lighting;
          studioRef.current.buildStudioLights();
          setLightingState({ ...project.lighting });
        }

        setFiguresList(Array.from(studioRef.current.figures.values()));
        setActiveFigureId(studioRef.current.activeFigureId);
        pushHistoryState();
      }
    } catch (err) {
      console.error('Failed to parse project JSON:', err);
    }
  };

  const activeRig = figuresList.find((f) => f.id === activeFigureId) || figuresList[0] || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0c10] text-slate-100 font-sans">
      {/* 1. Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {/* 2. Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawer Toggle (Mobile) */}
        <button
          onClick={() => setShowLeftDrawer(!showLeftDrawer)}
          title="Toggle Left Hierarchy Panel"
          className="md:hidden absolute top-3 left-3 z-30 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-slate-300"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Right Drawer Toggle (Mobile) */}
        <button
          onClick={() => setShowRightDrawer(!showRightDrawer)}
          title="Toggle Right Inspector Panel"
          className="md:hidden absolute top-3 right-3 z-30 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-slate-300"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Left Panel: Scene Hierarchy & Skeleton Bone Tree */}
        <div
          className={`${
            showLeftDrawer ? 'block' : 'hidden md:block'
          } h-full z-20 transition-all shrink-0`}
        >
          <LeftPanel
            figures={figuresList}
            activeFigureId={activeFigureId}
            selectedJointKey={selectedJointKey}
            onSelectFigure={handleSelectFigure}
            onAddFigure={handleAddFigure}
            onOpenImport={() => setIsImportOpen(true)}
            onDuplicateFigure={handleDuplicateFigure}
            onRemoveFigure={handleRemoveFigure}
            onSelectJoint={handleSelectJoint}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onToggleIK={handleToggleIK}
            onToggleLimits={handleToggleLimits}
          />
        </div>

        {/* Center: 3D WebGL Canvas & Floating Viewport HUD */}
        <div className="flex-1 relative h-full bg-[#0b0c10] overflow-hidden">
          <div ref={viewportRef} className="w-full h-full cursor-crosshair" />

          {/* Floating HUD */}
          <ViewportHUD
            gizmoMode={gizmoMode}
            transformSpace={transformSpace}
            selectedJointKey={selectedJointKey}
            activeFigureName={activeRig?.name || null}
            framingRatio={framingRatio}
            onSetGizmoMode={(m) => {
              setGizmoMode(m);
              studioRef.current?.setGizmoMode(m);
            }}
            onSetTransformSpace={(s) => {
              setTransformSpace(s);
              studioRef.current?.setTransformSpace(s);
            }}
            onSetFramingRatio={setFramingRatio}
          />
        </div>

        {/* Right Panel: Joint Rotation Inspector, Materials, Lighting, Camera */}
        <div
          className={`${
            showRightDrawer ? 'block' : 'hidden md:block'
          } h-full z-20 transition-all shrink-0`}
        >
          {lightingState && (
            <RightPanel
              activeRig={activeRig}
              selectedJointKey={selectedJointKey}
              lightingState={lightingState}
              activeTab={activeTab}
              onUpdateJointRotation={handleUpdateJointRotation}
              onResetJoint={handleResetJoint}
              onResetLimb={handleResetLimb}
              onResetAllPose={handleResetAllPose}
              onMirrorPose={handleMirrorPose}
              onUpdateMaterial={handleUpdateMaterial}
              onApplyLightingPreset={handleApplyLightingPreset}
              onUpdateLighting={handleUpdateLighting}
              onSetCameraView={(view) => studioRef.current?.setCameraView(view)}
              onFocusSelection={() => studioRef.current?.focusOnSelection()}
              onToggleOrtho={(ortho) => studioRef.current?.toggleOrthographicCamera(ortho)}
              onSetExposure={(exp) => studioRef.current?.setExposure(exp)}
              onApplyPoseTemplate={handleApplyPoseTemplate}
            />
          )}
        </div>
      </div>

      {/* 3. Bottom Natural-Language AI Pose Generator */}
      <BottomAIPanel
        onGeneratePose={handleGeneratePose}
        isLoading={isAILoading}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        lastAIExplanation={lastAIExplanation}
        lastAISource={lastAISource}
      />

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        studio={studioRef.current}
        onLoadProject={handleLoadProject}
      />

      <PoseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        activeRig={activeRig}
        figures={figuresList}
        onApplyPoseTemplate={handleApplyPoseTemplate}
      />

      <AcceptanceTestModal
        isOpen={isTestsOpen}
        onClose={() => setIsTestsOpen(false)}
        runner={runnerRef.current}
      />

      <ImportModelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        studio={studioRef.current}
        figures={figuresList}
        activeFigureId={activeFigureId}
        onModelImported={handleModelImported}
      />
    </div>
  );
}
