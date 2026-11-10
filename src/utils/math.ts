import type { Vector2D } from '@/types/robot';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Interpolação independente de frame-rate usando delta time (em segundos).
 */
export function damp(current: number, target: number, lambda: number, delta: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}

/**
 * Normaliza diferença angular para o intervalo [-PI, PI] para rotações suaves.
 */
export function shortestAngleDiff(fromRad: number, toRad: number): number {
  const twoPi = Math.PI * 2;
  const diff = ((toRad - fromRad + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  return diff;
}

export function dampAngle(currentRad: number, targetRad: number, lambda: number, delta: number): number {
  const diff = shortestAngleDiff(currentRad, targetRad);
  return currentRad + diff * (1 - Math.exp(-lambda * delta));
}

export function distance2D(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.hypot(dx, dz);
}

