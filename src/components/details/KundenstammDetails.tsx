import type { Kundenstamm, Einsatzplanung, Eichprotokoll } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MapRouteLinks } from '@/components/widgets/MapWidget';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface KundenstammDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kundenstamm;
  /** 1:N „Einsatzplanung" (kunde): VOLLE Liste — der Block filtert auf diesen Record. */
  einsatzplanungList: Einsatzplanung[];
  /** Zeilen-Klick → overlay.push auf das Einsatzplanung-Detail (nie der Edit-Dialog). */
  onOpenEinsatzplanung: (record: Einsatzplanung) => void;
  /** Kontextuelles „+": öffnet den Einsatzplanung-Dialog mit diesem Record vorgesetzt. */
  onAddEinsatzplanung: () => void;
  /** 1:N „Eichprotokoll" (kunde): VOLLE Liste — der Block filtert auf diesen Record. */
  eichprotokollList: Eichprotokoll[];
  /** Zeilen-Klick → overlay.push auf das Eichprotokoll-Detail (nie der Edit-Dialog). */
  onOpenEichprotokoll: (record: Eichprotokoll) => void;
  /** Kontextuelles „+": öffnet den Eichprotokoll-Dialog mit diesem Record vorgesetzt. */
  onAddEichprotokoll: () => void;
}

export function KundenstammDetails({
  record,
  einsatzplanungList,
  onOpenEinsatzplanung,
  onAddEinsatzplanung,
  eichprotokollList,
  onOpenEichprotokoll,
  onAddEichprotokoll,
}: KundenstammDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kundenstamm', 'firmenname')} value={record.fields.firmenname} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('kundenstamm', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('kundenstamm', 'standort')}>
          {record.fields.standort ? (
            <div className="space-y-1">
              <div>{record.fields.standort.info ?? `${record.fields.standort.lat}, ${record.fields.standort.long}`}</div>
              {/* Directions links — the map popup is hover-fleeting; the overlay
                  is the only mobile-reachable place for navigation. */}
              <MapRouteLinks lat={record.fields.standort.lat} long={record.fields.standort.long} />
            </div>
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('kundenstamm', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('einsatzplanung')}
        items={einsatzplanungList.filter(r => extractRecordId(r.fields.kunde) === record.record_id)}
        map={r => ({ name: r.fields.einsatznummer ?? appLabel('einsatzplanung'), meta: r.fields.einsatzdatum })}
        onOpen={onOpenEinsatzplanung}
        onAdd={onAddEinsatzplanung}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('eichprotokoll')}
        items={eichprotokollList.filter(r => extractRecordId(r.fields.kunde) === record.record_id)}
        map={r => ({ name: r.fields.protokollnummer ?? appLabel('eichprotokoll'), meta: r.fields.eichungsdatum })}
        onOpen={onOpenEichprotokoll}
        onAdd={onAddEichprotokoll}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KUNDENSTAMM} recordId={record.record_id} />
    </>
  );
}
