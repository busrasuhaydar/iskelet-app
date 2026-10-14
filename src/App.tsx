import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  SavedPoseRecord,
  FigurePose,
  AnimationPlayerState,
} from './types/skeleton';
import { CHROME_MATERIAL_PRESETS, DEFAULT_NEUTRAL_POSE } from './scene/jointDefinitions';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { SkellyPoseBar } from './components/SkellyPoseBar';
import { ViewportHUD } from './components/ViewportHUD';
import { ExportModal } from './components/ExportModal';
import { PoseLibraryModal } from './components/PoseLibraryModal';
import { AcceptanceTestModal } from './components/AcceptanceTestModal';
import { ImportModelModal } from './components/ImportModelModal';
import { DriveModelConnector } from './components/DriveModelConnector';
import { AcceptanceTestRunner } from './services/acceptanceTests';
import { AIPoseSolver } from './services/aiPoseSolver';
import {
  BUILTIN_POSE_TEMPLATES,
  getSavedCustomPoses,
  saveCustomPoseRecord,
  deleteCustomPoseRecord,
} from './services/poseLibrary';
import { PanelLeft, PanelRight } from 'lucide-react';

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<ChromeStudio | null>(null);
  const runnerRef = useRef<AcceptanceTestRunner | null>(null);

  // App UI state
  const [activeTab, setActiveTab] = useState<'viewport' | 'materials' | 'scene' | 'lighting' | 'library' | 'tests'>('viewport');
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

  // Undo / Redo history stack (Ref-based to prevent stale closure corruption)
  const historyRef = useRef<Array<Array<{ id: string; pose: FigurePose }>>>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const rafSyncRef = useRef<number | null>(null);

  // AI Pose state
  const [isAILoading, setIsAILoading] = useState(false);
  const [lastAIExplanation, setLastAIExplanation] = useState<string | null>(null);
  const [lastAISource, setLastAISource] = useState<'gemini-3.8-flash' | 'local_solver' | null>(null);

  // Motion-Capture Animation Studio state
  const [animationPlayerState, setAnimationPlayerState] = useState<AnimationPlayerState>({
    currentClipId: null,
    clipName: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackSpeed: 1.0,
    loop: true,
    rootMotion: true,
  });

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Saved Custom Poses with Photo Thumbnails
  const [savedPoses, setSavedPoses] = useState<SavedPoseRecord[]>(() => getSavedCustomPoses());
  const [previewThumbnail, setPreviewThumbnail] = useState<string>('');

  // Helper to snapshot scene state for undo/redo
  const captureSceneSnapshot = (studio: ChromeStudio) => {
    return Array.from(studio.figures.values()).map((rig) => ({
      id: rig.id,
      pose: JSON.parse(JSON.stringify(rig.currentPose)),
    }));
  };

  const pushHistoryState = useCallback(() => {
    if (!studioRef.current) return;
    const snap = captureSceneSnapshot(studioRef.current);
    const currIdx = historyIndexRef.current;
    const newHistory = historyRef.current.slice(0, currIdx + 1);
    newHistory.push(snap);
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const applySceneSnapshot = useCallback((snap: any[]) => {
    if (!studioRef.current || !Array.isArray(snap) || snap.length === 0) return;
    snap.forEach((item) => {
      if (!item || !item.id) return;
      const rig = studioRef.current?.figures.get(item.id);
      if (rig && item.pose) {
        rig.applyPose(item.pose);
      }
    });
    setFiguresList(Array.from(studioRef.current.figures.values()));
  }, []);

  const handleUndo = useCallback(() => {
    if (!studioRef.current) return;
    const currIdx = historyIndexRef.current;
    if (currIdx <= 0) return;
    const targetIdx = currIdx - 1;
    const targetSnap = historyRef.current[targetIdx];
    if (Array.isArray(targetSnap) && targetSnap.length > 0) {
      applySceneSnapshot(targetSnap);
      historyIndexRef.current = targetIdx;
      setCanUndo(targetIdx > 0);
      setCanRedo(targetIdx < historyRef.current.length - 1);
    }
  }, [applySceneSnapshot]);

  const handleRedo = useCallback(() => {
    if (!studioRef.current) return;
    const currIdx = historyIndexRef.current;
    if (currIdx >= historyRef.current.length - 1) return;
    const targetIdx = currIdx + 1;
    const targetSnap = historyRef.current[targetIdx];
    if (Array.isArray(targetSnap) && targetSnap.length > 0) {
      applySceneSnapshot(targetSnap);
      historyIndexRef.current = targetIdx;
      setCanUndo(targetIdx > 0);
      setCanRedo(targetIdx < historyRef.current.length - 1);
    }
  }, [applySceneSnapshot]);

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
      onTransformChanged: () => {
        // High performance real-time slider tracking throttled with RAF
        if (rafSyncRef.current) return;
        rafSyncRef.current = requestAnimationFrame(() => {
          rafSyncRef.current = null;
          setFiguresList((prev) => [...prev]);
        });
      },
      onAnimationUpdate: (animState) => {
        setAnimationPlayerState(animState);
      },
    });

    studioRef.current = studio;
    runnerRef.current = new AcceptanceTestRunner(studio);
    setLightingState({ ...studio.lightingState });

    // Create Initial Figure: Primary Mirror Chrome Skeleton
    const initialFigureData: SkeletonFigureData = {
      id: 'figure_1',
      name: 'Anatomik İskelet (Diego Luján García)',
      visible: true,
      locked: false,
      ikEnabled: false,
      enforceJointLimits: true,
      material: { ...CHROME_MATERIAL_PRESETS.pure_mirror },
      pose: {
        ...JSON.parse(JSON.stringify(DEFAULT_NEUTRAL_POSE)),
        joints: { ...DEFAULT_NEUTRAL_POSE.joints },
      },
    };

    const initialRig = studio.addFigure(initialFigureData);
    setFiguresList([initialRig]);
    setActiveFigureId(initialRig.id);

    // Automatically load the high-fidelity Diego Luján García skeleton GLTF from storage/drive
    fetch('/models/main_skeleton.glb')
      .then((res) => {
        if (!res.ok) return fetch('/api/drive-model');
        return res;
      })
      .then((res) => {
        if (!res.ok) throw new Error('Model fetch failed');
        return res.arrayBuffer();
      })
      .then(async (arrayBuffer) => {
        const { gltf } = await studio.loadGLTFFromArrayBuffer(arrayBuffer, 'main_skeleton.glb');
        const modelGroup = gltf.scene || gltf.scenes?.[0];
        if (modelGroup && studioRef.current) {
          const mainRig = studio.replaceFigureWithCustomModel(initialRig.id, modelGroup, {
            name: 'Anatomik İskelet (Diego Luján García)',
            applyChromeMaterial: true,
          });
          setFiguresList([mainRig]);
          setActiveFigureId(mainRig.id);

          // Initialize history stack with the full anatomical skeleton
          const snap = captureSceneSnapshot(studio);
          historyRef.current = [snap];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        }
      })
      .catch((err) => {
        console.warn('Auto-load of main skeleton fell back to built-in rig:', err);
      });

    // Initial snapshot in history
    const initialSnapshot = captureSceneSnapshot(studio);
    historyRef.current = [initialSnapshot];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);

    return () => {
      studio.dispose();
      studioRef.current = null;
    };
  }, [pushHistoryState]);

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
    const nextIdx = studioRef.current.figures.size + 1;
    const offset = 0.65 * (studioRef.current.figures.size % 2 === 0 ? 1 : -1) * Math.ceil(studioRef.current.figures.size / 2);

    let rig: SkeletonRig;
    const firstCustomRig = Array.from(studioRef.current.figures.values()).find(
      (f) => f.isCustomModel && f.customModelGroup
    );
    const sourceScene =
      studioRef.current.cachedGLTFScene ||
      (firstCustomRig ? firstCustomRig.customModelGroup : null);

    if (sourceScene) {
      // Duplicate the authentic anatomical GLB model so 2nd skeleton is 100% full anatomical mesh!
      rig = studioRef.current.addCustomModelFigure(sourceScene, {
        name: `Anatomik İskelet ${nextIdx}`,
        applyChromeMaterial: true,
      });
      rig.setPosition([offset, 0, 0]);
      const envTex = studioRef.current.getEnvironmentTexture();
      if (envTex) {
        rig.updateMaterial(CHROME_MATERIAL_PRESETS.rainbow_chrome, envTex);
      }
    } else {
      const newId = `figure_${Date.now()}`;
      const newFigureData: SkeletonFigureData = {
        id: newId,
        name: `Anatomik İskelet ${nextIdx}`,
        visible: true,
        locked: false,
        ikEnabled: false,
        enforceJointLimits: true,
        material: { ...CHROME_MATERIAL_PRESETS.rainbow_chrome },
        pose: {
          ...JSON.parse(JSON.stringify(DEFAULT_NEUTRAL_POSE)),
          position: [offset, 0, 0],
        },
      };
      rig = studioRef.current.addFigure(newFigureData);

      // Fetch glb asynchronously to upgrade to full anatomical model
      fetch('/models/main_skeleton.glb')
        .then((res) => res.arrayBuffer())
        .then(async (arrayBuffer) => {
          if (!studioRef.current) return;
          const { gltf } = await studioRef.current.loadGLTFFromArrayBuffer(arrayBuffer, 'main_skeleton.glb');
          const modelGroup = gltf.scene || gltf.scenes?.[0];
          if (modelGroup && studioRef.current) {
            const upgraded = studioRef.current.replaceFigureWithCustomModel(newId, modelGroup, {
              name: `Anatomik İskelet ${nextIdx}`,
              applyChromeMaterial: true,
            });
            setFiguresList(Array.from(studioRef.current.figures.values()));
            setActiveFigureId(upgraded.id);
          }
        })
        .catch(() => {});
    }

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

  // Motion Capture Animation Player Handlers
  const handlePlayAnimation = useCallback((clipId: string) => {
    studioRef.current?.playMotionClip(clipId);
  }, []);

  const handlePauseAnimation = useCallback(() => {
    studioRef.current?.pauseAnimation();
  }, []);

  const handleResumeAnimation = useCallback(() => {
    studioRef.current?.resumeAnimation();
  }, []);

  const handleStopAnimation = useCallback(() => {
    studioRef.current?.stopAnimation();
  }, []);

  const handleSeekAnimation = useCallback((time: number) => {
    studioRef.current?.seekAnimation(time);
  }, []);

  const handleSetAnimationSpeed = useCallback((speed: number) => {
    studioRef.current?.setAnimationSpeed(speed);
  }, []);

  const handleToggleRootMotion = useCallback((enable: boolean) => {
    studioRef.current?.setAnimationRootMotion(enable);
  }, []);

  const handleToggleLoop = useCallback((loop: boolean) => {
    studioRef.current?.setAnimationLoop(loop);
  }, []);

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
    setFiguresList((prev) => [...prev]);
    pushHistoryState();
  };

  const handleResetJoint = (key: JointKey) => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.resetJoint(key);
    setFiguresList((prev) => [...prev]);
    pushHistoryState();
  };

  const handleResetLimb = (category: any) => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.resetLimb(category);
    setFiguresList((prev) => [...prev]);
    pushHistoryState();
  };

  const handleResetAllPose = () => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.resetAllPose();
    setFiguresList((prev) => [...prev]);
    pushHistoryState();
  };

  const handleMirrorPose = (fromSide: 'L' | 'R') => {
    const rig = studioRef.current?.getActiveFigure();
    if (!rig) return;
    rig.mirrorPose(fromSide);
    setFiguresList((prev) => [...prev]);
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

  const handleOpenLibraryModal = () => {
    if (studioRef.current) {
      const snap = studioRef.current.captureThumbnail(360, 360);
      setPreviewThumbnail(snap);
    }
    setIsLibraryOpen(true);
  };

  const handleSaveCurrentPoseWithPhoto = (name: string) => {
    const activeRig = studioRef.current?.getActiveFigure();
    if (!studioRef.current || !activeRig) return;

    const thumbnail = studioRef.current.captureThumbnail(360, 360);
    const cameraState = studioRef.current.getCameraState();
    const materialState = activeRig.currentMaterialSettings;
    const lightingState = studioRef.current.lightingState;

    const newRecord: SavedPoseRecord = {
      id: `saved_pose_${Date.now()}`,
      name: name.trim(),
      thumbnail,
      createdAt: new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      figureId: activeRig.id,
      pose: JSON.parse(JSON.stringify(activeRig.currentPose)),
      camera: cameraState,
      material: JSON.parse(JSON.stringify(materialState)),
      lighting: JSON.parse(JSON.stringify(lightingState)),
    };

    const updated = saveCustomPoseRecord(newRecord);
    setSavedPoses([...updated]);
  };

  const handleApplySavedPose = (record: SavedPoseRecord) => {
    if (!studioRef.current) return;
    const activeRig = studioRef.current.getActiveFigure();
    if (activeRig && record.pose) {
      activeRig.applyPose(record.pose);
    }
    if (record.camera) {
      studioRef.current.setCameraState(record.camera);
    }
    if (record.material && activeRig) {
      handleUpdateMaterial(record.material);
    }
    if (record.lighting) {
      handleUpdateLighting(record.lighting);
    }
    setFiguresList(Array.from(studioRef.current.figures.values()));
    pushHistoryState();
  };

  const handleDeleteSavedPose = (id: string) => {
    const updated = deleteCustomPoseRecord(id);
    setSavedPoses([...updated]);
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

      solution.figures.forEach((update) => {
        const targetRig = figs[update.figureIndex] || figs[0];
        if (targetRig) {
          if (update.position) targetRig.setPosition(update.position);
          if (update.rotation) targetRig.setRotation(update.rotation);
          if (update.joints) {
            Object.entries(update.joints).forEach(([jKey, angles]) => {
              if (angles) {
                targetRig.setJointRotation(jKey as JointKey, angles);
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

  const handleNudgeAngle = (axis: 'x' | 'y' | 'z', deltaDeg: number) => {
    if (!activeRig || !selectedJointKey) return;
    const current = activeRig.getJointRotation(selectedJointKey);
    const newRot = { ...current, [axis]: current[axis] + deltaDeg };
    handleUpdateJointRotation(selectedJointKey, newRot);
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
        onOpenLibrary={handleOpenLibraryModal}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {/* Google Drive Automatic Skeleton Loader & Linker */}
      <DriveModelConnector
        studio={studioRef.current}
        onModelLoaded={handleModelImported}
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
            onSelectBone={(bName) => studioRef.current?.selectBone(bName)}
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
            onOpenLibraryModal={handleOpenLibraryModal}
            onSelectJoint={handleSelectJoint}
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
              savedPoses={savedPoses}
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
              onSaveCurrentPose={handleSaveCurrentPoseWithPhoto}
              onApplySavedPose={handleApplySavedPose}
              onDeleteSavedPose={handleDeleteSavedPose}
              onOpenLibraryModal={handleOpenLibraryModal}
              onSelectJoint={handleSelectJoint}
              onSetBackgroundImage={(url) => {
                if (!studioRef.current) return;
                studioRef.current.setBackgroundImage(url);
                setLightingState({ ...studioRef.current.lightingState });
              }}
              onSetBackgroundColor={(color) => {
                if (!studioRef.current) return;
                studioRef.current.setBackgroundColor(color);
                setLightingState({ ...studioRef.current.lightingState });
              }}
              onSetFloorTexture={(url, repeat) => {
                if (!studioRef.current) return;
                studioRef.current.setFloorTexture(url, repeat);
                setLightingState({ ...studioRef.current.lightingState });
              }}
              onSetFloorRepeat={(repeat) => {
                if (!studioRef.current) return;
                studioRef.current.setFloorRepeat(repeat);
                setLightingState({ ...studioRef.current.lightingState });
              }}
              onSetFloorVisible={(visible) => {
                if (!studioRef.current) return;
                studioRef.current.setFloorVisible(visible);
                setLightingState({ ...studioRef.current.lightingState });
              }}
              onSetFloorColor={(color) => {
                if (!studioRef.current) return;
                studioRef.current.setFloorColor(color);
                setLightingState({ ...studioRef.current.lightingState });
              }}
              onSetFloorReflective={(reflective) => {
                if (!studioRef.current) return;
                studioRef.current.setFloorReflective(reflective);
                setLightingState({ ...studioRef.current.lightingState });
              }}
            />
          )}
        </div>
      </div>

      {/* 3. Bottom Skelly-Style Instant Posing Bar */}
      <SkellyPoseBar
        activeRig={activeRig}
        selectedJointKey={selectedJointKey}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onApplyPoseTemplate={handleApplyPoseTemplate}
        onResetJoint={handleResetJoint}
        onResetLimb={handleResetLimb}
        onResetAllPose={handleResetAllPose}
        onMirrorPose={handleMirrorPose}
        onNudgeAngle={handleNudgeAngle}
        onToggleLimits={handleToggleLimits}
        animationState={animationPlayerState}
        onPlayAnimation={handlePlayAnimation}
        onPauseAnimation={handlePauseAnimation}
        onResumeAnimation={handleResumeAnimation}
        onStopAnimation={handleStopAnimation}
        onSeekAnimation={handleSeekAnimation}
        onSetAnimationSpeed={handleSetAnimationSpeed}
        onToggleRootMotion={handleToggleRootMotion}
        onToggleLoop={handleToggleLoop}
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
        savedPoses={savedPoses}
        onSaveCurrentPose={handleSaveCurrentPoseWithPhoto}
        onApplySavedPose={handleApplySavedPose}
        onDeleteSavedPose={handleDeleteSavedPose}
        currentPreviewThumbnail={previewThumbnail}
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
