export type { CircuitMetadata } from './types';

export { bahrain } from './bahrain';
export { jeddah } from './jeddah';
export { melbourne } from './melbourne';
export { suzuka } from './suzuka';
export { shanghai } from './shanghai';
export { silverstone } from './silverstone';
export { monza } from './monza';
export { monaco } from './monaco';
export { spa } from './spa';
export { catalunya } from './catalunya';
export { austin } from './austin';
export { interlagos } from './interlagos';
export { marina_bay } from './marina_bay';
export { yas_marina } from './yas_marina';

import { CircuitMetadata } from './types';
import { bahrain } from './bahrain';
import { jeddah } from './jeddah';
import { melbourne } from './melbourne';
import { suzuka } from './suzuka';
import { shanghai } from './shanghai';
import { silverstone } from './silverstone';
import { monza } from './monza';
import { monaco } from './monaco';
import { spa } from './spa';
import { catalunya } from './catalunya';
import { austin } from './austin';
import { interlagos } from './interlagos';
import { marina_bay } from './marina_bay';
import { yas_marina } from './yas_marina';

export const allCircuits: CircuitMetadata[] = [
  bahrain,
  jeddah,
  melbourne,
  suzuka,
  shanghai,
  silverstone,
  monza,
  monaco,
  spa,
  catalunya,
  austin,
  interlagos,
  marina_bay,
  yas_marina
];

export function getCircuitById(id: number): CircuitMetadata | undefined {
  return allCircuits.find(circuit => circuit.id === id);
}
