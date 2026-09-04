import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'einsatznummer',
    'einsatzdatum',
    { row: ['geplante_startzeit', 'geplante_endzeit'] },
    'status',
    'terminwuensche',
    'kunde',
    'routenreihenfolge',
    'gesamtstrecke_km',
    'startpunkt',
    'routennotizen',
    'mitarbeiter',
    'fahrzeuge',
    'arbeitszeit_eingehalten',
    'pause_geplant',
    'pausendauer_min',
    'ueberstunden_begruendung',
    'interne_notizen',
  ],
  defaults: {
    'status': { kind: 'lookup', key: 'geplant', label: 'Geplant' },
    'einsatzdatum': { kind: 'today' },
    'geplante_startzeit': { kind: 'today', withTime: true },
    'geplante_endzeit': { kind: 'todayOffset', days: 0, withTime: true },
    'pausendauer_min': { kind: 'literal', value: 30 },
    'arbeitszeit_eingehalten': { kind: 'literal', value: false },
    'pause_geplant': { kind: 'literal', value: false },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};
