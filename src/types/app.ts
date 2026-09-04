import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Kundenstamm {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    firmenname?: string;
    vorname?: string;
    nachname?: string;
    telefon?: string;
    email?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    standort?: GeoLocation; // { lat, long, info }
    notizen?: string;
  };
}

export interface Mitarbeiterstamm {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    personalnummer?: string;
    telefon?: string;
    email?: string;
    fuehrerscheinklasse?: LookupValue;
    eichberechtigung?: boolean;
    qualifikationen?: string;
    arbeitszeitmodell?: LookupValue;
    notizen?: string;
  };
}

export interface Fahrzeugstamm {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kennzeichen?: string;
    bezeichnung?: string;
    fahrzeugtyp?: LookupValue;
    anhaenger_vorhanden?: boolean;
    max_nutzlast_kg?: number;
    zulassungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    naechste_hauptuntersuchung?: string; // Format: YYYY-MM-DD oder ISO String
    naechste_eichung_fahrzeug?: string; // Format: YYYY-MM-DD oder ISO String
    notizen?: string;
  };
}

export interface Terminwunsch {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    firmenname?: string;
    vorname?: string;
    nachname?: string;
    telefon?: string;
    email?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    standort_karte?: GeoLocation; // { lat, long, info }
    waagentyp?: LookupValue;
    anzahl_waagen?: number;
    serviceart?: LookupValue[];
    wunschzeitraum_von?: string; // Format: YYYY-MM-DD oder ISO String
    wunschzeitraum_bis?: string; // Format: YYYY-MM-DD oder ISO String
    bevorzugte_tageszeit?: LookupValue;
    hinweise?: string;
  };
}

export interface Einsatzplanung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    einsatznummer?: string;
    einsatzdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geplante_startzeit?: string; // Format: YYYY-MM-DD oder ISO String
    geplante_endzeit?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    terminwuensche?: RecordUrl[];
    kunde?: RecordUrl; // applookup -> URL zu 'Kundenstamm' Record
    routenreihenfolge?: number;
    gesamtstrecke_km?: number;
    startpunkt?: string;
    routennotizen?: string;
    mitarbeiter?: RecordUrl[];
    fahrzeuge?: RecordUrl[];
    arbeitszeit_eingehalten?: boolean;
    pause_geplant?: boolean;
    pausendauer_min?: number;
    ueberstunden_begruendung?: string;
    interne_notizen?: string;
  };
}

export interface Eichprotokoll {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    protokollnummer?: string;
    eichungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    einsatz?: RecordUrl; // applookup -> URL zu 'Einsatzplanung' Record
    kunde?: RecordUrl; // applookup -> URL zu 'Kundenstamm' Record
    waagentyp?: LookupValue;
    hersteller?: string;
    seriennummer?: string;
    nennlast_kg?: number;
    eichklasse?: LookupValue;
    vorlagewert_kg?: number;
    istwert_kg?: number;
    abweichung_kg?: number;
    eichergebnis?: LookupValue;
    pruefmittel?: string;
    eichsiegel_nummer?: string;
    naechste_eichung?: string; // Format: YYYY-MM-DD oder ISO String
    pruefer_vorname?: string;
    pruefer_nachname?: string;
    unterschrift_pruefer?: string;
    fotos?: string;
    bemerkungen?: string;
  };
}

export const APP_IDS = {
  KUNDENSTAMM: '6a915eb6a3afcefe6aab9842',
  MITARBEITERSTAMM: '6a915ebb0bf41370f18f9d4d',
  FAHRZEUGSTAMM: '6a915ebbd06ab60fb9daf37e',
  TERMINWUNSCH: '6a915ebca3ee207b023a4efb',
  EINSATZPLANUNG: '6a915ebc25e861228aa79814',
  EICHPROTOKOLL: '6a915ebd85787d0a3794111a',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitarbeiterstamm': {
    fuehrerscheinklasse: [{ key: "klasse_b", get label() { return lookupLabel('mitarbeiterstamm', 'fuehrerscheinklasse', "klasse_b") ?? "B"; } }, { key: "klasse_be", get label() { return lookupLabel('mitarbeiterstamm', 'fuehrerscheinklasse', "klasse_be") ?? "BE"; } }, { key: "klasse_c", get label() { return lookupLabel('mitarbeiterstamm', 'fuehrerscheinklasse', "klasse_c") ?? "C"; } }, { key: "klasse_ce", get label() { return lookupLabel('mitarbeiterstamm', 'fuehrerscheinklasse', "klasse_ce") ?? "CE"; } }, { key: "klasse_c1", get label() { return lookupLabel('mitarbeiterstamm', 'fuehrerscheinklasse', "klasse_c1") ?? "C1"; } }, { key: "klasse_c1e", get label() { return lookupLabel('mitarbeiterstamm', 'fuehrerscheinklasse', "klasse_c1e") ?? "C1E"; } }],
    arbeitszeitmodell: [{ key: "vollzeit", get label() { return lookupLabel('mitarbeiterstamm', 'arbeitszeitmodell', "vollzeit") ?? "Vollzeit (40 Std./Woche)"; } }, { key: "teilzeit_20", get label() { return lookupLabel('mitarbeiterstamm', 'arbeitszeitmodell', "teilzeit_20") ?? "Teilzeit (20 Std./Woche)"; } }, { key: "teilzeit_30", get label() { return lookupLabel('mitarbeiterstamm', 'arbeitszeitmodell', "teilzeit_30") ?? "Teilzeit (30 Std./Woche)"; } }, { key: "minijob", get label() { return lookupLabel('mitarbeiterstamm', 'arbeitszeitmodell', "minijob") ?? "Minijob"; } }],
  },
  'fahrzeugstamm': {
    fahrzeugtyp: [{ key: "eichfahrzeug", get label() { return lookupLabel('fahrzeugstamm', 'fahrzeugtyp', "eichfahrzeug") ?? "Eichfahrzeug"; } }, { key: "anhaenger", get label() { return lookupLabel('fahrzeugstamm', 'fahrzeugtyp', "anhaenger") ?? "Anhänger"; } }, { key: "eichfahrzeug_mit_anhaenger", get label() { return lookupLabel('fahrzeugstamm', 'fahrzeugtyp', "eichfahrzeug_mit_anhaenger") ?? "Eichfahrzeug mit Anhänger"; } }],
  },
  'terminwunsch': {
    waagentyp: [{ key: "fahrzeugwaage", get label() { return lookupLabel('terminwunsch', 'waagentyp', "fahrzeugwaage") ?? "Fahrzeugwaage"; } }, { key: "plattformwaage", get label() { return lookupLabel('terminwunsch', 'waagentyp', "plattformwaage") ?? "Plattformwaage"; } }, { key: "kranwaage", get label() { return lookupLabel('terminwunsch', 'waagentyp', "kranwaage") ?? "Kranwaage"; } }, { key: "bodenwaage", get label() { return lookupLabel('terminwunsch', 'waagentyp', "bodenwaage") ?? "Bodenwaage"; } }, { key: "bandwaage", get label() { return lookupLabel('terminwunsch', 'waagentyp', "bandwaage") ?? "Bandwaage"; } }, { key: "zaehlwaage", get label() { return lookupLabel('terminwunsch', 'waagentyp', "zaehlwaage") ?? "Zählwaage"; } }, { key: "sonstige", get label() { return lookupLabel('terminwunsch', 'waagentyp', "sonstige") ?? "Sonstige"; } }],
    serviceart: [{ key: "kalibrierung", get label() { return lookupLabel('terminwunsch', 'serviceart', "kalibrierung") ?? "Kalibrierung / Eichung"; } }, { key: "wartung", get label() { return lookupLabel('terminwunsch', 'serviceart', "wartung") ?? "Wartung"; } }, { key: "reparatur", get label() { return lookupLabel('terminwunsch', 'serviceart', "reparatur") ?? "Reparatur"; } }, { key: "erstinbetriebnahme", get label() { return lookupLabel('terminwunsch', 'serviceart', "erstinbetriebnahme") ?? "Erstinbetriebnahme"; } }],
    bevorzugte_tageszeit: [{ key: "vormittags", get label() { return lookupLabel('terminwunsch', 'bevorzugte_tageszeit', "vormittags") ?? "Vormittags (08:00–12:00 Uhr)"; } }, { key: "nachmittags", get label() { return lookupLabel('terminwunsch', 'bevorzugte_tageszeit', "nachmittags") ?? "Nachmittags (12:00–17:00 Uhr)"; } }, { key: "ganztags", get label() { return lookupLabel('terminwunsch', 'bevorzugte_tageszeit', "ganztags") ?? "Ganztags"; } }],
  },
  'einsatzplanung': {
    status: [{ key: "geplant", get label() { return lookupLabel('einsatzplanung', 'status', "geplant") ?? "Geplant"; } }, { key: "bestaetigt", get label() { return lookupLabel('einsatzplanung', 'status', "bestaetigt") ?? "Bestätigt"; } }, { key: "in_durchfuehrung", get label() { return lookupLabel('einsatzplanung', 'status', "in_durchfuehrung") ?? "In Durchführung"; } }, { key: "abgeschlossen", get label() { return lookupLabel('einsatzplanung', 'status', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "storniert", get label() { return lookupLabel('einsatzplanung', 'status', "storniert") ?? "Storniert"; } }],
  },
  'eichprotokoll': {
    waagentyp: [{ key: "fahrzeugwaage", get label() { return lookupLabel('eichprotokoll', 'waagentyp', "fahrzeugwaage") ?? "Fahrzeugwaage"; } }, { key: "plattformwaage", get label() { return lookupLabel('eichprotokoll', 'waagentyp', "plattformwaage") ?? "Plattformwaage"; } }, { key: "kranwaage", get label() { return lookupLabel('eichprotokoll', 'waagentyp', "kranwaage") ?? "Kranwaage"; } }, { key: "bodenwaage", get label() { return lookupLabel('eichprotokoll', 'waagentyp', "bodenwaage") ?? "Bodenwaage"; } }, { key: "bandwaage", get label() { return lookupLabel('eichprotokoll', 'waagentyp', "bandwaage") ?? "Bandwaage"; } }, { key: "zaehlwaage", get label() { return lookupLabel('eichprotokoll', 'waagentyp', "zaehlwaage") ?? "Zählwaage"; } }, { key: "sonstige", get label() { return lookupLabel('eichprotokoll', 'waagentyp', "sonstige") ?? "Sonstige"; } }],
    eichklasse: [{ key: "klasse_i", get label() { return lookupLabel('eichprotokoll', 'eichklasse', "klasse_i") ?? "Klasse I (Feinwaagen)"; } }, { key: "klasse_ii", get label() { return lookupLabel('eichprotokoll', 'eichklasse', "klasse_ii") ?? "Klasse II (Präzisionswaagen)"; } }, { key: "klasse_iii", get label() { return lookupLabel('eichprotokoll', 'eichklasse', "klasse_iii") ?? "Klasse III (Handelswaagen)"; } }, { key: "klasse_iiii", get label() { return lookupLabel('eichprotokoll', 'eichklasse', "klasse_iiii") ?? "Klasse IIII (Grobwaagen)"; } }],
    eichergebnis: [{ key: "bestanden", get label() { return lookupLabel('eichprotokoll', 'eichergebnis', "bestanden") ?? "Bestanden"; } }, { key: "nicht_bestanden", get label() { return lookupLabel('eichprotokoll', 'eichergebnis', "nicht_bestanden") ?? "Nicht bestanden"; } }, { key: "bedingt_bestanden", get label() { return lookupLabel('eichprotokoll', 'eichergebnis', "bedingt_bestanden") ?? "Bedingt bestanden (Auflagen)"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kundenstamm': {
    'firmenname': 'string/text',
    'vorname': 'string/text',
    'nachname': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'standort': 'geo',
    'notizen': 'string/textarea',
  },
  'mitarbeiterstamm': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'personalnummer': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'fuehrerscheinklasse': 'lookup/select',
    'eichberechtigung': 'bool',
    'qualifikationen': 'string/textarea',
    'arbeitszeitmodell': 'lookup/select',
    'notizen': 'string/textarea',
  },
  'fahrzeugstamm': {
    'kennzeichen': 'string/text',
    'bezeichnung': 'string/text',
    'fahrzeugtyp': 'lookup/radio',
    'anhaenger_vorhanden': 'bool',
    'max_nutzlast_kg': 'number',
    'zulassungsdatum': 'date/date',
    'naechste_hauptuntersuchung': 'date/date',
    'naechste_eichung_fahrzeug': 'date/date',
    'notizen': 'string/textarea',
  },
  'terminwunsch': {
    'firmenname': 'string/text',
    'vorname': 'string/text',
    'nachname': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'standort_karte': 'geo',
    'waagentyp': 'lookup/select',
    'anzahl_waagen': 'number',
    'serviceart': 'multiplelookup/checkbox',
    'wunschzeitraum_von': 'date/date',
    'wunschzeitraum_bis': 'date/date',
    'bevorzugte_tageszeit': 'lookup/radio',
    'hinweise': 'string/textarea',
  },
  'einsatzplanung': {
    'einsatznummer': 'string/text',
    'einsatzdatum': 'date/date',
    'geplante_startzeit': 'date/datetimeminute',
    'geplante_endzeit': 'date/datetimeminute',
    'status': 'lookup/select',
    'terminwuensche': 'multipleapplookup/select',
    'kunde': 'applookup/select',
    'routenreihenfolge': 'number',
    'gesamtstrecke_km': 'number',
    'startpunkt': 'string/text',
    'routennotizen': 'string/textarea',
    'mitarbeiter': 'multipleapplookup/select',
    'fahrzeuge': 'multipleapplookup/select',
    'arbeitszeit_eingehalten': 'bool',
    'pause_geplant': 'bool',
    'pausendauer_min': 'number',
    'ueberstunden_begruendung': 'string/textarea',
    'interne_notizen': 'string/textarea',
  },
  'eichprotokoll': {
    'protokollnummer': 'string/text',
    'eichungsdatum': 'date/date',
    'einsatz': 'applookup/select',
    'kunde': 'applookup/select',
    'waagentyp': 'lookup/select',
    'hersteller': 'string/text',
    'seriennummer': 'string/text',
    'nennlast_kg': 'number',
    'eichklasse': 'lookup/select',
    'vorlagewert_kg': 'number',
    'istwert_kg': 'number',
    'abweichung_kg': 'number',
    'eichergebnis': 'lookup/radio',
    'pruefmittel': 'string/textarea',
    'eichsiegel_nummer': 'string/text',
    'naechste_eichung': 'date/date',
    'pruefer_vorname': 'string/text',
    'pruefer_nachname': 'string/text',
    'unterschrift_pruefer': 'file',
    'fotos': 'file',
    'bemerkungen': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKundenstamm = StripLookup<Kundenstamm['fields']>;
export type CreateMitarbeiterstamm = StripLookup<Mitarbeiterstamm['fields']>;
export type CreateFahrzeugstamm = StripLookup<Fahrzeugstamm['fields']>;
export type CreateTerminwunsch = StripLookup<Terminwunsch['fields']>;
export type CreateEinsatzplanung = StripLookup<Einsatzplanung['fields']>;
export type CreateEichprotokoll = StripLookup<Eichprotokoll['fields']>;