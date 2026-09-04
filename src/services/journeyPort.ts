/**
 * The INTERNAL door of the journey port — authenticated, via LivingAppsService.
 * GENERATED: one lister and one creator per entity. Do not edit.
 *
 *   import { servicePort } from '@/services/journeyPort';
 *
 * Intent pages hand this to `useJourneySubmit` and to shared step blocks. It
 * exposes only list · create · ref — the public subset — so a step written
 * against it also runs on a public page. Undo, edit and delete stay on the
 * page itself (LivingAppsService), never inside a shared step.
 */
import { LivingAppsService, createRecordUrl, type RecordQuery } from '@/services/livingAppsService';
import { toWirePayload, type JourneyPort, type JourneyRecord } from '@/lib/journey/port';
import { buildSearchFilter, byIdFilter, combineFilters } from '@/lib/journey/search';
import type { EntityKey } from '@/lib/journey/rules';

type RawRecord = { record_id: string; fields: Record<string, unknown>; createdat?: string | null };
type RawMutation = { record_id: string; fields?: Record<string, unknown>; created_at?: string | null };

const listers: Record<EntityKey, () => Promise<RawRecord[]>> = {
  'kundenstamm': () => LivingAppsService.getKundenstamm() as Promise<RawRecord[]>,
  'mitarbeiterstamm': () => LivingAppsService.getMitarbeiterstamm() as Promise<RawRecord[]>,
  'fahrzeugstamm': () => LivingAppsService.getFahrzeugstamm() as Promise<RawRecord[]>,
  'terminwunsch': () => LivingAppsService.getTerminwunsch() as Promise<RawRecord[]>,
  'einsatzplanung': () => LivingAppsService.getEinsatzplanung() as Promise<RawRecord[]>,
  'eichprotokoll': () => LivingAppsService.getEichprotokoll() as Promise<RawRecord[]>,
};

/** The query/count half — the REST parameters the plain listers never send. */
const queriers: Record<EntityKey, (q: RecordQuery) => Promise<RawRecord[]>> = {
  'kundenstamm': q => LivingAppsService.queryKundenstamm(q) as Promise<RawRecord[]>,
  'mitarbeiterstamm': q => LivingAppsService.queryMitarbeiterstamm(q) as Promise<RawRecord[]>,
  'fahrzeugstamm': q => LivingAppsService.queryFahrzeugstamm(q) as Promise<RawRecord[]>,
  'terminwunsch': q => LivingAppsService.queryTerminwunsch(q) as Promise<RawRecord[]>,
  'einsatzplanung': q => LivingAppsService.queryEinsatzplanung(q) as Promise<RawRecord[]>,
  'eichprotokoll': q => LivingAppsService.queryEichprotokoll(q) as Promise<RawRecord[]>,
};

const counters: Record<EntityKey, (filter?: string, signal?: AbortSignal) => Promise<number>> = {
  'kundenstamm': (filter, signal) => LivingAppsService.countKundenstamm(filter, signal),
  'mitarbeiterstamm': (filter, signal) => LivingAppsService.countMitarbeiterstamm(filter, signal),
  'fahrzeugstamm': (filter, signal) => LivingAppsService.countFahrzeugstamm(filter, signal),
  'terminwunsch': (filter, signal) => LivingAppsService.countTerminwunsch(filter, signal),
  'einsatzplanung': (filter, signal) => LivingAppsService.countEinsatzplanung(filter, signal),
  'eichprotokoll': (filter, signal) => LivingAppsService.countEichprotokoll(filter, signal),
};

const creators: Record<EntityKey, (fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'kundenstamm': fields => LivingAppsService.createKundenstammEntry(fields as never),
  'mitarbeiterstamm': fields => LivingAppsService.createMitarbeiterstammEntry(fields as never),
  'fahrzeugstamm': fields => LivingAppsService.createFahrzeugstammEntry(fields as never),
  'terminwunsch': fields => LivingAppsService.createTerminwunschEntry(fields as never),
  'einsatzplanung': fields => LivingAppsService.createEinsatzplanungEntry(fields as never),
  'eichprotokoll': fields => LivingAppsService.createEichprotokollEntry(fields as never),
};

function toJourneyRecord(r: RawRecord): JourneyRecord {
  return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.createdat ?? null };
}

export const servicePort: JourneyPort = {
  door: 'internal',
  async list(entity, opts) {
    // Only a bare list(entity) (or an empty options object) takes the historic
    // load-everything path. ANY explicit option — `limit` included — goes to the
    // server: useRecordSearch's first page of a big entity must not pull the
    // whole table (live 2026-09-02: all 263 employees travelled for a limit-50
    // first page because `limit` alone did not count as a query).
    const usesQuery = !!opts && (opts.search !== undefined || opts.offset !== undefined
      || opts.orderby !== undefined || opts.fields !== undefined || opts.signal !== undefined
      || opts.limit !== undefined || opts.filter !== undefined);
    if (!usesQuery) {
      const rows = await listers[entity]();
      const limited = opts?.limit ? rows.slice(0, opts.limit) : rows;
      return limited.map(toJourneyRecord);
    }
    const filter = combineFilters(opts.filter, opts.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    const rows = await queriers[entity]({
      filter, orderby: opts.orderby, limit: opts.limit, offset: opts.offset, fields: opts.fields, signal: opts.signal,
    });
    return rows.map(toJourneyRecord);
  },
  async count(entity, opts) {
    const filter = combineFilters(opts?.filter, opts?.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    return counters[entity](filter, opts?.signal);
  },
  async get(entity, id) {
    // One query on the server, not the whole table: `r.id` is the vSQL name
    // of the record id (a live page wrote `r.record_id` and got a 400).
    const rows = await queriers[entity]({ filter: byIdFilter(id), limit: 1 });
    return rows[0] ? toJourneyRecord(rows[0]) : null;
  },
  async create(entity, values) {
    const r = await creators[entity](toWirePayload(entity, values, servicePort));
    return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  ref: (appId, recordId) => createRecordUrl(appId, recordId),
};
