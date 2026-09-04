import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'firmenname',
    'vorname',
    'nachname',
    'telefon',
    'email',
    'strasse',
    'hausnummer',
    { row: ['plz', 'ort'], cols: '1fr 2fr' },
    'waagentyp',
    'anzahl_waagen',
    'serviceart',
    { row: ['wunschzeitraum_von', 'wunschzeitraum_bis'] },
    'bevorzugte_tageszeit',
    'hinweise',
  ],
  defaults: {
    'anzahl_waagen': { kind: 'literal', value: 1 },
    'wunschzeitraum_von': { kind: 'today' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};
