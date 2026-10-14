export type JointKey =
  | 'pelvis'
  | 'spine_lumbar'
  | 'spine_thoracic'
  | 'spine_cervical'
  | 'head'
  | 'jaw'
  | 'clavicle_L'
  | 'shoulder_L'
  | 'lower_arm_L'
  | 'wrist_L'
  | 'thumb_L'
  | 'index_L'
  | 'middle_L'
  | 'ring_L'
  | 'pinky_L'
  | 'clavicle_R'
  | 'shoulder_R'
  | 'lower_arm_R'
  | 'wrist_R'
  | 'thumb_R'
  | 'index_R'
  | 'middle_R'
  | 'ring_R'
  | 'pinky_R'
  | 'hip_L'
  | 'knee_L'
  | 'ankle_L'
  | 'toes_L'
  | 'hip_R'
  | 'knee_R'
  | 'ankle_R'
  | 'toes_R';

export interface EulerDegrees {
  x: number;
  y: number;
  z: number;
}

export interface JointLimits {
  min: EulerDegrees;
  max: EulerDegrees;
}

export interface JointDefinition {
  key: JointKey;
  label: string;
  category: 'spine' | 'head' | 'arm_L' | 'arm_R' | 'leg_L' | 'leg_R';
  parentKey?: JointKey;
  defaultPosition: [number, number, number];
  limits: JointLimits;
}

export interface FigurePose {
  joints: Record<JointKey, EulerDegrees>;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export type MultiColorMode =
  | 'solid'
  | 'rainbow_iridescent'
  | 'two_tone_flip'
  | 'gradient_ombre'
  | 'zone_custom'
  | 'rainbow_ribs'
  | 'individual_bones';

export interface OmbreStop {
  id: string;
  color: string;
  position: number; // 0 (feet) to 1 (skull)
  label: string;
}

export interface MaterialSettings {
  name: string;
  metalness: number;
  roughness: number;
  color: string;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence: number;
  iridescenceIOR: number;
  iridescenceThicknessMin: number;
  iridescenceThicknessMax: number;
  multiColorMode?: MultiColorMode;
  secondaryColor?: string;
  accentColor?: string;
  zoneColors?: {
    head?: string;
    spine?: string;
    pelvis?: string;
    arms?: string;
    legs?: string;
  };
  ombreStops?: OmbreStop[];
  ombreDirection?: 'vertical' | 'sagittal' | 'radial';
  boneColors?: Record<string, string>;
  rainbowRibsPalette?: 'prismatic' | 'cyberpunk' | 'fire_ice' | 'toxic_neon' | 'sunset' | 'custom';
}

export interface AnimationPlayerState {
  currentClipId: string | null;
  clipName: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  loop: boolean;
  rootMotion: boolean;
}

export interface SkeletonFigureData {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  ikEnabled: boolean;
  enforceJointLimits: boolean;
  material: MaterialSettings;
  pose: FigurePose;
}

export type StudioLightType = 'key' | 'fill' | 'rim' | 'overhead' | 'strip';

export interface StudioLightConfig {
  id: string;
  name: string;
  type: StudioLightType;
  enabled: boolean;
  color: string;
  intensity: number;
  position: [number, number, number];
  width?: number;
  height?: number;
  castShadow: boolean;
}

export type StudioBackgroundStyle =
  | 'black_gallery'
  | 'high_key'
  | 'deep_indigo'
  | 'dark_platinum'
  | 'studio_seamless'
  | 'sky_clouds'
  | 'ocean_sea'
  | 'sunset'
  | 'cyberpunk'
  | 'custom_image';

export interface LightingStudioState {
  preset: string;
  backgroundStyle: StudioBackgroundStyle;
  backgroundColor?: string;
  backgroundImage?: string | null;
  ambientIntensity: number;
  environmentIntensity: number;
  floorVisible: boolean;
  floorReflective: boolean;
  floorColor: string;
  floorTexture?: string | null;
  floorRepeat?: number;
  lights: StudioLightConfig[];
}

export interface CameraState {
  fov: number;
  isOrthographic: boolean;
  position: [number, number, number];
  target: [number, number, number];
}

export interface StudioProject {
  version: string;
  title: string;
  dateCreated: string;
  dateModified: string;
  figures: SkeletonFigureData[];
  lighting: LightingStudioState;
  camera: CameraState;
}

export interface SavedPoseRecord {
  id: string;
  name: string;
  thumbnail: string; // Base64 data URL photo snapshot
  createdAt: string;
  figureId?: string;
  pose: FigurePose;
  camera?: CameraState;
  material?: MaterialSettings;
  lighting?: LightingStudioState;
}

export type GizmoMode = 'rotate' | 'translate' | 'ik_target';
export type TransformSpace = 'local' | 'world';

export type QualityPreset = 'performance' | 'balanced' | 'high' | 'ultra';

export type AcceptanceTestId =
  | 'TEST_A'
  | 'TEST_B'
  | 'TEST_C'
  | 'TEST_D'
  | 'TEST_E'
  | 'TEST_F'
  | 'TEST_G'
  | 'TEST_H'
  | 'TEST_I'
  | 'TEST_J';

export interface AcceptanceTestRecord {
  id: AcceptanceTestId;
  name: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'NOT TESTED';
  notes: string;
  timestamp?: string;
}
