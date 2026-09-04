import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'protokollnummer',
    'eichungsdatum',
    'einsatz',
    'kunde',
    'waagentyp',
    'eichklasse',
    'hersteller',
    'seriennummer',
    'nennlast_kg',
    { row: ['vorlagewert_kg', 'istwert_kg', 'abweichung_kg'] },
    'eichergebnis',
    'pruefmittel',
    'eichsiegel_nummer',
    'naechste_eichung',
    { row: ['pruefer_vorname', 'pruefer_nachname'] },
    'bemerkungen',
  ],
  defaults: {
    'eichungsdatum': { kind: 'today' },
    'eichergebnis': { kind: 'lookup', key: 'bestanden', label: 'Bestanden' },
  },
  computed: {
    'abweichung_kg': { op: 'sub', left: { kind: 'field', key: 'istwert_kg' }, right: { kind: 'field', key: 'vorlagewert_kg' } },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
