import type { Einsatzplanung, Terminwunsch, Kundenstamm, Mitarbeiterstamm, Fahrzeugstamm, Eichprotokoll } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface EinsatzplanungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Einsatzplanung;
  /** N:1-Ziel „Terminwunsch": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  terminwunschList: Terminwunsch[];
  /** Reserviert — Terminwunsch ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenTerminwunsch?: (record: Terminwunsch) => void;
  /** N:1-Ziel „Kundenstamm": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenstammList: Kundenstamm[];
  /** Klick auf die Kundenstamm-Relation → overlay.push auf dessen Detail. */
  onOpenKundenstamm?: (record: Kundenstamm) => void;
  /** N:1-Ziel „Mitarbeiterstamm": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeiterstammList: Mitarbeiterstamm[];
  /** Reserviert — Mitarbeiterstamm ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenMitarbeiterstamm?: (record: Mitarbeiterstamm) => void;
  /** N:1-Ziel „Fahrzeugstamm": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  fahrzeugstammList: Fahrzeugstamm[];
  /** Reserviert — Fahrzeugstamm ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenFahrzeugstamm?: (record: Fahrzeugstamm) => void;
  /** 1:N „Eichprotokoll" (einsatz): VOLLE Liste — der Block filtert auf diesen Record. */
  eichprotokollList: Eichprotokoll[];
  /** Zeilen-Klick → overlay.push auf das Eichprotokoll-Detail (nie der Edit-Dialog). */
  onOpenEichprotokoll: (record: Eichprotokoll) => void;
  /** Kontextuelles „+": öffnet den Eichprotokoll-Dialog mit diesem Record vorgesetzt. */
  onAddEichprotokoll: () => void;
}

export function EinsatzplanungDetails({
  record,
  terminwunschList,
  kundenstammList,
  onOpenKundenstamm,
  mitarbeiterstammList,
  fahrzeugstammList,
  eichprotokollList,
  onOpenEichprotokoll,
  onAddEichprotokoll,
}: EinsatzplanungDetailsProps) {
  const kundeTarget = kundenstammList.find(r => r.record_id === extractRecordId(record.fields.kunde));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('einsatzplanung', 'einsatznummer')} value={record.fields.einsatznummer} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'einsatzdatum')} value={record.fields.einsatzdatum} format="date" />
        <RecordField label={fieldLabel('einsatzplanung', 'geplante_startzeit')} value={record.fields.geplante_startzeit} format="datetime" />
        <RecordField label={fieldLabel('einsatzplanung', 'geplante_endzeit')} value={record.fields.geplante_endzeit} format="datetime" />
        <RecordField label={fieldLabel('einsatzplanung', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('einsatzplanung', 'terminwuensche')} value={Array.isArray(record.fields.terminwuensche) ? record.fields.terminwuensche.map((u: unknown) => terminwunschList.find(t => t.record_id === extractRecordId(u))?.fields.firmenname ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'routenreihenfolge')} value={record.fields.routenreihenfolge} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'gesamtstrecke_km')} value={record.fields.gesamtstrecke_km} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'startpunkt')} value={record.fields.startpunkt} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'routennotizen')} value={record.fields.routennotizen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('einsatzplanung', 'mitarbeiter')} value={Array.isArray(record.fields.mitarbeiter) ? record.fields.mitarbeiter.map((u: unknown) => mitarbeiterstammList.find(t => t.record_id === extractRecordId(u))?.fields.vorname ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'fahrzeuge')} value={Array.isArray(record.fields.fahrzeuge) ? record.fields.fahrzeuge.map((u: unknown) => fahrzeugstammList.find(t => t.record_id === extractRecordId(u))?.fields.kennzeichen ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'arbeitszeit_eingehalten')} value={record.fields.arbeitszeit_eingehalten} format="bool" />
        <RecordField label={fieldLabel('einsatzplanung', 'pause_geplant')} value={record.fields.pause_geplant} format="bool" />
        <RecordField label={fieldLabel('einsatzplanung', 'pausendauer_min')} value={record.fields.pausendauer_min} format="text" />
        <RecordField label={fieldLabel('einsatzplanung', 'ueberstunden_begruendung')} value={record.fields.ueberstunden_begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('einsatzplanung', 'interne_notizen')} value={record.fields.interne_notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('einsatzplanung', 'kunde')}
          name={kundeTarget?.fields.firmenname ?? '—'}
          meta={[kundeTarget?.fields.telefon, kundeTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={kundeTarget && onOpenKundenstamm ? () => onOpenKundenstamm!(kundeTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('eichprotokoll')}
        items={eichprotokollList.filter(r => extractRecordId(r.fields.einsatz) === record.record_id)}
        map={r => ({ name: r.fields.protokollnummer ?? appLabel('eichprotokoll'), meta: r.fields.eichungsdatum })}
        onOpen={onOpenEichprotokoll}
        onAdd={onAddEichprotokoll}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.EINSATZPLANUNG} recordId={record.record_id} />
    </>
  );
}
