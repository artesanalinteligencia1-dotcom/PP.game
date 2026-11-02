// Maps a Design to drawable spacecraft parts. Pure (no React) so it can be tested.
import { evaluateDesign } from '../../engine/evaluate'
import { getArray, getInstrument, getScenario } from '../../engine/catalog'
import type { Design, Discipline } from '../../engine/types'

export type InstrumentShape = 'camera' | 'bigCamera' | 'radar' | 'spectrometer' | 'boom' | 'detector' | 'laser' | 'canister' | 'dishDown'

const SHAPE: Record<string, InstrumentShape> = {
  pan_camera: 'camera',
  multispectral: 'camera',
  hyperspectral: 'camera',
  thermal_ir: 'camera',
  hires_camera: 'bigCamera',
  weather_imager: 'bigCamera',
  sar: 'radar',
  ir_spectrometer: 'spectrometer',
  magnetometer: 'boom',
  particle_detector: 'detector',
  laser_altimeter: 'laser',
  neutron_spectrometer: 'canister',
  mw_radiometer: 'dishDown',
}

export interface SpacecraftVisual {
  /** Bus side length in viewBox units (100×100 canvas centred at 50,50). */
  bus: number
  arrays: { kind: 'body' | 'deployable' | 'tracking' | 'none'; wing: number }
  antenna: string
  propulsion: string
  activeThermal: boolean
  instruments: { id: string; shape: InstrumentShape; discipline: Discipline; name: string }[]
  dryKg: number
}

export function spacecraftVisual(design: Design): SpacecraftVisual {
  const report = evaluateDesign(design, getScenario(design.scenarioId))
  const dry = report.mass.dryKg
  const t = Math.max(0, Math.min(1, Math.log10(Math.max(dry, 20) / 20) / Math.log10(40)))
  const array = getArray(design.arrayId)
  const area = Number.isFinite(design.arrayAreaM2) ? Math.max(0, design.arrayAreaM2) : 0
  const wing = area <= 0 ? 0 : array.id === 'body' ? 0 : Math.min(34, 8 + 26 * Math.sqrt(area / array.maxAreaM2))
  return {
    bus: 16 + 14 * t,
    arrays: { kind: area <= 0 ? 'none' : (array.id as SpacecraftVisual['arrays']['kind']), wing },
    antenna: design.antennaId,
    propulsion: design.propulsionId,
    activeThermal: design.thermalId === 'active',
    instruments: design.instruments
      .filter((i, idx, all) => all.findIndex((x) => x.id === i.id) === idx)
      .map((i) => {
        const inst = getInstrument(i.id)
        return { id: i.id, shape: SHAPE[i.id] ?? 'camera', discipline: inst.discipline, name: inst.name }
      }),
    dryKg: dry,
  }
}
