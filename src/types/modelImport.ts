import * as THREE from 'three';

export interface ModelInspectionStats {
  name: string;
  fileSizeFormatted?: string;
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  boneCount: number;
  bonesDetected: string[];
  hasSkinnedMesh: boolean;
  materialCount: number;
  originalDimensions: {
    x: number;
    y: number;
    z: number;
  };
  normalizedHeight: number;
}

export interface CustomModelOptions {
  name: string;
  applyChromeMaterial: boolean;
  normalizeHeight: boolean;
  centerOrigin: boolean;
  replaceTargetId?: string | null;
  materialPresetKey?: string;
}
