export const G0 = 9.80665 // m/s^2, standard gravity

/** Tsiolkovsky rocket equation: dv = Isp * g0 * ln(wet / dry). Isp in s, dv in m/s. */
export function deltaV(isp: number, wetMass: number, dryMass: number): number {
  if (dryMass <= 0 || wetMass < dryMass) throw new RangeError('require wet >= dry > 0')
  return isp * G0 * Math.log(wetMass / dryMass)
}
