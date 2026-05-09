export interface IEM {
  name: string;
  manufacturer: string;
  id: string;
  sourceUrl?: string;
}

export interface FrequencyResponsePoint {
  frequency: number;
  raw: number;
  target?: number;
  equalized?: number;
}

export interface EQBand {
  frequency: number;
  gain: number;
  q: number;
  type: 'peak' | 'lowshelf' | 'highshelf';
}
