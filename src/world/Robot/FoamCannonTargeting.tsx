import { memo, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { robotMotionBridge, useRobotStore } from '@/store/robotStore';

function isDescendantOf(obj: THREE.Object3D | null, targetName: string): boolean {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (curr.name === targetName) return true;
    curr = curr.parent;
  }
  return false;
}

/**
 * Controlador Contínuo de Mira 3D do Canhão de Espuma a 60 FPS:
 * - Rastreia o ponteiro do mouse em tempo real sobre toda a cena 3D (paredes, móveis, chão e objetos)
 * - Converte a posição do cursor em coordenadas mundiais 3D exatas e vetor normal da face
 * - Permite que o canhão lateral do robô acompanhe instantaneamente o mouse
 * - Permite disparo imediato com clique em qualquer parte do ambiente 3D
 */
export const FoamCannonTargeting = memo(function FoamCannonTargeting() {
  const { gl, scene } = useThree();
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const fallbackTarget = useRef(new THREE.Vector3());
  const normalMat = useRef(new THREE.Matrix3());
  const worldNormal = useRef(new THREE.Vector3());
  const isPointerDownRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  // Gerencia o cursor visual 'crosshair' no Canvas quando a mira estiver armada
  useEffect(() => {
    const unsub = useRobotStore.subscribe((state) => {
      if (state.isCannonAiming) {
        gl.domElement.style.cursor = 'crosshair';
      } else {
        gl.domElement.style.cursor = 'auto';
      }
    });

    // Listener nativo no Canvas para garantir disparo com clique em qualquer ponto
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isPointerDownRef.current = true;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPointerDownRef.current || e.button !== 0) return;
      isPointerDownRef.current = false;

      // Se o usuário arrastou para orbitar a câmera, ignora o disparo
      const distMoved = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y
      );
      if (distMoved > 16) return;

      const isAiming = robotMotionBridge.isCannonAiming || useRobotStore.getState().isCannonAiming;
      if (isAiming) {
        useRobotStore.getState().fireFoamCannon({
          x: robotMotionBridge.foamTargetX,
          y: robotMotionBridge.foamTargetY,
          z: robotMotionBridge.foamTargetZ,
          nx: robotMotionBridge.foamTargetNormalX,
          ny: robotMotionBridge.foamTargetNormalY,
          nz: robotMotionBridge.foamTargetNormalZ,
        });
      }
    };

    const dom = gl.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointerup', handlePointerUp);

    return () => {
      unsub();
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.style.cursor = 'auto';
    };
  }, [gl]);

  useFrame((state) => {
    const isAiming = robotMotionBridge.isCannonAiming || useRobotStore.getState().isCannonAiming;
    if (!isAiming) return;

    // Projeta o raio da câmera a partir do ponteiro normalizado (-1 a +1)
    state.raycaster.setFromCamera(state.pointer, state.camera);

    // Intersecta todos os objetos da cena
    const intersects = state.raycaster.intersectObjects(scene.children, true);

    // Filtra para encontrar o primeiro ponto válido que não seja o próprio robô ou suas bolhas
    let foundHit = false;
    for (let i = 0; i < intersects.length; i++) {
      const hit = intersects[i];
      const obj = hit.object;

      // 1. Ignora robô, retículos e sistemas de partículas de espuma
      if (
        obj.name === 'aspitoy-actor' ||
        isDescendantOf(obj, 'aspitoy-actor') ||
        obj.name.startsWith('foam-') ||
        obj.name.includes('cat-foam') ||
        obj.type === 'LineSegments'
      ) {
        continue;
      }

      // 2. Ignora planos de piso invisíveis interativos, poeira e sombras decal
      if (
        obj.name.includes('interactive-floor') ||
        obj.name.includes('floor-dust') ||
        isDescendantOf(obj, 'house-floor-dust-system') ||
        obj.name.includes('sunlight') ||
        obj.name.includes('shadow')
      ) {
        continue;
      }

      // 3. Ignora paredes ocluídas translúcidas pelas quais a câmera está enxergando através
      const meshObj = obj as THREE.Mesh;
      if (meshObj.material) {
        const mat = meshObj.material;
        const opacity = Array.isArray(mat) ? mat[0].opacity : mat.opacity;
        const transparent = Array.isArray(mat) ? mat[0].transparent : mat.transparent;
        if (transparent && opacity < 0.7) {
          continue;
        }
      }

      robotMotionBridge.foamTargetX = hit.point.x;
      robotMotionBridge.foamTargetY = hit.point.y;
      robotMotionBridge.foamTargetZ = hit.point.z;

      if (hit.face?.normal) {
        // Converte a normal local da face para coordenadas mundiais
        normalMat.current.getNormalMatrix(obj.matrixWorld);
        worldNormal.current.copy(hit.face.normal).applyMatrix3(normalMat.current).normalize();

        robotMotionBridge.foamTargetNormalX = worldNormal.current.x;
        robotMotionBridge.foamTargetNormalY = worldNormal.current.y;
        robotMotionBridge.foamTargetNormalZ = worldNormal.current.z;
      } else {
        robotMotionBridge.foamTargetNormalX = 0;
        robotMotionBridge.foamTargetNormalY = 1;
        robotMotionBridge.foamTargetNormalZ = 0;
      }

      foundHit = true;
      break;
    }

    // Se o mouse estiver sobre o horizonte/área vazia, projeta no plano do chão
    if (!foundHit) {
      if (state.raycaster.ray.intersectPlane(groundPlane.current, fallbackTarget.current)) {
        robotMotionBridge.foamTargetX = fallbackTarget.current.x;
        robotMotionBridge.foamTargetY = fallbackTarget.current.y;
        robotMotionBridge.foamTargetZ = fallbackTarget.current.z;
        robotMotionBridge.foamTargetNormalX = 0;
        robotMotionBridge.foamTargetNormalY = 1;
        robotMotionBridge.foamTargetNormalZ = 0;
      }
    }
  });

  return null;
});
