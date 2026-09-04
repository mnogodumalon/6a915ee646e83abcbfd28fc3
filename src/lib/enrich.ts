import type { EnrichedEichprotokoll, EnrichedEinsatzplanung } from '@/types/enriched';
import type { Eichprotokoll, Einsatzplanung, Fahrzeugstamm, Kundenstamm, Mitarbeiterstamm, Terminwunsch } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface EinsatzplanungMaps {
  terminwunschMap: Map<string, Terminwunsch>;
  kundenstammMap: Map<string, Kundenstamm>;
  mitarbeiterstammMap: Map<string, Mitarbeiterstamm>;
  fahrzeugstammMap: Map<string, Fahrzeugstamm>;
}

export function enrichEinsatzplanung(
  einsatzplanung: Einsatzplanung[],
  maps: EinsatzplanungMaps
): EnrichedEinsatzplanung[] {
  return einsatzplanung.map(r => ({
    ...r,
    terminwuenscheName: resolveDisplay(r.fields.terminwuensche, maps.terminwunschMap, 'vorname', 'nachname'),
    kundeName: resolveDisplay(r.fields.kunde, maps.kundenstammMap, 'vorname', 'nachname'),
    mitarbeiterName: resolveDisplay(r.fields.mitarbeiter, maps.mitarbeiterstammMap, 'vorname', 'nachname'),
    fahrzeugeName: resolveDisplay(r.fields.fahrzeuge, maps.fahrzeugstammMap, 'kennzeichen'),
  }));
}

interface EichprotokollMaps {
  einsatzplanungMap: Map<string, Einsatzplanung>;
  kundenstammMap: Map<string, Kundenstamm>;
}

export function enrichEichprotokoll(
  eichprotokoll: Eichprotokoll[],
  maps: EichprotokollMaps
): EnrichedEichprotokoll[] {
  return eichprotokoll.map(r => ({
    ...r,
    einsatzName: resolveDisplay(r.fields.einsatz, maps.einsatzplanungMap, 'einsatznummer'),
    kundeName: resolveDisplay(r.fields.kunde, maps.kundenstammMap, 'vorname', 'nachname'),
  }));
}
