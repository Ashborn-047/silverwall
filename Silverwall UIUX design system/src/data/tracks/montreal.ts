import { CircuitMetadata } from './types';

export const montreal: CircuitMetadata = {
  id: 23,
  name: "Circuit Gilles Villeneuve",
  location: "Montreal, Canada",
  country: "Canada",
  length_km: 4.361,
  corners: 14,
  first_gp: 1978,
  lap_record: {
    time: "1:13.078",
    driver: "Valtteri Bottas",
    year: 2019
  },
  points: [
    { x: 0.35, y: 0.15 },
    { x: 0.45, y: 0.12 },
    { x: 0.55, y: 0.10 },
    { x: 0.65, y: 0.12 },
    { x: 0.73, y: 0.18 },
    { x: 0.78, y: 0.28 },
    { x: 0.80, y: 0.38 },
    { x: 0.78, y: 0.48 },
    { x: 0.72, y: 0.55 },
    { x: 0.62, y: 0.58 },
    { x: 0.52, y: 0.58 },
    { x: 0.42, y: 0.55 },
    { x: 0.35, y: 0.48 },
    { x: 0.32, y: 0.38 },
    { x: 0.35, y: 0.28 },
    { x: 0.42, y: 0.22 },
    { x: 0.50, y: 0.18 },
    { x: 0.58, y: 0.18 },
    { x: 0.65, y: 0.22 },
    { x: 0.70, y: 0.30 },
    { x: 0.72, y: 0.40 },
    { x: 0.68, y: 0.48 },
    { x: 0.60, y: 0.52 },
    { x: 0.50, y: 0.52 },
    { x: 0.42, y: 0.48 },
    { x: 0.38, y: 0.40 },
    { x: 0.38, y: 0.30 },
    { x: 0.42, y: 0.22 },
    { x: 0.35, y: 0.15 }
  ],
  svg_transform: "scale(1, -1) rotate(-90deg)"
};
