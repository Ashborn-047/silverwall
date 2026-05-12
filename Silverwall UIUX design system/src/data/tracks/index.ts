export type { CircuitMetadata } from './types';

export { bahrain } from './bahrain';
export { jeddah } from './jeddah';
export { melbourne } from './melbourne';
export { suzuka } from './suzuka';
export { shanghai } from './shanghai';
export { silverstone } from './silverstone';
export { monza } from './monza';
export { monaco } from './monaco';
export { catalunya } from './catalunya';
export { austin } from './austin';
export { interlagos } from './interlagos';
export { singapore } from './singapore';
export { yas_marina } from './yas_marina';
export { montreal } from './montreal';
export { miami } from './miami';
export { imola } from './imola';
export { baku } from './baku';
export { hungaroring } from './hungaroring';
export { zandvoort } from './zandvoort';
export { mexico_city } from './mexico_city';
export { vegas } from './vegas';
export { qatar } from './qatar';
export { red_bull_ring } from './red_bull_ring';

import { CircuitMetadata } from './types';
import { bahrain } from './bahrain';
import { jeddah } from './jeddah';
import { melbourne } from './melbourne';
import { suzuka } from './suzuka';
import { shanghai } from './shanghai';
import { silverstone } from './silverstone';
import { monza } from './monza';
import { monaco } from './monaco';
import { catalunya } from './catalunya';
import { austin } from './austin';
import { interlagos } from './interlagos';
import { singapore } from './singapore';
import { yas_marina } from './yas_marina';
import { montreal } from './montreal';
import { miami } from './miami';
import { imola } from './imola';
import { baku } from './baku';
import { hungaroring } from './hungaroring';
import { zandvoort } from './zandvoort';
import { mexico_city } from './mexico_city';
import { vegas } from './vegas';
import { qatar } from './qatar';
import { red_bull_ring } from './red_bull_ring';

export const allCircuits: CircuitMetadata[] = [
  bahrain,
  jeddah,
  melbourne,
  suzuka,
  shanghai,
  silverstone,
  monza,
  monaco,
  catalunya,
  austin,
  interlagos,
  singapore,
  yas_marina,
  montreal,
  miami,
  imola,
  baku,
  hungaroring,
  zandvoort,
  mexico_city,
  vegas,
  qatar,
  red_bull_ring
];

export function getCircuitById(id: number): CircuitMetadata | undefined {
  return allCircuits.find(circuit => circuit.id === id);
}
