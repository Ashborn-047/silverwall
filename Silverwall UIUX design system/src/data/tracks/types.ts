export interface CircuitMetadata {
  id: number;
  name: string;
  location: string;
  country: string;
  length_km: number;
  corners: number;
  first_gp: number;
  lap_record: {
    time: string;
    driver: string;
    year: number;
  };
  points: { x: number; y: number }[];
  svg_transform: string;
}
