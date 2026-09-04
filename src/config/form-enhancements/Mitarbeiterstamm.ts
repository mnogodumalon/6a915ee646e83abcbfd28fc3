import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'vorname',
    'nachname',
    'personalnummer',
    'telefon',
    'email',
    'fuehrerscheinklasse',
    'eichberechtigung',
    'arbeitszeitmodell',
    'qualifikationen',
    'notizen',
  ],
  defaults: {
    'eichberechtigung': { kind: 'literal', value: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};
