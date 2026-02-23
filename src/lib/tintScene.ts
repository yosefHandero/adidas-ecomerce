/**
 * Apply a tint color to all meshes in a Three.js object.
 * Supports MeshStandardMaterial and MeshPhysicalMaterial. Does not mutate the original
 * scene—clone before calling if the same GLB is reused elsewhere.
 */

import type { Object3D } from "three";
import { Color, Mesh, MeshStandardMaterial, MeshPhysicalMaterial } from "three";

export function applyTintToScene(scene: Object3D, tintColor: string): void {
  const color = new Color(tintColor);
  scene.traverse((obj) => {
    if (!(obj instanceof Mesh) || !obj.material) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((mat) => {
      if (mat instanceof MeshStandardMaterial || mat instanceof MeshPhysicalMaterial) {
        mat.color.copy(color);
      } else if (mat && "color" in mat && (mat as { color: Color }).color) {
        (mat as { color: Color }).color.copy(color);
      }
    });
  });
}

