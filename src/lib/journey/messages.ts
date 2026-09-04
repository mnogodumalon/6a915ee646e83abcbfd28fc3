/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - kundenstamm: firmenname (Firmenname), vorname (Ansprechpartner Vorname), nachname (Ansprechpartner Nachname), strasse (Straße), hausnummer (Hausnummer), plz (Postleitzahl), ort (Ort)
 *   - mitarbeiterstamm: vorname (Vorname), nachname (Nachname)
 *   - fahrzeugstamm: kennzeichen (Kennzeichen), bezeichnung (Bezeichnung), fahrzeugtyp (Fahrzeugtyp)
 *   - terminwunsch: firmenname (Firmenname), vorname (Vorname), nachname (Nachname), telefon (Telefon), strasse (Straße), hausnummer (Hausnummer), plz (Postleitzahl), ort (Ort), waagentyp (Waagentyp), anzahl_waagen (Anzahl der Waagen), serviceart (Gewünschte Serviceart), wunschzeitraum_von (Gewünschter Zeitraum – Von)
 *   - einsatzplanung: einsatznummer (Einsatznummer), einsatzdatum (Einsatzdatum), geplante_startzeit (Geplante Startzeit), geplante_endzeit (Geplante Endzeit), status (Status), terminwuensche (Terminwünsche), mitarbeiter (Zugeordnete Mitarbeiter), fahrzeuge (Zugeordnete Fahrzeuge)
 *   - eichprotokoll: protokollnummer (Protokollnummer), eichungsdatum (Datum der Eichung), einsatz (Zugehöriger Einsatz), kunde (Kunde), waagentyp (Waagentyp), eichergebnis (Eichergebnis), pruefer_vorname (Prüfer Vorname), pruefer_nachname (Prüfer Nachname)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "kundenstamm": "firmenname" | "vorname" | "nachname" | "telefon" | "email" | "strasse" | "hausnummer" | "plz" | "ort" | "standort" | "notizen";
  "mitarbeiterstamm": "vorname" | "nachname" | "personalnummer" | "telefon" | "email" | "fuehrerscheinklasse" | "eichberechtigung" | "qualifikationen" | "arbeitszeitmodell" | "notizen";
  "fahrzeugstamm": "kennzeichen" | "bezeichnung" | "fahrzeugtyp" | "anhaenger_vorhanden" | "max_nutzlast_kg" | "zulassungsdatum" | "naechste_hauptuntersuchung" | "naechste_eichung_fahrzeug" | "notizen";
  "terminwunsch": "firmenname" | "vorname" | "nachname" | "telefon" | "email" | "strasse" | "hausnummer" | "plz" | "ort" | "standort_karte" | "waagentyp" | "anzahl_waagen" | "serviceart" | "wunschzeitraum_von" | "wunschzeitraum_bis" | "bevorzugte_tageszeit" | "hinweise";
  "einsatzplanung": "einsatznummer" | "einsatzdatum" | "geplante_startzeit" | "geplante_endzeit" | "status" | "terminwuensche" | "kunde" | "routenreihenfolge" | "gesamtstrecke_km" | "startpunkt" | "routennotizen" | "mitarbeiter" | "fahrzeuge" | "arbeitszeit_eingehalten" | "pause_geplant" | "pausendauer_min" | "ueberstunden_begruendung" | "interne_notizen";
  "eichprotokoll": "protokollnummer" | "eichungsdatum" | "einsatz" | "kunde" | "waagentyp" | "hersteller" | "seriennummer" | "nennlast_kg" | "eichklasse" | "vorlagewert_kg" | "istwert_kg" | "abweichung_kg" | "eichergebnis" | "pruefmittel" | "eichsiegel_nummer" | "naechste_eichung" | "pruefer_vorname" | "pruefer_nachname" | "bemerkungen";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
