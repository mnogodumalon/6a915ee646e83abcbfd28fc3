import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kundenstamm, Mitarbeiterstamm, Fahrzeugstamm, Terminwunsch, Einsatzplanung, Eichprotokoll } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'kundenstamm' | 'mitarbeiterstamm' | 'fahrzeugstamm' | 'terminwunsch' | 'einsatzplanung' | 'eichprotokoll';

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [kundenstamm, setKundenstamm] = useState<Kundenstamm[]>([]);
  const [mitarbeiterstamm, setMitarbeiterstamm] = useState<Mitarbeiterstamm[]>([]);
  const [fahrzeugstamm, setFahrzeugstamm] = useState<Fahrzeugstamm[]>([]);
  const [terminwunsch, setTerminwunsch] = useState<Terminwunsch[]>([]);
  const [einsatzplanung, setEinsatzplanung] = useState<Einsatzplanung[]>([]);
  const [eichprotokoll, setEichprotokoll] = useState<Eichprotokoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const [kundenstammData, mitarbeiterstammData, fahrzeugstammData, terminwunschData, einsatzplanungData, eichprotokollData] = await Promise.all([
        omit.has('kundenstamm') ? Promise.resolve([] as Kundenstamm[]) : LivingAppsService.getKundenstamm(),
        omit.has('mitarbeiterstamm') ? Promise.resolve([] as Mitarbeiterstamm[]) : LivingAppsService.getMitarbeiterstamm(),
        omit.has('fahrzeugstamm') ? Promise.resolve([] as Fahrzeugstamm[]) : LivingAppsService.getFahrzeugstamm(),
        omit.has('terminwunsch') ? Promise.resolve([] as Terminwunsch[]) : LivingAppsService.getTerminwunsch(),
        omit.has('einsatzplanung') ? Promise.resolve([] as Einsatzplanung[]) : LivingAppsService.getEinsatzplanung(),
        omit.has('eichprotokoll') ? Promise.resolve([] as Eichprotokoll[]) : LivingAppsService.getEichprotokoll(),
      ]);
      setKundenstamm(kundenstammData);
      setMitarbeiterstamm(mitarbeiterstammData);
      setFahrzeugstamm(fahrzeugstammData);
      setTerminwunsch(terminwunschData);
      setEinsatzplanung(einsatzplanungData);
      setEichprotokoll(eichprotokollData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        const [kundenstammData, mitarbeiterstammData, fahrzeugstammData, terminwunschData, einsatzplanungData, eichprotokollData] = await Promise.all([
          omit.has('kundenstamm') ? Promise.resolve([] as Kundenstamm[]) : LivingAppsService.getKundenstamm(),
          omit.has('mitarbeiterstamm') ? Promise.resolve([] as Mitarbeiterstamm[]) : LivingAppsService.getMitarbeiterstamm(),
          omit.has('fahrzeugstamm') ? Promise.resolve([] as Fahrzeugstamm[]) : LivingAppsService.getFahrzeugstamm(),
          omit.has('terminwunsch') ? Promise.resolve([] as Terminwunsch[]) : LivingAppsService.getTerminwunsch(),
          omit.has('einsatzplanung') ? Promise.resolve([] as Einsatzplanung[]) : LivingAppsService.getEinsatzplanung(),
          omit.has('eichprotokoll') ? Promise.resolve([] as Eichprotokoll[]) : LivingAppsService.getEichprotokoll(),
        ]);
        setKundenstamm(kundenstammData);
        setMitarbeiterstamm(mitarbeiterstammData);
        setFahrzeugstamm(fahrzeugstammData);
        setTerminwunsch(terminwunschData);
        setEinsatzplanung(einsatzplanungData);
        setEichprotokoll(eichprotokollData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, [omitKey]);

  const kundenstammMap = useMemo(() => {
    const m = new Map<string, Kundenstamm>();
    kundenstamm.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kundenstamm]);

  const mitarbeiterstammMap = useMemo(() => {
    const m = new Map<string, Mitarbeiterstamm>();
    mitarbeiterstamm.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeiterstamm]);

  const fahrzeugstammMap = useMemo(() => {
    const m = new Map<string, Fahrzeugstamm>();
    fahrzeugstamm.forEach(r => m.set(r.record_id, r));
    return m;
  }, [fahrzeugstamm]);

  const terminwunschMap = useMemo(() => {
    const m = new Map<string, Terminwunsch>();
    terminwunsch.forEach(r => m.set(r.record_id, r));
    return m;
  }, [terminwunsch]);

  const einsatzplanungMap = useMemo(() => {
    const m = new Map<string, Einsatzplanung>();
    einsatzplanung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [einsatzplanung]);

  return { kundenstamm, setKundenstamm, mitarbeiterstamm, setMitarbeiterstamm, fahrzeugstamm, setFahrzeugstamm, terminwunsch, setTerminwunsch, einsatzplanung, setEinsatzplanung, eichprotokoll, setEichprotokoll, loading, error, fetchAll, kundenstammMap, mitarbeiterstammMap, fahrzeugstammMap, terminwunschMap, einsatzplanungMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;