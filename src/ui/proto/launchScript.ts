// Shared choreography for the renderer prototypes (PixiJS / Three.js), so both are compared on the same motion.
// Times in seconds from the start of the loop; heights in "metres" of the prototype world (the tower is 60 m).

export type ProtoLight = 'dawn' | 'day' | 'night'

export const PROTO = {
  armsRetract: [0.8, 2.0] as const,
  ignition: 2.2,
  release: 3.6, // hold-down clamps open once thrust is up
  pitchStart: 5.2, // gravity turn starts after clearing the tower
  maxQ: [6.8, 8.0] as const,
  meco: 9.4,
  end: 13,
  towerHeight: 60,
}

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))

/** Rocket state at loop time t: altitude (m), downrange (m), pitch (rad), throttle 0..1, shake 0..1, stage. */
export function rocketAt(t: number) {
  const P = PROTO
  const thrust = t < P.ignition ? 0 : t < P.release ? clamp((t - P.ignition) / (P.release - P.ignition)) : t < P.meco ? 1 : t < P.meco + 0.6 ? 0 : 1
  // slow first metres: T/W ≈ 1.3 → a ≈ 3 m/s², growing as propellant burns (jerk term)
  const tf = Math.max(0, t - P.release)
  const alt = 1.5 * tf * tf + 0.9 * tf * tf * tf
  const pitch = t < P.pitchStart ? 0 : 0.35 * clamp((t - P.pitchStart) / 6) ** 1.2
  const down = alt * Math.sin(pitch) * 0.6
  const shake = t < P.ignition ? 0 : t < P.release + 1.5 ? 1 - clamp((t - P.release) / 1.5) * 0.7 : clamp(1 - (t - P.release - 1.5) / 3) * 0.3
  const stage = t < P.meco ? 1 : 2
  const vapor = t > P.maxQ[0] && t < P.maxQ[1] ? Math.sin(((t - P.maxQ[0]) / (P.maxQ[1] - P.maxQ[0])) * Math.PI) : 0
  const arms = clamp((t - P.armsRetract[0]) / (P.armsRetract[1] - P.armsRetract[0]))
  return { alt, down, pitch, thrust, shake, stage, vapor, arms }
}

export function protoCaption(t: number) {
  const P = PROTO
  if (t < P.armsRetract[1]) return 'Service arms swing away. Final seconds.'
  if (t < P.release) return 'Ignition — clamps hold the rocket while thrust builds.'
  if (t < P.pitchStart) return 'Liftoff! Thrust is only ~1.3× the weight, so the first metres are slow.'
  if (t < P.maxQ[0]) return 'Clear of the tower: gravity turn begins.'
  if (t < P.maxQ[1]) return 'Max-Q — the air pushes hardest; vapour forms around the rocket.'
  if (t < P.meco + 0.6) return 'Main engine cut-off and stage separation.'
  return 'Second stage burns on in thin air — the plume spreads wide.'
}
