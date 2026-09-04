/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - kundenstamm: no date pair, no references
 *   - mitarbeiterstamm: lookups fuehrerscheinklasse[klasse_b|klasse_be|klasse_c|klasse_ce|klasse_c1|klasse_c1e], arbeitszeitmodell[vollzeit|teilzeit_20|teilzeit_30|minijob]
 *   - fahrzeugstamm: lookups fahrzeugtyp[eichfahrzeug|anhaenger|eichfahrzeug_mit_anhaenger]
 *   - terminwunsch: date pairs wunschzeitraum_von+wunschzeitraum_bis · lookups waagentyp[fahrzeugwaage|plattformwaage|kranwaage|bodenwaage|bandwaage|zaehlwaage|sonstige], bevorzugte_tageszeit[vormittags|nachmittags|ganztags]
 *   - einsatzplanung: applookups terminwuensche→terminwunsch, kunde→kundenstamm, mitarbeiter→mitarbeiterstamm, fahrzeuge→fahrzeugstamm · lookups status[geplant|bestaetigt|in_durchfuehrung|abgeschlossen|storniert]
 *   - eichprotokoll: applookups einsatz→einsatzplanung, kunde→kundenstamm · lookups waagentyp[fahrzeugwaage|plattformwaage|kranwaage|bodenwaage|bandwaage|zaehlwaage|sonstige], eichklasse[klasse_i|klasse_ii|klasse_iii|klasse_iiii], eichergebnis[bestanden|nicht_bestanden|bedingt_bestanden]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};
