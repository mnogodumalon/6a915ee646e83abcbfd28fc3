import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'kennzeichen',
    'bezeichnung',
    'fahrzeugtyp',
    'anhaenger_vorhanden',
    'max_nutzlast_kg',
    'zulassungsdatum',
    'naechste_hauptuntersuchung',
    'naechste_eichung_fahrzeug',
    'notizen',
  ],
  defaults: {
    'zulassungsdatum': { kind: 'today' },
    'naechste_hauptuntersuchung': { kind: 'todayOffset', days: 365 },
    'naechste_eichung_fahrzeug': { kind: 'todayOffset', days: 365 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};
