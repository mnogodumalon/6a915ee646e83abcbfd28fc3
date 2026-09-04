/**
 * EinsatzplanungDialog — pre-generated create/edit dialog for Einsatzplanung.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * terminwunschList (full hook array — resolves the Terminwunsch applookup),
 * kundenstammList (full hook array — resolves the Kundenstamm applookup),
 * mitarbeiterstammList (full hook array — resolves the Mitarbeiterstamm applookup),
 * fahrzeugstammList (full hook array — resolves the Fahrzeugstamm applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * EinsatzplanungDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Einsatzplanung['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<EinsatzplanungDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Einsatzplanung, Terminwunsch, Kundenstamm, Mitarbeiterstamm, Fahrzeugstamm, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, extractRecordIds, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Einsatzplanung';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import { Combobox, MultiCombobox } from '@/components/Combobox';
import { TerminwunschDialog } from '@/components/dialogs/TerminwunschDialog';
import { KundenstammDialog } from '@/components/dialogs/KundenstammDialog';
import { MitarbeiterstammDialog } from '@/components/dialogs/MitarbeiterstammDialog';
import { FahrzeugstammDialog } from '@/components/dialogs/FahrzeugstammDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for EinsatzplanungDialog.defaultValues — see file header. */
export type EinsatzplanungDialogDefaults = Omit<Einsatzplanung['fields'], 'status'> & {
    status?: LookupValue | string;
  };

interface EinsatzplanungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Einsatzplanung['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: EinsatzplanungDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  terminwunschList: Terminwunsch[];
  kundenstammList: Kundenstamm[];
  mitarbeiterstammList: Mitarbeiterstamm[];
  fahrzeugstammList: Fahrzeugstamm[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  status: LOOKUP_OPTIONS['einsatzplanung']?.['status'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  terminwuensche: APP_IDS.TERMINWUNSCH,
  kunde: APP_IDS.KUNDENSTAMM,
  mitarbeiter: APP_IDS.MITARBEITERSTAMM,
  fahrzeuge: APP_IDS.FAHRZEUGSTAMM,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function EinsatzplanungDialog({ open, onClose, onSubmit, defaultValues, recordId, terminwunschList, kundenstammList, mitarbeiterstammList, fahrzeugstammList, enablePhotoScan = true, enablePhotoLocation = true }: EinsatzplanungDialogProps) {
  const [fields, setFields] = useState<Partial<Einsatzplanung['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Terminwunsch" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraTerminwunsch` list, and select it in
  // the originating Combobox via the captured `createTerminwunschField`.
  const [createTerminwunschOpen, setCreateTerminwunschOpen] = useState(false);
  const [createTerminwunschInitial, setCreateTerminwunschInitial] = useState('');
  const [createTerminwunschField, setCreateTerminwunschField] = useState<string>('');
  const [extraTerminwunsch, setExtraTerminwunsch] = useState< Terminwunsch[]>([]);
  const terminwunschListAll = useMemo(
    () => [...terminwunschList, ...extraTerminwunsch],
    [terminwunschList, extraTerminwunsch],
  );
  function openCreateTerminwunsch(fieldKey: string, q: string) {
    setCreateTerminwunschField(fieldKey);
    setCreateTerminwunschInitial(q);
    setCreateTerminwunschOpen(true);
  }
  // Inline-Create state for "Kundenstamm" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraKundenstamm` list, and select it in
  // the originating Combobox via the captured `createKundenstammField`.
  const [createKundenstammOpen, setCreateKundenstammOpen] = useState(false);
  const [createKundenstammInitial, setCreateKundenstammInitial] = useState('');
  const [createKundenstammField, setCreateKundenstammField] = useState<string>('');
  const [extraKundenstamm, setExtraKundenstamm] = useState< Kundenstamm[]>([]);
  const kundenstammListAll = useMemo(
    () => [...kundenstammList, ...extraKundenstamm],
    [kundenstammList, extraKundenstamm],
  );
  function openCreateKundenstamm(fieldKey: string, q: string) {
    setCreateKundenstammField(fieldKey);
    setCreateKundenstammInitial(q);
    setCreateKundenstammOpen(true);
  }
  // Inline-Create state for "Mitarbeiterstamm" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraMitarbeiterstamm` list, and select it in
  // the originating Combobox via the captured `createMitarbeiterstammField`.
  const [createMitarbeiterstammOpen, setCreateMitarbeiterstammOpen] = useState(false);
  const [createMitarbeiterstammInitial, setCreateMitarbeiterstammInitial] = useState('');
  const [createMitarbeiterstammField, setCreateMitarbeiterstammField] = useState<string>('');
  const [extraMitarbeiterstamm, setExtraMitarbeiterstamm] = useState< Mitarbeiterstamm[]>([]);
  const mitarbeiterstammListAll = useMemo(
    () => [...mitarbeiterstammList, ...extraMitarbeiterstamm],
    [mitarbeiterstammList, extraMitarbeiterstamm],
  );
  function openCreateMitarbeiterstamm(fieldKey: string, q: string) {
    setCreateMitarbeiterstammField(fieldKey);
    setCreateMitarbeiterstammInitial(q);
    setCreateMitarbeiterstammOpen(true);
  }
  // Inline-Create state for "Fahrzeugstamm" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraFahrzeugstamm` list, and select it in
  // the originating Combobox via the captured `createFahrzeugstammField`.
  const [createFahrzeugstammOpen, setCreateFahrzeugstammOpen] = useState(false);
  const [createFahrzeugstammInitial, setCreateFahrzeugstammInitial] = useState('');
  const [createFahrzeugstammField, setCreateFahrzeugstammField] = useState<string>('');
  const [extraFahrzeugstamm, setExtraFahrzeugstamm] = useState< Fahrzeugstamm[]>([]);
  const fahrzeugstammListAll = useMemo(
    () => [...fahrzeugstammList, ...extraFahrzeugstamm],
    [fahrzeugstammList, extraFahrzeugstamm],
  );
  function openCreateFahrzeugstamm(fieldKey: string, q: string) {
    setCreateFahrzeugstammField(fieldKey);
    setCreateFahrzeugstammInitial(q);
    setCreateFahrzeugstammOpen(true);
  }
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['einsatznummer', 'einsatzdatum', 'geplante_startzeit', 'geplante_endzeit', 'status', 'terminwuensche', 'mitarbeiter', 'fahrzeuge'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'terminwuensche': terminwunschList,
      'kunde': kundenstammList,
      'mitarbeiter': mitarbeiterstammList,
      'fahrzeuge': fahrzeugstammList,
    },
  }), [terminwunschList, kundenstammList, mitarbeiterstammList, fahrzeugstammList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Einsatzplanung['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'einsatzplanung');
      await onSubmit(clean as Einsatzplanung['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="terminwuensche" entity="Terminwunsch">\n${JSON.stringify(terminwunschList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="kunde" entity="Kundenstamm">\n${JSON.stringify(kundenstammList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="mitarbeiter" entity="Mitarbeiterstamm">\n${JSON.stringify(mitarbeiterstammList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="fahrzeuge" entity="Fahrzeugstamm">\n${JSON.stringify(fahrzeugstammList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "einsatznummer": string | null, // Einsatznummer\n  "einsatzdatum": string | null, // YYYY-MM-DD\n  "geplante_startzeit": string | null, // YYYY-MM-DDTHH:MM\n  "geplante_endzeit": string | null, // YYYY-MM-DDTHH:MM\n  "status": LookupValue | null, // Status (select one key: "geplant" | "bestaetigt" | "in_durchfuehrung" | "abgeschlossen" | "storniert") mapping: geplant=Geplant, bestaetigt=Bestätigt, in_durchfuehrung=In Durchführung, abgeschlossen=Abgeschlossen, storniert=Storniert\n  "terminwuensche": string[] | null, // Display names from Terminwunsch, one per referenced record (see <available-records>)\n  "kunde": string | null, // Display name from Kundenstamm (see <available-records>)\n  "routenreihenfolge": number | null, // Routenreihenfolge (Nummer)\n  "gesamtstrecke_km": number | null, // Geschätzte Gesamtstrecke (km)\n  "startpunkt": string | null, // Startpunkt der Route\n  "routennotizen": string | null, // Routennotizen\n  "mitarbeiter": string[] | null, // Display names from Mitarbeiterstamm, one per referenced record (see <available-records>)\n  "fahrzeuge": string[] | null, // Display names from Fahrzeugstamm, one per referenced record (see <available-records>)\n  "arbeitszeit_eingehalten": boolean | null, // Gesetzliche Arbeitszeit eingehalten\n  "pause_geplant": boolean | null, // Pause(n) eingeplant\n  "pausendauer_min": number | null, // Geplante Pausendauer (Minuten)\n  "ueberstunden_begruendung": string | null, // Begründung bei Überschreitung der Regelarbeitszeit\n  "interne_notizen": string | null, // Interne Notizen\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["terminwuensche", "kunde", "mitarbeiter", "fahrzeuge"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const terminwuenscheNames = raw['terminwuensche'];
        if (Array.isArray(terminwuenscheNames) && terminwuenscheNames.length > 0) {
          const terminwuenscheUrls = (terminwuenscheNames as unknown[])
            .map(n => terminwunschList.find(r => matchName(String(n), [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.TERMINWUNSCH, r.record_id));
          if (terminwuenscheUrls.length > 0) merged['terminwuensche'] = terminwuenscheUrls;
        }
        const kundeName = raw['kunde'] as string | null;
        if (kundeName) {
          const kundeMatch = kundenstammList.find(r => matchName(kundeName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (kundeMatch) merged['kunde'] = createRecordUrl(APP_IDS.KUNDENSTAMM, kundeMatch.record_id);
        }
        const mitarbeiterNames = raw['mitarbeiter'];
        if (Array.isArray(mitarbeiterNames) && mitarbeiterNames.length > 0) {
          const mitarbeiterUrls = (mitarbeiterNames as unknown[])
            .map(n => mitarbeiterstammList.find(r => matchName(String(n), [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.MITARBEITERSTAMM, r.record_id));
          if (mitarbeiterUrls.length > 0) merged['mitarbeiter'] = mitarbeiterUrls;
        }
        const fahrzeugeNames = raw['fahrzeuge'];
        if (Array.isArray(fahrzeugeNames) && fahrzeugeNames.length > 0) {
          const fahrzeugeUrls = (fahrzeugeNames as unknown[])
            .map(n => fahrzeugstammList.find(r => matchName(String(n), [String(r.fields.kennzeichen ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.FAHRZEUGSTAMM, r.record_id));
          if (fahrzeugeUrls.length > 0) merged['fahrzeuge'] = fahrzeugeUrls;
        }
        return merged as Partial<Einsatzplanung['fields']>;
      });
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('einsatzplanung') })
    : t('new_entity', { entity: appLabel('einsatzplanung') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'einsatznummer': (
      <div key="einsatznummer" className="space-y-1.5">
        <Label htmlFor="einsatznummer">{fieldLabel('einsatzplanung', 'einsatznummer')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="einsatznummer"
          placeholder="z. B. EP-2026-0042"
          value={fields.einsatznummer ?? ''}
          onChange={e => setFields(f => ({ ...f, einsatznummer: e.target.value }))}
          required
        />
        {showErrors && !fields.einsatznummer && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'einsatznummer')}</p>
        )}
      </div>
    ),
    'einsatzdatum': (
      <div key="einsatzdatum" className="space-y-1.5">
        <Label htmlFor="einsatzdatum">{fieldLabel('einsatzplanung', 'einsatzdatum')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="einsatzdatum"
          placeholder="Wann ist der Einsatz?"
          mode="date"
          value={fields.einsatzdatum ?? null}
          onChange={v => setFields(f => ({ ...f, einsatzdatum: v ?? undefined }))}
          required
        />
        {showErrors && !fields.einsatzdatum && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'einsatzdatum')}</p>
        )}
      </div>
    ),
    'geplante_startzeit': (
      <div key="geplante_startzeit" className="space-y-1.5">
        <Label htmlFor="geplante_startzeit">{fieldLabel('einsatzplanung', 'geplante_startzeit')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="geplante_startzeit"
          placeholder="Wann beginnt der Einsatz?"
          mode="datetime"
          value={fields.geplante_startzeit ?? null}
          onChange={v => setFields(f => ({ ...f, geplante_startzeit: v ?? undefined }))}
          required
        />
        {showErrors && !fields.geplante_startzeit && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'geplante_startzeit')}</p>
        )}
      </div>
    ),
    'geplante_endzeit': (
      <div key="geplante_endzeit" className="space-y-1.5">
        <Label htmlFor="geplante_endzeit">{fieldLabel('einsatzplanung', 'geplante_endzeit')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="geplante_endzeit"
          placeholder="Wann endet der Einsatz?"
          mode="datetime"
          value={fields.geplante_endzeit ?? null}
          onChange={v => setFields(f => ({ ...f, geplante_endzeit: v ?? undefined }))}
          required
        />
        {showErrors && !fields.geplante_endzeit && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'geplante_endzeit')}</p>
        )}
      </div>
    ),
    'status': (
      <div key="status" className="space-y-1.5">
        <Label htmlFor="status">{fieldLabel('einsatzplanung', 'status')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'geplant'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'geplant' ? undefined : 'geplant') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'geplant'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('einsatzplanung', 'status', 'geplant') ?? 'Geplant'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'bestaetigt'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'bestaetigt' ? undefined : 'bestaetigt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'bestaetigt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('einsatzplanung', 'status', 'bestaetigt') ?? 'Bestätigt'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'in_durchfuehrung'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'in_durchfuehrung' ? undefined : 'in_durchfuehrung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'in_durchfuehrung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('einsatzplanung', 'status', 'in_durchfuehrung') ?? 'In Durchführung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'abgeschlossen'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'abgeschlossen' ? undefined : 'abgeschlossen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'abgeschlossen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('einsatzplanung', 'status', 'abgeschlossen') ?? 'Abgeschlossen'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'storniert'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'storniert' ? undefined : 'storniert') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'storniert'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('einsatzplanung', 'status', 'storniert') ?? 'Storniert'}
          </button>
        </div>
        {showErrors && !fields.status && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'status')}</p>
        )}
      </div>
    ),
    'terminwuensche': (
      <div key="terminwuensche" className="space-y-1.5">
        <Label htmlFor="terminwuensche">{fieldLabel('einsatzplanung', 'terminwuensche')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <MultiCombobox
          id="terminwuensche"
          placeholder="Ein oder mehr Terminwünsche"
          items={terminwunschListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.firmenname ?? r.record_id),
          }))}
          values={extractRecordIds(fields.terminwuensche)}
          onChange={ids => setFields(f => ({ ...f, terminwuensche: ids.length ? ids.map(id => createRecordUrl(APP_IDS.TERMINWUNSCH, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateTerminwunsch("terminwuensche", q)}
          createLabel={t('create_in', { entity: appLabel('terminwunsch') })}
        />
        {showErrors && !fields.terminwuensche && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'terminwuensche')}</p>
        )}
      </div>
    ),
    'kunde': (
      <div key="kunde" className="space-y-1.5">
        <Label htmlFor="kunde">{fieldLabel('einsatzplanung', 'kunde')}</Label>
        <Combobox
          id="kunde"
          placeholder="Kunde wählen"
          items={kundenstammListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.firmenname ?? r.record_id),
          }))}
          value={extractRecordId(fields.kunde)}
          onChange={id => setFields(f => ({ ...f, kunde: id ? createRecordUrl(APP_IDS.KUNDENSTAMM, id) : undefined }))}
          onCreateNew={(q) => openCreateKundenstamm("kunde", q)}
          createLabel={t('create_in', { entity: appLabel('kundenstamm') })}
        />
      </div>
    ),
    'routenreihenfolge': (
      <div key="routenreihenfolge" className="space-y-1.5">
        <Label htmlFor="routenreihenfolge">{fieldLabel('einsatzplanung', 'routenreihenfolge')}</Label>
        <Input
          id="routenreihenfolge"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'routenreihenfolge')}
          placeholder="z. B. 1"
          value={fields.routenreihenfolge !== undefined ? fields.routenreihenfolge : (computedValues['routenreihenfolge'] ?? '')}
          onChange={e => setFields(f => ({ ...f, routenreihenfolge: clampNumberValue(formEnhancements, 'routenreihenfolge', e.target.value) }))}
        />
      </div>
    ),
    'gesamtstrecke_km': (
      <div key="gesamtstrecke_km" className="space-y-1.5">
        <Label htmlFor="gesamtstrecke_km">{fieldLabel('einsatzplanung', 'gesamtstrecke_km')}</Label>
        <Input
          id="gesamtstrecke_km"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'gesamtstrecke_km')}
          placeholder="z. B. 45"
          value={fields.gesamtstrecke_km !== undefined ? fields.gesamtstrecke_km : (computedValues['gesamtstrecke_km'] ?? '')}
          onChange={e => setFields(f => ({ ...f, gesamtstrecke_km: clampNumberValue(formEnhancements, 'gesamtstrecke_km', e.target.value) }))}
        />
      </div>
    ),
    'startpunkt': (
      <div key="startpunkt" className="space-y-1.5">
        <Label htmlFor="startpunkt">{fieldLabel('einsatzplanung', 'startpunkt')}</Label>
        <Input
          id="startpunkt"
          placeholder="z. B. Werksgelände Stuttgart"
          value={fields.startpunkt ?? ''}
          onChange={e => setFields(f => ({ ...f, startpunkt: e.target.value }))}
        />
      </div>
    ),
    'routennotizen': (
      <div key="routennotizen" className="space-y-1.5">
        <Label htmlFor="routennotizen">{fieldLabel('einsatzplanung', 'routennotizen')}</Label>
        <Textarea
          id="routennotizen"
          placeholder="Fahrtroute, Besonderheiten, Verkehr..."
          value={fields.routennotizen ?? ''}
          onChange={e => setFields(f => ({ ...f, routennotizen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'mitarbeiter': (
      <div key="mitarbeiter" className="space-y-1.5">
        <Label htmlFor="mitarbeiter">{fieldLabel('einsatzplanung', 'mitarbeiter')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <MultiCombobox
          id="mitarbeiter"
          placeholder="Ein oder mehr Mitarbeiter"
          items={mitarbeiterstammListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          values={extractRecordIds(fields.mitarbeiter)}
          onChange={ids => setFields(f => ({ ...f, mitarbeiter: ids.length ? ids.map(id => createRecordUrl(APP_IDS.MITARBEITERSTAMM, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateMitarbeiterstamm("mitarbeiter", q)}
          createLabel={t('create_in', { entity: appLabel('mitarbeiterstamm') })}
        />
        {showErrors && !fields.mitarbeiter && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'mitarbeiter')}</p>
        )}
      </div>
    ),
    'fahrzeuge': (
      <div key="fahrzeuge" className="space-y-1.5">
        <Label htmlFor="fahrzeuge">{fieldLabel('einsatzplanung', 'fahrzeuge')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <MultiCombobox
          id="fahrzeuge"
          placeholder="Ein oder mehr Fahrzeuge"
          items={fahrzeugstammListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.kennzeichen ?? r.record_id),
          }))}
          values={extractRecordIds(fields.fahrzeuge)}
          onChange={ids => setFields(f => ({ ...f, fahrzeuge: ids.length ? ids.map(id => createRecordUrl(APP_IDS.FAHRZEUGSTAMM, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateFahrzeugstamm("fahrzeuge", q)}
          createLabel={t('create_in', { entity: appLabel('fahrzeugstamm') })}
        />
        {showErrors && !fields.fahrzeuge && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('einsatzplanung', 'fahrzeuge')}</p>
        )}
      </div>
    ),
    'arbeitszeit_eingehalten': (
      <div key="arbeitszeit_eingehalten" className="space-y-1.5">
        <Label htmlFor="arbeitszeit_eingehalten">{fieldLabel('einsatzplanung', 'arbeitszeit_eingehalten')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="arbeitszeit_eingehalten"
            checked={!!fields.arbeitszeit_eingehalten}
            onCheckedChange={(v) => setFields(f => ({ ...f, arbeitszeit_eingehalten: !!v }))}
          />
          <Label htmlFor="arbeitszeit_eingehalten" className="font-normal">{fieldLabel('einsatzplanung', 'arbeitszeit_eingehalten')}</Label>
        </div>
      </div>
    ),
    'pause_geplant': (
      <div key="pause_geplant" className="space-y-1.5">
        <Label htmlFor="pause_geplant">{fieldLabel('einsatzplanung', 'pause_geplant')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="pause_geplant"
            checked={!!fields.pause_geplant}
            onCheckedChange={(v) => setFields(f => ({ ...f, pause_geplant: !!v }))}
          />
          <Label htmlFor="pause_geplant" className="font-normal">{fieldLabel('einsatzplanung', 'pause_geplant')}</Label>
        </div>
      </div>
    ),
    'pausendauer_min': (
      <div key="pausendauer_min" className="space-y-1.5">
        <Label htmlFor="pausendauer_min">{fieldLabel('einsatzplanung', 'pausendauer_min')}</Label>
        <Input
          id="pausendauer_min"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'pausendauer_min')}
          placeholder="z. B. 30"
          value={fields.pausendauer_min !== undefined ? fields.pausendauer_min : (computedValues['pausendauer_min'] ?? '')}
          onChange={e => setFields(f => ({ ...f, pausendauer_min: clampNumberValue(formEnhancements, 'pausendauer_min', e.target.value) }))}
        />
      </div>
    ),
    'ueberstunden_begruendung': (
      <div key="ueberstunden_begruendung" className="space-y-1.5">
        <Label htmlFor="ueberstunden_begruendung">{fieldLabel('einsatzplanung', 'ueberstunden_begruendung')}</Label>
        <Textarea
          id="ueberstunden_begruendung"
          placeholder="Grund für Überschreitung bei Bedarf"
          value={fields.ueberstunden_begruendung ?? ''}
          onChange={e => setFields(f => ({ ...f, ueberstunden_begruendung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'interne_notizen': (
      <div key="interne_notizen" className="space-y-1.5">
        <Label htmlFor="interne_notizen">{fieldLabel('einsatzplanung', 'interne_notizen')}</Label>
        <Textarea
          id="interne_notizen"
          placeholder="Planung, Abstimmung, besondere Vorkehrungen..."
          value={fields.interne_notizen ?? ''}
          onChange={e => setFields(f => ({ ...f, interne_notizen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"einsatznummer": "Einsatznummer", "einsatzdatum": "Einsatzdatum", "geplante_startzeit": "Geplante Startzeit", "geplante_endzeit": "Geplante Endzeit", "status": "Status", "terminwuensche": "Terminwünsche", "kunde": "Kunde", "routenreihenfolge": "Routenreihenfolge (Nummer)", "gesamtstrecke_km": "Geschätzte Gesamtstrecke (km)", "startpunkt": "Startpunkt der Route", "routennotizen": "Routennotizen", "mitarbeiter": "Zugeordnete Mitarbeiter", "fahrzeuge": "Zugeordnete Fahrzeuge", "arbeitszeit_eingehalten": "Gesetzliche Arbeitszeit eingehalten", "pause_geplant": "Pause(n) eingeplant", "pausendauer_min": "Geplante Pausendauer (Minuten)", "ueberstunden_begruendung": "Begründung bei Überschreitung der Regelarbeitszeit", "interne_notizen": "Interne Notizen"};
  const CURRENCY_KEYS = new Set<string>(["gesamtstrecke_km"]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"terminwuensche": {"firmenname": "Firmenname", "vorname": "Vorname", "nachname": "Nachname", "telefon": "Telefon", "email": "E-Mail", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "Postleitzahl", "ort": "Ort", "standort_karte": "Standort auf Karte (optional)", "waagentyp": "Waagentyp", "anzahl_waagen": "Anzahl der Waagen", "serviceart": "Gewünschte Serviceart", "wunschzeitraum_von": "Gewünschter Zeitraum – Von", "wunschzeitraum_bis": "Gewünschter Zeitraum – Bis", "bevorzugte_tageszeit": "Bevorzugte Tageszeit", "hinweise": "Besondere Hinweise"}, "kunde": {"firmenname": "Firmenname", "vorname": "Ansprechpartner Vorname", "nachname": "Ansprechpartner Nachname", "telefon": "Telefon", "email": "E-Mail", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "Postleitzahl", "ort": "Ort", "standort": "Standort (Kartenauswahl)", "notizen": "Notizen"}, "mitarbeiter": {"vorname": "Vorname", "nachname": "Nachname", "personalnummer": "Personalnummer", "telefon": "Telefon", "email": "E-Mail", "fuehrerscheinklasse": "Führerscheinklasse", "eichberechtigung": "Eichberechtigung vorhanden", "qualifikationen": "Weitere Qualifikationen", "arbeitszeitmodell": "Arbeitszeitmodell", "notizen": "Notizen"}, "fahrzeuge": {"kennzeichen": "Kennzeichen", "bezeichnung": "Bezeichnung", "fahrzeugtyp": "Fahrzeugtyp", "anhaenger_vorhanden": "Anhänger vorhanden", "max_nutzlast_kg": "Maximale Nutzlast (kg)", "zulassungsdatum": "Zulassungsdatum", "naechste_hauptuntersuchung": "Nächste Hauptuntersuchung", "naechste_eichung_fahrzeug": "Nächste Fahrzeugeichung", "notizen": "Notizen"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.EINSATZPLANUNG} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createTerminwunschOpen && (
      <TerminwunschDialog
        open={createTerminwunschOpen}
        onClose={() => setCreateTerminwunschOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createTerminwunschEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Terminwunsch;
            setExtraTerminwunsch(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.TERMINWUNSCH, result.id);
            setFields(prev => ({ ...prev, [createTerminwunschField]: url } as any));
          }
          setCreateTerminwunschOpen(false);
        }}
        defaultValues={createTerminwunschInitial
          ? ({ firmenname: createTerminwunschInitial } as any)
          : undefined}
      />
    )}
    {createKundenstammOpen && (
      <KundenstammDialog
        open={createKundenstammOpen}
        onClose={() => setCreateKundenstammOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createKundenstammEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Kundenstamm;
            setExtraKundenstamm(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.KUNDENSTAMM, result.id);
            setFields(prev => ({ ...prev, [createKundenstammField]: url } as any));
          }
          setCreateKundenstammOpen(false);
        }}
        defaultValues={createKundenstammInitial
          ? ({ firmenname: createKundenstammInitial } as any)
          : undefined}
      />
    )}
    {createMitarbeiterstammOpen && (
      <MitarbeiterstammDialog
        open={createMitarbeiterstammOpen}
        onClose={() => setCreateMitarbeiterstammOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createMitarbeiterstammEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Mitarbeiterstamm;
            setExtraMitarbeiterstamm(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.MITARBEITERSTAMM, result.id);
            setFields(prev => ({ ...prev, [createMitarbeiterstammField]: url } as any));
          }
          setCreateMitarbeiterstammOpen(false);
        }}
        defaultValues={createMitarbeiterstammInitial
          ? ({ vorname: createMitarbeiterstammInitial } as any)
          : undefined}
      />
    )}
    {createFahrzeugstammOpen && (
      <FahrzeugstammDialog
        open={createFahrzeugstammOpen}
        onClose={() => setCreateFahrzeugstammOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createFahrzeugstammEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Fahrzeugstamm;
            setExtraFahrzeugstamm(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.FAHRZEUGSTAMM, result.id);
            setFields(prev => ({ ...prev, [createFahrzeugstammField]: url } as any));
          }
          setCreateFahrzeugstammOpen(false);
        }}
        defaultValues={createFahrzeugstammInitial
          ? ({ kennzeichen: createFahrzeugstammInitial } as any)
          : undefined}
      />
    )}
    </>
  );
}