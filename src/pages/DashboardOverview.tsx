import { useState, useMemo } from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { tx, appLabel } from '@/i18n';
import { formatDate, lookupKey } from '@/lib/formatters';
import { lookupOption, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { KanbanWidget } from '@/components/widgets/KanbanWidget';
import type { KanbanCard } from '@/components/widgets/KanbanWidget';
import { IconAlertTriangle, IconCalendar, IconClipboardList, IconCheckbox, IconTruck } from '@tabler/icons-react';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    einsatzplanung, setEinsatzplanung,
    terminwunsch,
    eichprotokoll,
    fetchAll,
  } = data;

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'einsatzplanung') {
        const st = lookupKey(top.record.fields.status);
        const next =
          st === 'geplant' ? 'bestaetigt' :
          st === 'bestaetigt' ? 'in_durchfuehrung' :
          st === 'in_durchfuehrung' ? 'abgeschlossen' : null;
        if (!next) return undefined;
        const nextLabel = lookupOption('einsatzplanung', 'status', next).label;
        return {
          label: tx`Weiter: ${nextLabel}`,
          onClick: () => advanceEinsatz(top.record, next),
        };
      }
      return undefined;
    },
  });

  const enrichedEinsatzplanung = crud.enriched.einsatzplanung;
  const enrichedEichprotokoll = crud.enriched.eichprotokoll;

  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Advance helper — shared by banner, worklist actions, overlay footer
  async function advanceEinsatz(record: typeof einsatzplanung[0], newStatus: string) {
    const prevStatus = record.fields.status;
    const optimistic = einsatzplanung.map(e =>
      e.record_id === record.record_id
        ? { ...e, fields: { ...e.fields, status: lookupOption('einsatzplanung', 'status', newStatus) } }
        : e
    );
    setEinsatzplanung(optimistic);
    const label = lookupOption('einsatzplanung', 'status', newStatus).label;
    undoToast(tx`Status: ${label}`, async () => {
      setEinsatzplanung(einsatzplanung);
      await LivingAppsService.updateEinsatzplanungEntry(record.record_id, {
        status: prevStatus?.key ?? prevStatus as unknown as string,
      });
    });
    try {
      await LivingAppsService.updateEinsatzplanungEntry(record.record_id, { status: newStatus });
    } catch {
      setEinsatzplanung(einsatzplanung);
      fetchAll();
    }
  }

  // Kanban columns (inside component body — locale-aware getters)
  const kanbanColumns = useMemo(() =>
    (LOOKUP_OPTIONS['einsatzplanung']?.['status'] ?? []).map(o => ({
      key: o.key,
      label: o.label,
      tone: o.key === 'abgeschlossen' ? 'success' as const
        : o.key === 'storniert' ? 'destructive' as const
        : o.key === 'in_durchfuehrung' ? 'primary' as const
        : 'default' as const,
    })),
  []);

  // Kanban cards
  const kanbanCards = useMemo((): KanbanCard[] => {
    const filtered = statusFilter
      ? enrichedEinsatzplanung.filter(e => lookupKey(e.fields.status) === statusFilter)
      : enrichedEinsatzplanung;
    return filtered
      .sort((a, b) => (a.fields.einsatzdatum ?? '').localeCompare(b.fields.einsatzdatum ?? ''))
      .map(e => ({
        id: `einsatz:${e.record_id}`,
        column: lookupKey(e.fields.status) ?? '',
        title: e.fields.einsatznummer ?? tx('Ohne Nr.'),
        subtitle: [
          e.kundeName || null,
          e.fields.einsatzdatum ? formatDate(e.fields.einsatzdatum) : null,
        ].filter(Boolean).join(' · '),
        tone: e.fields.status && lookupKey(e.fields.status) === 'in_durchfuehrung' ? 'primary' as const : 'default' as const,
      }));
  }, [enrichedEinsatzplanung, statusFilter]);

  // KPIs
  const heuteEinsaetze = useMemo(() =>
    einsatzplanung.filter(e => e.fields.einsatzdatum === today),
    [einsatzplanung, today]
  );
  const geplantEinsaetze = useMemo(() =>
    einsatzplanung.filter(e => lookupKey(e.fields.status) === 'geplant'),
    [einsatzplanung]
  );
  const inDurchfuehrung = useMemo(() =>
    einsatzplanung.filter(e => lookupKey(e.fields.status) === 'in_durchfuehrung'),
    [einsatzplanung]
  );

  // Terminwünsche ohne Einsatz (offene Anfragen)
  const einsatzTerminIds = useMemo(() => {
    const ids = new Set<string>();
    einsatzplanung.forEach(e => {
      (e.fields.terminwuensche ?? []).forEach(url => {
        const id = url.match(/([a-f0-9]{24})$/i)?.[1];
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [einsatzplanung]);

  const offeneTerminwuensche = useMemo(() =>
    terminwunsch.filter(t => !einsatzTerminIds.has(t.record_id)),
    [terminwunsch, einsatzTerminIds]
  );

  // Eichprotokolle — fällige nächste Eichungen
  const eichfaellig = useMemo(() => {
    return enrichedEichprotokoll
      .filter(e => e.fields.naechste_eichung && (
        isPast(parseISO(e.fields.naechste_eichung)) ||
        isToday(parseISO(e.fields.naechste_eichung))
      ))
      .sort((a, b) => (a.fields.naechste_eichung ?? '').localeCompare(b.fields.naechste_eichung ?? ''));
  }, [enrichedEichprotokoll, today]);

  // Hero: unbearbeitete Terminwünsche
  const hasPendingTermine = offeneTerminwuensche.length > 0;
  const termineNamen = namen(offeneTerminwuensche.map(t => t.fields.firmenname ?? `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim()).filter(Boolean));

  // Context line
  const contextLine = useMemo(() => {
    if (heuteEinsaetze.length === 0 && inDurchfuehrung.length === 0) {
      return tx('Keine Einsätze heute geplant.');
    }
    const names = namen(heuteEinsaetze.map(e => {
      const ep = enrichedEinsatzplanung.find(r => r.record_id === e.record_id);
      return ep?.kundeName ?? e.fields.einsatznummer ?? '';
    }).filter(Boolean));
    if (names) return tx`Heute im Einsatz bei ${names}.`;
    return tx('Heute mehrere Einsätze geplant.');
  }, [heuteEinsaetze, inDurchfuehrung, enrichedEinsatzplanung]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{contextLine}</p>
        </div>
        <button
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => crud.einsatzplanung.openCreate({ status: 'geplant' })}
        >
          <IconTruck size={16} className="shrink-0" />
          {tx('Neuer Einsatz')}
        </button>
      </div>

      <DashboardGrid
        variant="wide"
        hero={hasPendingTermine && (
          <HeroBanner
            icon={<IconAlertTriangle size={18} />}
            action={{
              label: tx('Einsatz anlegen'),
              onClick: () => {
                const t = offeneTerminwuensche[0];
                if (t) crud.einsatzplanung.openCreate({ terminwuensche: [t.record_id] });
                else crud.einsatzplanung.openCreate({ status: 'geplant' });
              },
            }}
          >
            <b>{termineNamen}</b> {offeneTerminwuensche.length === 1 ? tx('hat einen offenen Terminwunsch') : tx('haben offene Terminwünsche')} — {tx('noch kein Einsatz geplant.')}
          </HeroBanner>
        )}
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Heute')}
              value={heuteEinsaetze.length}
              icon={<IconCalendar size={16} />}
              tone={heuteEinsaetze.length > 0 ? 'primary' : 'default'}
            />
            <StatStripItem
              title={tx('Geplant')}
              value={geplantEinsaetze.length}
              icon={<IconClipboardList size={16} />}
              onClick={() => setStatusFilter(f => f === 'geplant' ? null : 'geplant')}
              active={statusFilter === 'geplant'}
            />
            <StatStripItem
              title={tx('In Durchführung')}
              value={inDurchfuehrung.length}
              icon={<IconTruck size={16} />}
              tone={inDurchfuehrung.length > 0 ? 'primary' : 'default'}
              onClick={() => setStatusFilter(f => f === 'in_durchfuehrung' ? null : 'in_durchfuehrung')}
              active={statusFilter === 'in_durchfuehrung'}
            />
            <StatStripItem
              title={tx('Eichfristen fällig')}
              value={eichfaellig.length}
              icon={<IconCheckbox size={16} />}
              tone={eichfaellig.length > 0 ? 'warning' : 'default'}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            columns={kanbanColumns}
            cards={kanbanCards}
            defaultCollapsed={['storniert']}
            onCardClick={(card) => {
              const id = card.id.split(':')[1];
              const rec = einsatzplanung.find(e => e.record_id === id);
              if (rec) crud.einsatzplanung.openDetail(rec);
            }}
            onCardMove={async (cardId, newColumn) => {
              const id = cardId.split(':')[1];
              const rec = einsatzplanung.find(e => e.record_id === id);
              if (!rec) return;
              const prevStatus = rec.fields.status;
              const optimistic = einsatzplanung.map(e =>
                e.record_id === id
                  ? { ...e, fields: { ...e.fields, status: lookupOption('einsatzplanung', 'status', newColumn) } }
                  : e
              );
              setEinsatzplanung(optimistic);
              const label = lookupOption('einsatzplanung', 'status', newColumn).label;
              undoToast(tx`Status: ${label}`, async () => {
                setEinsatzplanung(einsatzplanung);
                await LivingAppsService.updateEinsatzplanungEntry(id, {
                  status: prevStatus?.key ?? prevStatus as unknown as string,
                });
              });
              try {
                await LivingAppsService.updateEinsatzplanungEntry(id, { status: newColumn });
              } catch {
                setEinsatzplanung(einsatzplanung);
                fetchAll();
              }
            }}
            onAddCard={(column) => crud.einsatzplanung.openCreate({ status: column })}
          />
        }
        aside={<>
          <WorkList
            title={tx('Offene Terminwünsche')}
            items={offeneTerminwuensche.slice(0, 8).map(t => ({
              id: t.record_id,
              title: (t.fields.firmenname ?? `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim()) || tx('Unbekannt'),
              secondLine: <>
                <span className="text-muted-foreground">
                  {t.fields.waagentyp?.label ?? '—'}
                  {t.fields.wunschzeitraum_von ? ` · ab ${formatDate(t.fields.wunschzeitraum_von)}` : ''}
                </span>
              </>,
              action: {
                label: tx('Einsatz planen'),
                onClick: () => crud.einsatzplanung.openCreate({ terminwuensche: [t.record_id] }),
              },
            }))}
            onItemClick={(id) => {
              const rec = terminwunsch.find(t => t.record_id === id);
              if (rec) crud.terminwunsch.openDetail(rec);
            }}
            empty={{
              text: tx('Alle Terminwünsche sind bereits eingeplant.'),
              action: { label: tx('Terminwunsch erfassen'), onClick: () => crud.terminwunsch.openCreate({}) },
            }}
          />
          <WorkList
            title={tx('Eichfristen fällig')}
            items={eichfaellig.slice(0, 5).map(e => ({
              id: e.record_id,
              title: e.fields.protokollnummer ?? tx('Protokoll'),
              secondLine: <>
                <span className={isPast(parseISO(e.fields.naechste_eichung ?? today)) ? 'font-medium text-destructive' : 'text-amber-600'}>
                  {isToday(parseISO(e.fields.naechste_eichung ?? today)) ? tx('Heute fällig') : tx('Überfällig')}
                </span>
                <span className="text-muted-foreground"> · {formatDate(e.fields.naechste_eichung)}</span>
              </>,
              action: {
                label: tx('Neues Protokoll'),
                onClick: () => crud.eichprotokoll.openCreate({ einsatz: e.fields.einsatz ?? undefined }),
              },
            }))}
            onItemClick={(id) => {
              const rec = eichprotokoll.find(ep => ep.record_id === id);
              if (rec) crud.eichprotokoll.openDetail(rec);
            }}
            empty={{
              text: tx('Keine fälligen Eichfristen — alles aktuell.'),
            }}
          />
        </>}
      />

      {crud.surfaces}
    </div>
  );
}
