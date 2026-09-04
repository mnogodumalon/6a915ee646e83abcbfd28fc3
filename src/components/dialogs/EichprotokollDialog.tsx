/**
 * EichprotokollDialog — pre-generated create/edit dialog for Eichprotokoll.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * einsatzplanungList (full hook array — resolves the Einsatzplanung applookup),
 * kundenstammList (full hook array — resolves the Kundenstamm applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * EichprotokollDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Eichprotokoll['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<EichprotokollDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Eichprotokoll, Einsatzplanung, Kundenstamm, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, uploadFile, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Eichprotokoll';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Combobox';
import { EinsatzplanungDialog } from '@/components/dialogs/EinsatzplanungDialog';
import { KundenstammDialog } from '@/components/dialogs/KundenstammDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode, dataUriToBlob } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for EichprotokollDialog.defaultValues — see file header. */
export type EichprotokollDialogDefaults = Omit<Eichprotokoll['fields'], 'waagentyp' | 'eichklasse' | 'eichergebnis'> & {
    waagentyp?: LookupValue | string;
    eichklasse?: LookupValue | string;
    eichergebnis?: LookupValue | string;
  };

interface EichprotokollDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Eichprotokoll['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: EichprotokollDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  einsatzplanungList: Einsatzplanung[];
  kundenstammList: Kundenstamm[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  waagentyp: LOOKUP_OPTIONS['eichprotokoll']?.['waagentyp'] ?? [],
  eichklasse: LOOKUP_OPTIONS['eichprotokoll']?.['eichklasse'] ?? [],
  eichergebnis: LOOKUP_OPTIONS['eichprotokoll']?.['eichergebnis'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  einsatz: APP_IDS.EINSATZPLANUNG,
  kunde: APP_IDS.KUNDENSTAMM,
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

export function EichprotokollDialog({ open, onClose, onSubmit, defaultValues, recordId, einsatzplanungList, kundenstammList, enablePhotoScan = true, enablePhotoLocation = true }: EichprotokollDialogProps) {
  const [fields, setFields] = useState<Partial<Eichprotokoll['fields']>>({});
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
  // Inline-Create state for "Einsatzplanung" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraEinsatzplanung` list, and select it in
  // the originating Combobox via the captured `createEinsatzplanungField`.
  const [createEinsatzplanungOpen, setCreateEinsatzplanungOpen] = useState(false);
  const [createEinsatzplanungInitial, setCreateEinsatzplanungInitial] = useState('');
  const [createEinsatzplanungField, setCreateEinsatzplanungField] = useState<string>('');
  const [extraEinsatzplanung, setExtraEinsatzplanung] = useState< Einsatzplanung[]>([]);
  const einsatzplanungListAll = useMemo(
    () => [...einsatzplanungList, ...extraEinsatzplanung],
    [einsatzplanungList, extraEinsatzplanung],
  );
  function openCreateEinsatzplanung(fieldKey: string, q: string) {
    setCreateEinsatzplanungField(fieldKey);
    setCreateEinsatzplanungInitial(q);
    setCreateEinsatzplanungOpen(true);
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
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['protokollnummer', 'eichungsdatum', 'einsatz', 'kunde', 'waagentyp', 'eichergebnis', 'pruefer_vorname', 'pruefer_nachname'] as const;
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
      'einsatz': einsatzplanungList,
      'kunde': kundenstammList,
    },
  }), [einsatzplanungList, kundenstammList, ]);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Eichprotokoll['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'eichprotokoll');
      await onSubmit(clean as Eichprotokoll['fields']);
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
      contextParts.push(`<available-records field="einsatz" entity="Einsatzplanung">\n${JSON.stringify(einsatzplanungList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="kunde" entity="Kundenstamm">\n${JSON.stringify(kundenstammList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "protokollnummer": string | null, // Protokollnummer\n  "eichungsdatum": string | null, // YYYY-MM-DD\n  "einsatz": string | null, // Display name from Einsatzplanung (see <available-records>)\n  "kunde": string | null, // Display name from Kundenstamm (see <available-records>)\n  "waagentyp": LookupValue | null, // Waagentyp (select one key: "fahrzeugwaage" | "plattformwaage" | "kranwaage" | "bodenwaage" | "bandwaage" | "zaehlwaage" | "sonstige") mapping: fahrzeugwaage=Fahrzeugwaage, plattformwaage=Plattformwaage, kranwaage=Kranwaage, bodenwaage=Bodenwaage, bandwaage=Bandwaage, zaehlwaage=Zählwaage, sonstige=Sonstige\n  "hersteller": string | null, // Hersteller der Waage\n  "seriennummer": string | null, // Seriennummer\n  "nennlast_kg": number | null, // Nennlast (kg)\n  "eichklasse": LookupValue | null, // Eichklasse (select one key: "klasse_i" | "klasse_ii" | "klasse_iii" | "klasse_iiii") mapping: klasse_i=Klasse I (Feinwaagen), klasse_ii=Klasse II (Präzisionswaagen), klasse_iii=Klasse III (Handelswaagen), klasse_iiii=Klasse IIII (Grobwaagen)\n  "vorlagewert_kg": number | null, // Vorlagewert (kg)\n  "istwert_kg": number | null, // Istwert (kg)\n  "abweichung_kg": number | null, // Abweichung (kg)\n  "eichergebnis": LookupValue | null, // Eichergebnis (select one key: "bestanden" | "nicht_bestanden" | "bedingt_bestanden") mapping: bestanden=Bestanden, nicht_bestanden=Nicht bestanden, bedingt_bestanden=Bedingt bestanden (Auflagen)\n  "pruefmittel": string | null, // Verwendete Prüfmittel\n  "eichsiegel_nummer": string | null, // Eichsiegel-Nummer\n  "naechste_eichung": string | null, // YYYY-MM-DD\n  "pruefer_vorname": string | null, // Prüfer Vorname\n  "pruefer_nachname": string | null, // Prüfer Nachname\n  "bemerkungen": string | null, // Bemerkungen\n}`;
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
        const applookupKeys = new Set<string>(["einsatz", "kunde"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const einsatzName = raw['einsatz'] as string | null;
        if (einsatzName) {
          const einsatzMatch = einsatzplanungList.find(r => matchName(einsatzName!, [String(r.fields.einsatznummer ?? '')]));
          if (einsatzMatch) merged['einsatz'] = createRecordUrl(APP_IDS.EINSATZPLANUNG, einsatzMatch.record_id);
        }
        const kundeName = raw['kunde'] as string | null;
        if (kundeName) {
          const kundeMatch = kundenstammList.find(r => matchName(kundeName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (kundeMatch) merged['kunde'] = createRecordUrl(APP_IDS.KUNDENSTAMM, kundeMatch.record_id);
        }
        return merged as Partial<Eichprotokoll['fields']>;
      });
      // Upload scanned file to file fields
      if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        try {
          const blob = dataUriToBlob(uri!);
          const fileUrl = await uploadFile(blob, file.name);
          setFields(prev => ({ ...prev, unterschrift_pruefer: fileUrl }));
          setFields(prev => ({ ...prev, fotos: fileUrl }));
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }
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
    ? t('edit_entity', { entity: appLabel('eichprotokoll') })
    : t('new_entity', { entity: appLabel('eichprotokoll') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'protokollnummer': (
      <div key="protokollnummer" className="space-y-1.5">
        <Label htmlFor="protokollnummer">{fieldLabel('eichprotokoll', 'protokollnummer')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="protokollnummer"
          placeholder="z. B. EP-2026-1234"
          value={fields.protokollnummer ?? ''}
          onChange={e => setFields(f => ({ ...f, protokollnummer: e.target.value }))}
          required
        />
        {showErrors && !fields.protokollnummer && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'protokollnummer')}</p>
        )}
      </div>
    ),
    'eichungsdatum': (
      <div key="eichungsdatum" className="space-y-1.5">
        <Label htmlFor="eichungsdatum">{fieldLabel('eichprotokoll', 'eichungsdatum')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="eichungsdatum"
          placeholder="Wann wurde geicht?"
          mode="date"
          value={fields.eichungsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, eichungsdatum: v ?? undefined }))}
          required
        />
        {showErrors && !fields.eichungsdatum && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'eichungsdatum')}</p>
        )}
      </div>
    ),
    'einsatz': (
      <div key="einsatz" className="space-y-1.5">
        <Label htmlFor="einsatz">{fieldLabel('eichprotokoll', 'einsatz')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="einsatz"
          placeholder="Zugehöriger Einsatz"
          items={einsatzplanungListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.einsatznummer ?? r.record_id),
          }))}
          value={extractRecordId(fields.einsatz)}
          onChange={id => setFields(f => ({ ...f, einsatz: id ? createRecordUrl(APP_IDS.EINSATZPLANUNG, id) : undefined }))}
          onCreateNew={(q) => openCreateEinsatzplanung("einsatz", q)}
          createLabel={t('create_in', { entity: appLabel('einsatzplanung') })}
        />
        {showErrors && !fields.einsatz && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'einsatz')}</p>
        )}
      </div>
    ),
    'kunde': (
      <div key="kunde" className="space-y-1.5">
        <Label htmlFor="kunde">{fieldLabel('eichprotokoll', 'kunde')} <span className="text-destructive" aria-hidden="true">*</span></Label>
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
        {showErrors && !fields.kunde && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'kunde')}</p>
        )}
      </div>
    ),
    'waagentyp': (
      <div key="waagentyp" className="space-y-1.5">
        <Label htmlFor="waagentyp">{fieldLabel('eichprotokoll', 'waagentyp')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.waagentyp) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, waagentyp: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="waagentyp" className="max-sm:h-11"><SelectValue placeholder="Waagenart?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="fahrzeugwaage">{lookupLabel('eichprotokoll', 'waagentyp', 'fahrzeugwaage') ?? 'Fahrzeugwaage'}</SelectItem>
            <SelectItem value="plattformwaage">{lookupLabel('eichprotokoll', 'waagentyp', 'plattformwaage') ?? 'Plattformwaage'}</SelectItem>
            <SelectItem value="kranwaage">{lookupLabel('eichprotokoll', 'waagentyp', 'kranwaage') ?? 'Kranwaage'}</SelectItem>
            <SelectItem value="bodenwaage">{lookupLabel('eichprotokoll', 'waagentyp', 'bodenwaage') ?? 'Bodenwaage'}</SelectItem>
            <SelectItem value="bandwaage">{lookupLabel('eichprotokoll', 'waagentyp', 'bandwaage') ?? 'Bandwaage'}</SelectItem>
            <SelectItem value="zaehlwaage">{lookupLabel('eichprotokoll', 'waagentyp', 'zaehlwaage') ?? 'Zählwaage'}</SelectItem>
            <SelectItem value="sonstige">{lookupLabel('eichprotokoll', 'waagentyp', 'sonstige') ?? 'Sonstige'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.waagentyp && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'waagentyp')}</p>
        )}
      </div>
    ),
    'hersteller': (
      <div key="hersteller" className="space-y-1.5">
        <Label htmlFor="hersteller">{fieldLabel('eichprotokoll', 'hersteller')}</Label>
        <Input
          id="hersteller"
          placeholder="z. B. Mettler-Toledo"
          value={fields.hersteller ?? ''}
          onChange={e => setFields(f => ({ ...f, hersteller: e.target.value }))}
        />
      </div>
    ),
    'seriennummer': (
      <div key="seriennummer" className="space-y-1.5">
        <Label htmlFor="seriennummer">{fieldLabel('eichprotokoll', 'seriennummer')}</Label>
        <Input
          id="seriennummer"
          placeholder="z. B. SN-9876543"
          value={fields.seriennummer ?? ''}
          onChange={e => setFields(f => ({ ...f, seriennummer: e.target.value }))}
        />
      </div>
    ),
    'nennlast_kg': (
      <div key="nennlast_kg" className="space-y-1.5">
        <Label htmlFor="nennlast_kg">{fieldLabel('eichprotokoll', 'nennlast_kg')}</Label>
        <Input
          id="nennlast_kg"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'nennlast_kg')}
          placeholder="z. B. 1000"
          value={fields.nennlast_kg !== undefined ? fields.nennlast_kg : (computedValues['nennlast_kg'] ?? '')}
          onChange={e => setFields(f => ({ ...f, nennlast_kg: clampNumberValue(formEnhancements, 'nennlast_kg', e.target.value) }))}
        />
      </div>
    ),
    'eichklasse': (
      <div key="eichklasse" className="space-y-1.5">
        <Label htmlFor="eichklasse">{fieldLabel('eichprotokoll', 'eichklasse')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.eichklasse) === 'klasse_i'}
            onClick={() => setFields(f => ({ ...f, eichklasse: (lookupKey(f.eichklasse) === 'klasse_i' ? undefined : 'klasse_i') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.eichklasse) === 'klasse_i'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('eichprotokoll', 'eichklasse', 'klasse_i') ?? 'Klasse I (Feinwaagen)'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.eichklasse) === 'klasse_ii'}
            onClick={() => setFields(f => ({ ...f, eichklasse: (lookupKey(f.eichklasse) === 'klasse_ii' ? undefined : 'klasse_ii') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.eichklasse) === 'klasse_ii'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('eichprotokoll', 'eichklasse', 'klasse_ii') ?? 'Klasse II (Präzisionswaagen)'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.eichklasse) === 'klasse_iii'}
            onClick={() => setFields(f => ({ ...f, eichklasse: (lookupKey(f.eichklasse) === 'klasse_iii' ? undefined : 'klasse_iii') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.eichklasse) === 'klasse_iii'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('eichprotokoll', 'eichklasse', 'klasse_iii') ?? 'Klasse III (Handelswaagen)'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.eichklasse) === 'klasse_iiii'}
            onClick={() => setFields(f => ({ ...f, eichklasse: (lookupKey(f.eichklasse) === 'klasse_iiii' ? undefined : 'klasse_iiii') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.eichklasse) === 'klasse_iiii'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('eichprotokoll', 'eichklasse', 'klasse_iiii') ?? 'Klasse IIII (Grobwaagen)'}
          </button>
        </div>
      </div>
    ),
    'vorlagewert_kg': (
      <div key="vorlagewert_kg" className="space-y-1.5">
        <Label htmlFor="vorlagewert_kg">{fieldLabel('eichprotokoll', 'vorlagewert_kg')}</Label>
        <Input
          id="vorlagewert_kg"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'vorlagewert_kg')}
          placeholder="z. B. 1000"
          value={fields.vorlagewert_kg !== undefined ? fields.vorlagewert_kg : (computedValues['vorlagewert_kg'] ?? '')}
          onChange={e => setFields(f => ({ ...f, vorlagewert_kg: clampNumberValue(formEnhancements, 'vorlagewert_kg', e.target.value) }))}
        />
      </div>
    ),
    'istwert_kg': (
      <div key="istwert_kg" className="space-y-1.5">
        <Label htmlFor="istwert_kg">{fieldLabel('eichprotokoll', 'istwert_kg')}</Label>
        <Input
          id="istwert_kg"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'istwert_kg')}
          placeholder="z. B. 1002"
          value={fields.istwert_kg !== undefined ? fields.istwert_kg : (computedValues['istwert_kg'] ?? '')}
          onChange={e => setFields(f => ({ ...f, istwert_kg: clampNumberValue(formEnhancements, 'istwert_kg', e.target.value) }))}
        />
      </div>
    ),
    'abweichung_kg': (
      <div key="abweichung_kg" className="space-y-1.5">
        <Label htmlFor="abweichung_kg">{fieldLabel('eichprotokoll', 'abweichung_kg')}</Label>
        <Input
          id="abweichung_kg"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'abweichung_kg')}
          placeholder="wird berechnet"
          value={fields.abweichung_kg !== undefined ? fields.abweichung_kg : (computedValues['abweichung_kg'] ?? '')}
          onChange={e => setFields(f => ({ ...f, abweichung_kg: clampNumberValue(formEnhancements, 'abweichung_kg', e.target.value) }))}
        />
      </div>
    ),
    'eichergebnis': (
      <div key="eichergebnis" className="space-y-1.5">
        <Label htmlFor="eichergebnis">{fieldLabel('eichprotokoll', 'eichergebnis')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.eichergebnis) === 'bestanden'}
            onClick={() => setFields(f => ({ ...f, eichergebnis: (lookupKey(f.eichergebnis) === 'bestanden' ? undefined : 'bestanden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.eichergebnis) === 'bestanden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('eichprotokoll', 'eichergebnis', 'bestanden') ?? 'Bestanden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.eichergebnis) === 'nicht_bestanden'}
            onClick={() => setFields(f => ({ ...f, eichergebnis: (lookupKey(f.eichergebnis) === 'nicht_bestanden' ? undefined : 'nicht_bestanden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.eichergebnis) === 'nicht_bestanden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('eichprotokoll', 'eichergebnis', 'nicht_bestanden') ?? 'Nicht bestanden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.eichergebnis) === 'bedingt_bestanden'}
            onClick={() => setFields(f => ({ ...f, eichergebnis: (lookupKey(f.eichergebnis) === 'bedingt_bestanden' ? undefined : 'bedingt_bestanden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.eichergebnis) === 'bedingt_bestanden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('eichprotokoll', 'eichergebnis', 'bedingt_bestanden') ?? 'Bedingt bestanden (Auflagen)'}
          </button>
        </div>
        {showErrors && !fields.eichergebnis && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'eichergebnis')}</p>
        )}
      </div>
    ),
    'pruefmittel': (
      <div key="pruefmittel" className="space-y-1.5">
        <Label htmlFor="pruefmittel">{fieldLabel('eichprotokoll', 'pruefmittel')}</Label>
        <Textarea
          id="pruefmittel"
          placeholder="Eichgewichte, Normen, Verfahren..."
          value={fields.pruefmittel ?? ''}
          onChange={e => setFields(f => ({ ...f, pruefmittel: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'eichsiegel_nummer': (
      <div key="eichsiegel_nummer" className="space-y-1.5">
        <Label htmlFor="eichsiegel_nummer">{fieldLabel('eichprotokoll', 'eichsiegel_nummer')}</Label>
        <Input
          id="eichsiegel_nummer"
          placeholder="z. B. ES-2026-123456"
          value={fields.eichsiegel_nummer ?? ''}
          onChange={e => setFields(f => ({ ...f, eichsiegel_nummer: e.target.value }))}
        />
      </div>
    ),
    'naechste_eichung': (
      <div key="naechste_eichung" className="space-y-1.5">
        <Label htmlFor="naechste_eichung">{fieldLabel('eichprotokoll', 'naechste_eichung')}</Label>
        <DatePicker
          id="naechste_eichung"
          placeholder="Fällig ab wann?"
          mode="date"
          value={fields.naechste_eichung ?? null}
          onChange={v => setFields(f => ({ ...f, naechste_eichung: v ?? undefined }))}
        />
      </div>
    ),
    'pruefer_vorname': (
      <div key="pruefer_vorname" className="space-y-1.5">
        <Label htmlFor="pruefer_vorname">{fieldLabel('eichprotokoll', 'pruefer_vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="pruefer_vorname"
          placeholder="z. B. Max"
          value={fields.pruefer_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, pruefer_vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.pruefer_vorname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'pruefer_vorname')}</p>
        )}
      </div>
    ),
    'pruefer_nachname': (
      <div key="pruefer_nachname" className="space-y-1.5">
        <Label htmlFor="pruefer_nachname">{fieldLabel('eichprotokoll', 'pruefer_nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="pruefer_nachname"
          placeholder="z. B. Prüfer"
          value={fields.pruefer_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, pruefer_nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.pruefer_nachname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('eichprotokoll', 'pruefer_nachname')}</p>
        )}
      </div>
    ),
    'unterschrift_pruefer': (
      <div key="unterschrift_pruefer" className="space-y-1.5">
        <Label htmlFor="unterschrift_pruefer">{fieldLabel('eichprotokoll', 'unterschrift_pruefer')}</Label>
        {fields.unterschrift_pruefer ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <IconFileText size={20} className="text-muted-foreground" />
              </div>
              <img
                src={fields.unterschrift_pruefer}
                alt=""
                className="relative h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">{fields.unterschrift_pruefer.split("/").pop()}</p>
              <div className="flex gap-2 mt-1">
                <label
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t('fr_change')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileUrl = await uploadFile(file, file.name);
                        setFields(f => ({ ...f, unterschrift_pruefer: fileUrl }));
                      } catch (err) { console.error('Upload failed:', err); }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setFields(f => ({ ...f, unterschrift_pruefer: undefined }))}
                >
                  {t('fr_remove')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <IconUpload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('fr_upload_file')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fileUrl = await uploadFile(file, file.name);
                  setFields(f => ({ ...f, unterschrift_pruefer: fileUrl }));
                } catch (err) { console.error('Upload failed:', err); }
              }}
            />
          </label>
        )}
      </div>
    ),
    'fotos': (
      <div key="fotos" className="space-y-1.5">
        <Label htmlFor="fotos">{fieldLabel('eichprotokoll', 'fotos')}</Label>
        {fields.fotos ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <IconFileText size={20} className="text-muted-foreground" />
              </div>
              <img
                src={fields.fotos}
                alt=""
                className="relative h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">{fields.fotos.split("/").pop()}</p>
              <div className="flex gap-2 mt-1">
                <label
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t('fr_change')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileUrl = await uploadFile(file, file.name);
                        setFields(f => ({ ...f, fotos: fileUrl }));
                      } catch (err) { console.error('Upload failed:', err); }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setFields(f => ({ ...f, fotos: undefined }))}
                >
                  {t('fr_remove')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <IconUpload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('fr_upload_file')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fileUrl = await uploadFile(file, file.name);
                  setFields(f => ({ ...f, fotos: fileUrl }));
                } catch (err) { console.error('Upload failed:', err); }
              }}
            />
          </label>
        )}
      </div>
    ),
    'bemerkungen': (
      <div key="bemerkungen" className="space-y-1.5">
        <Label htmlFor="bemerkungen">{fieldLabel('eichprotokoll', 'bemerkungen')}</Label>
        <Textarea
          id="bemerkungen"
          placeholder="Besonderheiten, Mängel, Auflagen..."
          value={fields.bemerkungen ?? ''}
          onChange={e => setFields(f => ({ ...f, bemerkungen: e.target.value }))}
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
  const FIELD_LABELS: Record<string, string> = {"protokollnummer": "Protokollnummer", "eichungsdatum": "Datum der Eichung", "einsatz": "Zugehöriger Einsatz", "kunde": "Kunde", "waagentyp": "Waagentyp", "hersteller": "Hersteller der Waage", "seriennummer": "Seriennummer", "nennlast_kg": "Nennlast (kg)", "eichklasse": "Eichklasse", "vorlagewert_kg": "Vorlagewert (kg)", "istwert_kg": "Istwert (kg)", "abweichung_kg": "Abweichung (kg)", "eichergebnis": "Eichergebnis", "pruefmittel": "Verwendete Prüfmittel", "eichsiegel_nummer": "Eichsiegel-Nummer", "naechste_eichung": "Nächste Eichung fällig", "pruefer_vorname": "Prüfer Vorname", "pruefer_nachname": "Prüfer Nachname", "unterschrift_pruefer": "Unterschrift Prüfer (Datei)", "fotos": "Fotos vom Einsatz", "bemerkungen": "Bemerkungen"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"einsatz": {"einsatznummer": "Einsatznummer", "einsatzdatum": "Einsatzdatum", "geplante_startzeit": "Geplante Startzeit", "geplante_endzeit": "Geplante Endzeit", "status": "Status", "terminwuensche": "Terminwünsche", "kunde": "Kunde", "routenreihenfolge": "Routenreihenfolge (Nummer)", "gesamtstrecke_km": "Geschätzte Gesamtstrecke (km)", "startpunkt": "Startpunkt der Route", "routennotizen": "Routennotizen", "mitarbeiter": "Zugeordnete Mitarbeiter", "fahrzeuge": "Zugeordnete Fahrzeuge", "arbeitszeit_eingehalten": "Gesetzliche Arbeitszeit eingehalten", "pause_geplant": "Pause(n) eingeplant", "pausendauer_min": "Geplante Pausendauer (Minuten)", "ueberstunden_begruendung": "Begründung bei Überschreitung der Regelarbeitszeit", "interne_notizen": "Interne Notizen"}, "kunde": {"firmenname": "Firmenname", "vorname": "Ansprechpartner Vorname", "nachname": "Ansprechpartner Nachname", "telefon": "Telefon", "email": "E-Mail", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "Postleitzahl", "ort": "Ort", "standort": "Standort (Kartenauswahl)", "notizen": "Notizen"}};
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
                <AttachmentsSection appId={APP_IDS.EICHPROTOKOLL} recordId={recordId} />
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
    {createEinsatzplanungOpen && (
      <EinsatzplanungDialog
        open={createEinsatzplanungOpen}
        onClose={() => setCreateEinsatzplanungOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createEinsatzplanungEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Einsatzplanung;
            setExtraEinsatzplanung(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.EINSATZPLANUNG, result.id);
            setFields(prev => ({ ...prev, [createEinsatzplanungField]: url } as any));
          }
          setCreateEinsatzplanungOpen(false);
        }}
        defaultValues={createEinsatzplanungInitial
          ? ({ einsatznummer: createEinsatzplanungInitial } as any)
          : undefined}
        terminwunschList={[]}
        kundenstammList={kundenstammList}
        mitarbeiterstammList={[]}
        fahrzeugstammList={[]}
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
    </>
  );
}