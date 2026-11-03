// Real numbers for the art-direction mock-ups: the Lagrange Observatory with the infrared telescope on the
// low-energy route (the Act 2 reference design), evaluated by the actual engine.
import { evaluateDesign } from '../../engine/evaluate'
import { getInstrument, getScenario } from '../../engine/catalog'
import type { Design } from '../../engine/types'

export function mockData() {
  const scenario = getScenario('lagrange_observatory')
  const design: Design = { ...scenario.baseDesign, instruments: [{ id: 'ir_telescope', duty: 0.3 }], routeId: 'low_energy' }
  const r = evaluateDesign(design, scenario)
  const budgets = [
    { id: 'mass', label: 'Mass', value: r.mass.wetKg, max: r.mass.capacityKg, unit: 'kg', fmt: (n: number) => n.toFixed(0) },
    { id: 'power', label: 'Power', value: r.power.avgLoadW, max: r.power.avgGenEolW, unit: 'W', fmt: (n: number) => n.toFixed(0) },
    { id: 'data', label: 'Data', value: r.data.deliveredGbDay, max: r.data.generatedGbDay, unit: 'Gb/day', fmt: (n: number) => n.toFixed(1), higherIsBetter: true },
    { id: 'cost', label: 'Cost', value: r.cost.totalM, max: r.cost.budgetM, unit: '$M', fmt: (n: number) => n.toFixed(0) },
    { id: 'time', label: 'Schedule', value: r.schedule.devMonths, max: r.schedule.deadlineMonths, unit: 'months', fmt: (n: number) => n.toFixed(0) },
  ]
  return {
    scenario,
    design,
    report: r,
    budgets,
    instruments: design.instruments.map((i) => getInstrument(i.id)),
    advisor: {
      role: 'Astrophysicist',
      text: 'The low-energy route saves us 330 m/s — that is why the telescope fits the Medium rocket. But chaos will ask for corrections: keep the reserve.',
    },
    tabs: ['Mission', 'Payload', 'Spacecraft', 'Orbit & Launch', 'Comms', 'Review'],
  }
}
