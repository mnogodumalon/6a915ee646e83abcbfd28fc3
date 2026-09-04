/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'kundenstamm' | 'mitarbeiterstamm' | 'fahrzeugstamm' | 'terminwunsch' | 'einsatzplanung' | 'eichprotokoll';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "kundenstamm": "firmenname" | "vorname" | "nachname" | "telefon" | "email" | "strasse" | "hausnummer" | "plz" | "ort" | "notizen";
  "mitarbeiterstamm": "vorname" | "nachname" | "personalnummer" | "telefon" | "email" | "qualifikationen" | "notizen";
  "fahrzeugstamm": "kennzeichen" | "bezeichnung" | "notizen";
  "terminwunsch": "firmenname" | "vorname" | "nachname" | "telefon" | "email" | "strasse" | "hausnummer" | "plz" | "ort" | "hinweise";
  "einsatzplanung": "einsatznummer" | "startpunkt" | "routennotizen" | "ueberstunden_begruendung" | "interne_notizen";
  "eichprotokoll": "protokollnummer" | "hersteller" | "seriennummer" | "pruefmittel" | "eichsiegel_nummer" | "pruefer_vorname" | "pruefer_nachname" | "bemerkungen";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "kundenstamm": {
    "key": "kundenstamm",
    "appId": "6a915eb6a3afcefe6aab9842",
    "label": "Kundenstamm",
    "pascal": "Kundenstamm",
    "single": "KundenstammEntry"
  },
  "mitarbeiterstamm": {
    "key": "mitarbeiterstamm",
    "appId": "6a915ebb0bf41370f18f9d4d",
    "label": "Mitarbeiterstamm",
    "pascal": "Mitarbeiterstamm",
    "single": "MitarbeiterstammEntry"
  },
  "fahrzeugstamm": {
    "key": "fahrzeugstamm",
    "appId": "6a915ebbd06ab60fb9daf37e",
    "label": "Fahrzeugstamm",
    "pascal": "Fahrzeugstamm",
    "single": "FahrzeugstammEntry"
  },
  "terminwunsch": {
    "key": "terminwunsch",
    "appId": "6a915ebca3ee207b023a4efb",
    "label": "Terminwunsch",
    "pascal": "Terminwunsch",
    "single": "TerminwunschEntry"
  },
  "einsatzplanung": {
    "key": "einsatzplanung",
    "appId": "6a915ebc25e861228aa79814",
    "label": "Einsatzplanung",
    "pascal": "Einsatzplanung",
    "single": "EinsatzplanungEntry"
  },
  "eichprotokoll": {
    "key": "eichprotokoll",
    "appId": "6a915ebd85787d0a3794111a",
    "label": "Eichprotokoll",
    "pascal": "Eichprotokoll",
    "single": "EichprotokollEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "kundenstamm": {
    "firmenname": {
      "key": "firmenname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Firmenname",
      "writable": true,
      "maxLength": 4000
    },
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Ansprechpartner Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Ansprechpartner Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "standort": {
      "key": "standort",
      "fulltype": "geo",
      "kind": "geo",
      "required": false,
      "label": "Standort (Kartenauswahl)",
      "writable": true
    },
    "notizen": {
      "key": "notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Notizen",
      "writable": true
    }
  },
  "mitarbeiterstamm": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "personalnummer": {
      "key": "personalnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Personalnummer",
      "writable": true,
      "maxLength": 4000
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "fuehrerscheinklasse": {
      "key": "fuehrerscheinklasse",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Führerscheinklasse",
      "writable": true,
      "options": [
        "klasse_b",
        "klasse_be",
        "klasse_c",
        "klasse_ce",
        "klasse_c1",
        "klasse_c1e"
      ]
    },
    "eichberechtigung": {
      "key": "eichberechtigung",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Eichberechtigung vorhanden",
      "writable": true
    },
    "qualifikationen": {
      "key": "qualifikationen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Weitere Qualifikationen",
      "writable": true
    },
    "arbeitszeitmodell": {
      "key": "arbeitszeitmodell",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Arbeitszeitmodell",
      "writable": true,
      "options": [
        "vollzeit",
        "teilzeit_20",
        "teilzeit_30",
        "minijob"
      ]
    },
    "notizen": {
      "key": "notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Notizen",
      "writable": true
    }
  },
  "fahrzeugstamm": {
    "kennzeichen": {
      "key": "kennzeichen",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kennzeichen",
      "writable": true,
      "maxLength": 4000
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "fahrzeugtyp": {
      "key": "fahrzeugtyp",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Fahrzeugtyp",
      "writable": true,
      "options": [
        "eichfahrzeug",
        "anhaenger",
        "eichfahrzeug_mit_anhaenger"
      ]
    },
    "anhaenger_vorhanden": {
      "key": "anhaenger_vorhanden",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Anhänger vorhanden",
      "writable": true
    },
    "max_nutzlast_kg": {
      "key": "max_nutzlast_kg",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Maximale Nutzlast (kg)",
      "writable": true
    },
    "zulassungsdatum": {
      "key": "zulassungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Zulassungsdatum",
      "writable": true
    },
    "naechste_hauptuntersuchung": {
      "key": "naechste_hauptuntersuchung",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Nächste Hauptuntersuchung",
      "writable": true
    },
    "naechste_eichung_fahrzeug": {
      "key": "naechste_eichung_fahrzeug",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Nächste Fahrzeugeichung",
      "writable": true
    },
    "notizen": {
      "key": "notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Notizen",
      "writable": true
    }
  },
  "terminwunsch": {
    "firmenname": {
      "key": "firmenname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Firmenname",
      "writable": true,
      "maxLength": 4000
    },
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": true,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "standort_karte": {
      "key": "standort_karte",
      "fulltype": "geo",
      "kind": "geo",
      "required": false,
      "label": "Standort auf Karte (optional)",
      "writable": true
    },
    "waagentyp": {
      "key": "waagentyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Waagentyp",
      "writable": true,
      "options": [
        "fahrzeugwaage",
        "plattformwaage",
        "kranwaage",
        "bodenwaage",
        "bandwaage",
        "zaehlwaage",
        "sonstige"
      ]
    },
    "anzahl_waagen": {
      "key": "anzahl_waagen",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Anzahl der Waagen",
      "writable": true
    },
    "serviceart": {
      "key": "serviceart",
      "fulltype": "multiplelookup/checkbox",
      "kind": "multilookup",
      "required": true,
      "label": "Gewünschte Serviceart",
      "writable": true,
      "options": [
        "kalibrierung",
        "wartung",
        "reparatur",
        "erstinbetriebnahme"
      ]
    },
    "wunschzeitraum_von": {
      "key": "wunschzeitraum_von",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Gewünschter Zeitraum – Von",
      "writable": true
    },
    "wunschzeitraum_bis": {
      "key": "wunschzeitraum_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gewünschter Zeitraum – Bis",
      "writable": true
    },
    "bevorzugte_tageszeit": {
      "key": "bevorzugte_tageszeit",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Bevorzugte Tageszeit",
      "writable": true,
      "options": [
        "vormittags",
        "nachmittags",
        "ganztags"
      ]
    },
    "hinweise": {
      "key": "hinweise",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Besondere Hinweise",
      "writable": true
    }
  },
  "einsatzplanung": {
    "einsatznummer": {
      "key": "einsatznummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Einsatznummer",
      "writable": true,
      "maxLength": 4000
    },
    "einsatzdatum": {
      "key": "einsatzdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Einsatzdatum",
      "writable": true
    },
    "geplante_startzeit": {
      "key": "geplante_startzeit",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Geplante Startzeit",
      "writable": true
    },
    "geplante_endzeit": {
      "key": "geplante_endzeit",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Geplante Endzeit",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "geplant",
        "bestaetigt",
        "in_durchfuehrung",
        "abgeschlossen",
        "storniert"
      ]
    },
    "terminwuensche": {
      "key": "terminwuensche",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": true,
      "label": "Terminwünsche",
      "writable": true,
      "targetAppId": "6a915ebca3ee207b023a4efb",
      "targetEntity": "terminwunsch"
    },
    "kunde": {
      "key": "kunde",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Kunde",
      "writable": true,
      "targetAppId": "6a915eb6a3afcefe6aab9842",
      "targetEntity": "kundenstamm"
    },
    "routenreihenfolge": {
      "key": "routenreihenfolge",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Routenreihenfolge (Nummer)",
      "writable": true
    },
    "gesamtstrecke_km": {
      "key": "gesamtstrecke_km",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Geschätzte Gesamtstrecke (km)",
      "writable": true
    },
    "startpunkt": {
      "key": "startpunkt",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Startpunkt der Route",
      "writable": true,
      "maxLength": 4000
    },
    "routennotizen": {
      "key": "routennotizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Routennotizen",
      "writable": true
    },
    "mitarbeiter": {
      "key": "mitarbeiter",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": true,
      "label": "Zugeordnete Mitarbeiter",
      "writable": true,
      "targetAppId": "6a915ebb0bf41370f18f9d4d",
      "targetEntity": "mitarbeiterstamm"
    },
    "fahrzeuge": {
      "key": "fahrzeuge",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": true,
      "label": "Zugeordnete Fahrzeuge",
      "writable": true,
      "targetAppId": "6a915ebbd06ab60fb9daf37e",
      "targetEntity": "fahrzeugstamm"
    },
    "arbeitszeit_eingehalten": {
      "key": "arbeitszeit_eingehalten",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Gesetzliche Arbeitszeit eingehalten",
      "writable": true
    },
    "pause_geplant": {
      "key": "pause_geplant",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Pause(n) eingeplant",
      "writable": true
    },
    "pausendauer_min": {
      "key": "pausendauer_min",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Geplante Pausendauer (Minuten)",
      "writable": true
    },
    "ueberstunden_begruendung": {
      "key": "ueberstunden_begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Begründung bei Überschreitung der Regelarbeitszeit",
      "writable": true
    },
    "interne_notizen": {
      "key": "interne_notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Interne Notizen",
      "writable": true
    }
  },
  "eichprotokoll": {
    "protokollnummer": {
      "key": "protokollnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Protokollnummer",
      "writable": true,
      "maxLength": 4000
    },
    "eichungsdatum": {
      "key": "eichungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Datum der Eichung",
      "writable": true
    },
    "einsatz": {
      "key": "einsatz",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Zugehöriger Einsatz",
      "writable": true,
      "targetAppId": "6a915ebc25e861228aa79814",
      "targetEntity": "einsatzplanung"
    },
    "kunde": {
      "key": "kunde",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Kunde",
      "writable": true,
      "targetAppId": "6a915eb6a3afcefe6aab9842",
      "targetEntity": "kundenstamm"
    },
    "waagentyp": {
      "key": "waagentyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Waagentyp",
      "writable": true,
      "options": [
        "fahrzeugwaage",
        "plattformwaage",
        "kranwaage",
        "bodenwaage",
        "bandwaage",
        "zaehlwaage",
        "sonstige"
      ]
    },
    "hersteller": {
      "key": "hersteller",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hersteller der Waage",
      "writable": true,
      "maxLength": 4000
    },
    "seriennummer": {
      "key": "seriennummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Seriennummer",
      "writable": true,
      "maxLength": 4000
    },
    "nennlast_kg": {
      "key": "nennlast_kg",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Nennlast (kg)",
      "writable": true
    },
    "eichklasse": {
      "key": "eichklasse",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Eichklasse",
      "writable": true,
      "options": [
        "klasse_i",
        "klasse_ii",
        "klasse_iii",
        "klasse_iiii"
      ]
    },
    "vorlagewert_kg": {
      "key": "vorlagewert_kg",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Vorlagewert (kg)",
      "writable": true
    },
    "istwert_kg": {
      "key": "istwert_kg",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Istwert (kg)",
      "writable": true
    },
    "abweichung_kg": {
      "key": "abweichung_kg",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Abweichung (kg)",
      "writable": true
    },
    "eichergebnis": {
      "key": "eichergebnis",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Eichergebnis",
      "writable": true,
      "options": [
        "bestanden",
        "nicht_bestanden",
        "bedingt_bestanden"
      ]
    },
    "pruefmittel": {
      "key": "pruefmittel",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Verwendete Prüfmittel",
      "writable": true
    },
    "eichsiegel_nummer": {
      "key": "eichsiegel_nummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Eichsiegel-Nummer",
      "writable": true,
      "maxLength": 4000
    },
    "naechste_eichung": {
      "key": "naechste_eichung",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Nächste Eichung fällig",
      "writable": true
    },
    "pruefer_vorname": {
      "key": "pruefer_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Prüfer Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "pruefer_nachname": {
      "key": "pruefer_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Prüfer Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "unterschrift_pruefer": {
      "key": "unterschrift_pruefer",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Unterschrift Prüfer (Datei)",
      "writable": false
    },
    "fotos": {
      "key": "fotos",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Fotos vom Einsatz",
      "writable": false
    },
    "bemerkungen": {
      "key": "bemerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkungen",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "kundenstamm": [],
  "mitarbeiterstamm": [
    {
      "kind": "choice",
      "field": "fuehrerscheinklasse",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "arbeitszeitmodell",
      "count": 4
    }
  ],
  "fahrzeugstamm": [
    {
      "kind": "choice",
      "field": "fahrzeugtyp",
      "count": 3
    }
  ],
  "terminwunsch": [
    {
      "kind": "range",
      "from": "wunschzeitraum_von",
      "to": "wunschzeitraum_bis"
    },
    {
      "kind": "choice",
      "field": "bevorzugte_tageszeit",
      "count": 3
    }
  ],
  "einsatzplanung": [
    {
      "kind": "choice",
      "field": "status",
      "count": 5
    },
    {
      "kind": "record",
      "field": "terminwuensche",
      "targetEntity": "terminwunsch"
    },
    {
      "kind": "record",
      "field": "kunde",
      "targetEntity": "kundenstamm"
    },
    {
      "kind": "record",
      "field": "mitarbeiter",
      "targetEntity": "mitarbeiterstamm"
    },
    {
      "kind": "record",
      "field": "fahrzeuge",
      "targetEntity": "fahrzeugstamm"
    }
  ],
  "eichprotokoll": [
    {
      "kind": "choice",
      "field": "eichklasse",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "eichergebnis",
      "count": 3
    },
    {
      "kind": "record",
      "field": "einsatz",
      "targetEntity": "einsatzplanung"
    },
    {
      "kind": "record",
      "field": "kunde",
      "targetEntity": "kundenstamm"
    }
  ]
};

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — runtime bundle first, generated label second. */
export function labelOf(entity: EntityKey, key: string): string {
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
