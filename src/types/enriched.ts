import type { Eichprotokoll, Einsatzplanung } from './app';

export type EnrichedEinsatzplanung = Einsatzplanung & {
  terminwuenscheName: string;
  kundeName: string;
  mitarbeiterName: string;
  fahrzeugeName: string;
};

export type EnrichedEichprotokoll = Eichprotokoll & {
  einsatzName: string;
  kundeName: string;
};
