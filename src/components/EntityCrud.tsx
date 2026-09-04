/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'kundenstamm'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.kundenstamm.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.kundenstamm.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.kundenstamm.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.kundenstamm              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   kundenstamm: firmenname, vorname, nachname, telefon, email, strasse, hausnummer, plz, …  ·  ← einsatzplanung (list + contextual +) · ← eichprotokoll (list + contextual +)
 *   mitarbeiterstamm: vorname, nachname, personalnummer, telefon, email, fuehrerscheinklasse, eichberechtigung, qualifikationen, …  ·  ← einsatzplanung (list + contextual +)
 *   fahrzeugstamm: kennzeichen, bezeichnung, fahrzeugtyp, anhaenger_vorhanden, max_nutzlast_kg, zulassungsdatum, naechste_hauptuntersuchung, naechste_eichung_fahrzeug, …  ·  ← einsatzplanung (list + contextual +)
 *   terminwunsch: firmenname, vorname, nachname, telefon, email, strasse, hausnummer, plz, …  ·  ← einsatzplanung (list + contextual +)
 *   einsatzplanung: einsatznummer, einsatzdatum, geplante_startzeit, geplante_endzeit, status, terminwuensche, kunde, routenreihenfolge, …  ·  → terminwunsch · → kundenstamm · → mitarbeiterstamm · → fahrzeugstamm · ← eichprotokoll (list + contextual +)
 *   eichprotokoll: protokollnummer, eichungsdatum, einsatz, kunde, waagentyp, hersteller, seriennummer, nennlast_kg, …  ·  → einsatzplanung · → kundenstamm
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Kundenstamm, Mitarbeiterstamm, Fahrzeugstamm, Terminwunsch, Einsatzplanung, Eichprotokoll } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichEinsatzplanung, enrichEichprotokoll } from '@/lib/enrich';
import type { EnrichedEinsatzplanung, EnrichedEichprotokoll } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { KundenstammDialog, type KundenstammDialogDefaults } from '@/components/dialogs/KundenstammDialog';
import { KundenstammDetails } from '@/components/details/KundenstammDetails';
import { MitarbeiterstammDialog, type MitarbeiterstammDialogDefaults } from '@/components/dialogs/MitarbeiterstammDialog';
import { MitarbeiterstammDetails } from '@/components/details/MitarbeiterstammDetails';
import { FahrzeugstammDialog, type FahrzeugstammDialogDefaults } from '@/components/dialogs/FahrzeugstammDialog';
import { FahrzeugstammDetails } from '@/components/details/FahrzeugstammDetails';
import { TerminwunschDialog, type TerminwunschDialogDefaults } from '@/components/dialogs/TerminwunschDialog';
import { TerminwunschDetails } from '@/components/details/TerminwunschDetails';
import { EinsatzplanungDialog, type EinsatzplanungDialogDefaults } from '@/components/dialogs/EinsatzplanungDialog';
import { EinsatzplanungDetails } from '@/components/details/EinsatzplanungDetails';
import { EichprotokollDialog, type EichprotokollDialogDefaults } from '@/components/dialogs/EichprotokollDialog';
import { EichprotokollDetails } from '@/components/details/EichprotokollDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'kundenstamm'; record: Kundenstamm }
  | { type: 'mitarbeiterstamm'; record: Mitarbeiterstamm }
  | { type: 'fahrzeugstamm'; record: Fahrzeugstamm }
  | { type: 'terminwunsch'; record: Terminwunsch }
  | { type: 'einsatzplanung'; record: EnrichedEinsatzplanung }
  | { type: 'eichprotokoll'; record: EnrichedEichprotokoll };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  kundenstamm: EntityCrudApi<Kundenstamm, KundenstammDialogDefaults>;
  mitarbeiterstamm: EntityCrudApi<Mitarbeiterstamm, MitarbeiterstammDialogDefaults>;
  fahrzeugstamm: EntityCrudApi<Fahrzeugstamm, FahrzeugstammDialogDefaults>;
  terminwunsch: EntityCrudApi<Terminwunsch, TerminwunschDialogDefaults>;
  einsatzplanung: EntityCrudApi<Einsatzplanung, EinsatzplanungDialogDefaults>;
  eichprotokoll: EntityCrudApi<Eichprotokoll, EichprotokollDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { kundenstamm: Kundenstamm[]; mitarbeiterstamm: Mitarbeiterstamm[]; fahrzeugstamm: Fahrzeugstamm[]; terminwunsch: Terminwunsch[]; einsatzplanung: EnrichedEinsatzplanung[]; eichprotokoll: EnrichedEichprotokoll[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [kundenstammDialog, setKundenstammDialog] = useState<{ defaults?: KundenstammDialogDefaults; editing?: Kundenstamm } | null>(null);
  const [mitarbeiterstammDialog, setMitarbeiterstammDialog] = useState<{ defaults?: MitarbeiterstammDialogDefaults; editing?: Mitarbeiterstamm } | null>(null);
  const [fahrzeugstammDialog, setFahrzeugstammDialog] = useState<{ defaults?: FahrzeugstammDialogDefaults; editing?: Fahrzeugstamm } | null>(null);
  const [terminwunschDialog, setTerminwunschDialog] = useState<{ defaults?: TerminwunschDialogDefaults; editing?: Terminwunsch } | null>(null);
  const [einsatzplanungDialog, setEinsatzplanungDialog] = useState<{ defaults?: EinsatzplanungDialogDefaults; editing?: Einsatzplanung } | null>(null);
  const [eichprotokollDialog, setEichprotokollDialog] = useState<{ defaults?: EichprotokollDialogDefaults; editing?: Eichprotokoll } | null>(null);
  const enrichedEinsatzplanung = useMemo(() => enrichEinsatzplanung(data.einsatzplanung, { terminwunschMap: data.terminwunschMap, kundenstammMap: data.kundenstammMap, mitarbeiterstammMap: data.mitarbeiterstammMap, fahrzeugstammMap: data.fahrzeugstammMap }), [data.einsatzplanung, data.terminwunschMap, data.kundenstammMap, data.mitarbeiterstammMap, data.fahrzeugstammMap]);
  const enrichedEichprotokoll = useMemo(() => enrichEichprotokoll(data.eichprotokoll, { einsatzplanungMap: data.einsatzplanungMap, kundenstammMap: data.kundenstammMap }), [data.eichprotokoll, data.einsatzplanungMap, data.kundenstammMap]);

  function detailKundenstamm(record: Kundenstamm, push = false) {
    const item: OverlayItem = { type: 'kundenstamm', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKundenstamm(fields: Kundenstamm['fields']) {
    const editing = kundenstammDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKundenstamm(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKundenstammEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kundenstamm')} — ${t('crud_updated')}`, async () => {
        data.setKundenstamm(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKundenstammEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKundenstammEntry(fields);
      undoToast(`${appLabel('kundenstamm')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailMitarbeiterstamm(record: Mitarbeiterstamm, push = false) {
    const item: OverlayItem = { type: 'mitarbeiterstamm', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitarbeiterstamm(fields: Mitarbeiterstamm['fields']) {
    const editing = mitarbeiterstammDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitarbeiterstamm(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitarbeiterstammEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitarbeiterstamm')} — ${t('crud_updated')}`, async () => {
        data.setMitarbeiterstamm(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitarbeiterstammEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitarbeiterstammEntry(fields);
      undoToast(`${appLabel('mitarbeiterstamm')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailFahrzeugstamm(record: Fahrzeugstamm, push = false) {
    const item: OverlayItem = { type: 'fahrzeugstamm', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitFahrzeugstamm(fields: Fahrzeugstamm['fields']) {
    const editing = fahrzeugstammDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setFahrzeugstamm(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateFahrzeugstammEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('fahrzeugstamm')} — ${t('crud_updated')}`, async () => {
        data.setFahrzeugstamm(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateFahrzeugstammEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createFahrzeugstammEntry(fields);
      undoToast(`${appLabel('fahrzeugstamm')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailTerminwunsch(record: Terminwunsch, push = false) {
    const item: OverlayItem = { type: 'terminwunsch', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitTerminwunsch(fields: Terminwunsch['fields']) {
    const editing = terminwunschDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setTerminwunsch(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateTerminwunschEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('terminwunsch')} — ${t('crud_updated')}`, async () => {
        data.setTerminwunsch(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateTerminwunschEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createTerminwunschEntry(fields);
      undoToast(`${appLabel('terminwunsch')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEinsatzplanung(record: Einsatzplanung, push = false) {
    const rec = enrichedEinsatzplanung.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'einsatzplanung', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEinsatzplanung(fields: Einsatzplanung['fields']) {
    const editing = einsatzplanungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEinsatzplanung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEinsatzplanungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('einsatzplanung')} — ${t('crud_updated')}`, async () => {
        data.setEinsatzplanung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEinsatzplanungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEinsatzplanungEntry(fields);
      undoToast(`${appLabel('einsatzplanung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEichprotokoll(record: Eichprotokoll, push = false) {
    const rec = enrichedEichprotokoll.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'eichprotokoll', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEichprotokoll(fields: Eichprotokoll['fields']) {
    const editing = eichprotokollDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEichprotokoll(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEichprotokollEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('eichprotokoll')} — ${t('crud_updated')}`, async () => {
        data.setEichprotokoll(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEichprotokollEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEichprotokollEntry(fields);
      undoToast(`${appLabel('eichprotokoll')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <KundenstammDialog
        open={kundenstammDialog !== null}
        onClose={() => setKundenstammDialog(null)}
        onSubmit={submitKundenstamm}
        defaultValues={kundenstammDialog?.defaults}
        recordId={kundenstammDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Kundenstamm']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kundenstamm']}
      />
      <MitarbeiterstammDialog
        open={mitarbeiterstammDialog !== null}
        onClose={() => setMitarbeiterstammDialog(null)}
        onSubmit={submitMitarbeiterstamm}
        defaultValues={mitarbeiterstammDialog?.defaults}
        recordId={mitarbeiterstammDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitarbeiterstamm']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitarbeiterstamm']}
      />
      <FahrzeugstammDialog
        open={fahrzeugstammDialog !== null}
        onClose={() => setFahrzeugstammDialog(null)}
        onSubmit={submitFahrzeugstamm}
        defaultValues={fahrzeugstammDialog?.defaults}
        recordId={fahrzeugstammDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Fahrzeugstamm']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Fahrzeugstamm']}
      />
      <TerminwunschDialog
        open={terminwunschDialog !== null}
        onClose={() => setTerminwunschDialog(null)}
        onSubmit={submitTerminwunsch}
        defaultValues={terminwunschDialog?.defaults}
        recordId={terminwunschDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Terminwunsch']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Terminwunsch']}
      />
      <EinsatzplanungDialog
        open={einsatzplanungDialog !== null}
        onClose={() => setEinsatzplanungDialog(null)}
        onSubmit={submitEinsatzplanung}
        defaultValues={einsatzplanungDialog?.defaults}
        recordId={einsatzplanungDialog?.editing?.record_id}
        terminwunschList={data.terminwunsch}
        kundenstammList={data.kundenstamm}
        mitarbeiterstammList={data.mitarbeiterstamm}
        fahrzeugstammList={data.fahrzeugstamm}
        enablePhotoScan={AI_PHOTO_SCAN['Einsatzplanung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Einsatzplanung']}
      />
      <EichprotokollDialog
        open={eichprotokollDialog !== null}
        onClose={() => setEichprotokollDialog(null)}
        onSubmit={submitEichprotokoll}
        defaultValues={eichprotokollDialog?.defaults}
        recordId={eichprotokollDialog?.editing?.record_id}
        einsatzplanungList={data.einsatzplanung}
        kundenstammList={data.kundenstamm}
        enablePhotoScan={AI_PHOTO_SCAN['Eichprotokoll']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Eichprotokoll']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'kundenstamm') {
            return (
              <>
                <RecordHeader title={top.record.fields.firmenname ?? appLabel('kundenstamm')} subtitle={undefined} />
                <KundenstammDetails
                  record={top.record}
                  einsatzplanungList={data.einsatzplanung}
                  onOpenEinsatzplanung={(r) => detailEinsatzplanung(r, true)}
                  onAddEinsatzplanung={() => setEinsatzplanungDialog({ defaults: { kunde: createRecordUrl(APP_IDS.KUNDENSTAMM, top.record.record_id) } })}
                  eichprotokollList={data.eichprotokoll}
                  onOpenEichprotokoll={(r) => detailEichprotokoll(r, true)}
                  onAddEichprotokoll={() => setEichprotokollDialog({ defaults: { kunde: createRecordUrl(APP_IDS.KUNDENSTAMM, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'mitarbeiterstamm') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('mitarbeiterstamm')} subtitle={undefined} />
                <MitarbeiterstammDetails
                  record={top.record}
                  einsatzplanungList={data.einsatzplanung}
                  onOpenEinsatzplanung={(r) => detailEinsatzplanung(r, true)}
                  onAddEinsatzplanung={() => setEinsatzplanungDialog({ defaults: { mitarbeiter: [createRecordUrl(APP_IDS.MITARBEITERSTAMM, top.record.record_id)] } })}
                />
              </>
            );
          }
          if (top.type === 'fahrzeugstamm') {
            return (
              <>
                <RecordHeader title={top.record.fields.kennzeichen ?? appLabel('fahrzeugstamm')} subtitle={top.record.fields.zulassungsdatum ? formatDate(top.record.fields.zulassungsdatum) : undefined} />
                <FahrzeugstammDetails
                  record={top.record}
                  einsatzplanungList={data.einsatzplanung}
                  onOpenEinsatzplanung={(r) => detailEinsatzplanung(r, true)}
                  onAddEinsatzplanung={() => setEinsatzplanungDialog({ defaults: { fahrzeuge: [createRecordUrl(APP_IDS.FAHRZEUGSTAMM, top.record.record_id)] } })}
                />
              </>
            );
          }
          if (top.type === 'terminwunsch') {
            return (
              <>
                <RecordHeader title={top.record.fields.firmenname ?? appLabel('terminwunsch')} subtitle={top.record.fields.wunschzeitraum_von ? formatDate(top.record.fields.wunschzeitraum_von) : undefined} />
                <TerminwunschDetails
                  record={top.record}
                  einsatzplanungList={data.einsatzplanung}
                  onOpenEinsatzplanung={(r) => detailEinsatzplanung(r, true)}
                  onAddEinsatzplanung={() => setEinsatzplanungDialog({ defaults: { terminwuensche: [createRecordUrl(APP_IDS.TERMINWUNSCH, top.record.record_id)] } })}
                />
              </>
            );
          }
          if (top.type === 'einsatzplanung') {
            return (
              <>
                <RecordHeader title={top.record.fields.einsatznummer ?? appLabel('einsatzplanung')} subtitle={top.record.fields.einsatzdatum ? formatDate(top.record.fields.einsatzdatum) : undefined} />
                <EinsatzplanungDetails
                  record={top.record}
                  terminwunschList={data.terminwunsch}
                  kundenstammList={data.kundenstamm}
                  onOpenKundenstamm={(r) => detailKundenstamm(r, true)}
                  mitarbeiterstammList={data.mitarbeiterstamm}
                  fahrzeugstammList={data.fahrzeugstamm}
                  eichprotokollList={data.eichprotokoll}
                  onOpenEichprotokoll={(r) => detailEichprotokoll(r, true)}
                  onAddEichprotokoll={() => setEichprotokollDialog({ defaults: { einsatz: createRecordUrl(APP_IDS.EINSATZPLANUNG, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'eichprotokoll') {
            return (
              <>
                <RecordHeader title={top.record.fields.protokollnummer ?? appLabel('eichprotokoll')} subtitle={top.record.fields.eichungsdatum ? formatDate(top.record.fields.eichungsdatum) : undefined} />
                <EichprotokollDetails
                  record={top.record}
                  einsatzplanungList={data.einsatzplanung}
                  onOpenEinsatzplanung={(r) => detailEinsatzplanung(r, true)}
                  kundenstammList={data.kundenstamm}
                  onOpenKundenstamm={(r) => detailKundenstamm(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'kundenstamm') setKundenstammDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'mitarbeiterstamm') setMitarbeiterstammDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'fahrzeugstamm') setFahrzeugstammDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'terminwunsch') setTerminwunschDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'einsatzplanung') setEinsatzplanungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'eichprotokoll') setEichprotokollDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    kundenstamm: {
      openCreate: (defaults?: KundenstammDialogDefaults) => setKundenstammDialog({ defaults }),
      openEdit: (record: Kundenstamm) => setKundenstammDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Kundenstamm) => detailKundenstamm(record, false),
    },
    mitarbeiterstamm: {
      openCreate: (defaults?: MitarbeiterstammDialogDefaults) => setMitarbeiterstammDialog({ defaults }),
      openEdit: (record: Mitarbeiterstamm) => setMitarbeiterstammDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitarbeiterstamm) => detailMitarbeiterstamm(record, false),
    },
    fahrzeugstamm: {
      openCreate: (defaults?: FahrzeugstammDialogDefaults) => setFahrzeugstammDialog({ defaults }),
      openEdit: (record: Fahrzeugstamm) => setFahrzeugstammDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Fahrzeugstamm) => detailFahrzeugstamm(record, false),
    },
    terminwunsch: {
      openCreate: (defaults?: TerminwunschDialogDefaults) => setTerminwunschDialog({ defaults }),
      openEdit: (record: Terminwunsch) => setTerminwunschDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Terminwunsch) => detailTerminwunsch(record, false),
    },
    einsatzplanung: {
      openCreate: (defaults?: EinsatzplanungDialogDefaults) => setEinsatzplanungDialog({ defaults }),
      openEdit: (record: Einsatzplanung) => setEinsatzplanungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Einsatzplanung) => detailEinsatzplanung(record, false),
    },
    eichprotokoll: {
      openCreate: (defaults?: EichprotokollDialogDefaults) => setEichprotokollDialog({ defaults }),
      openEdit: (record: Eichprotokoll) => setEichprotokollDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Eichprotokoll) => detailEichprotokoll(record, false),
    },
    enriched: { kundenstamm: data.kundenstamm, mitarbeiterstamm: data.mitarbeiterstamm, fahrzeugstamm: data.fahrzeugstamm, terminwunsch: data.terminwunsch, einsatzplanung: enrichedEinsatzplanung, eichprotokoll: enrichedEichprotokoll },
  };
}
