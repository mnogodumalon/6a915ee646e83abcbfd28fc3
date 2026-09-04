import type { Terminwunsch, Einsatzplanung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MapRouteLinks } from '@/components/widgets/MapWidget';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface TerminwunschDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Terminwunsch;
  /** 1:N „Einsatzplanung" (terminwuensche): VOLLE Liste — der Block filtert auf diesen Record. */
  einsatzplanungList: Einsatzplanung[];
  /** Zeilen-Klick → overlay.push auf das Einsatzplanung-Detail (nie der Edit-Dialog). */
  onOpenEinsatzplanung: (record: Einsatzplanung) => void;
  /** Kontextuelles „+": öffnet den Einsatzplanung-Dialog mit diesem Record vorgesetzt. */
  onAddEinsatzplanung: () => void;
}

export function TerminwunschDetails({
  record,
  einsatzplanungList,
  onOpenEinsatzplanung,
  onAddEinsatzplanung,
}: TerminwunschDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('terminwunsch', 'firmenname')} value={record.fields.firmenname} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('terminwunsch', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'standort_karte')}>
          {record.fields.standort_karte ? (
            <div className="space-y-1">
              <div>{record.fields.standort_karte.info ?? `${record.fields.standort_karte.lat}, ${record.fields.standort_karte.long}`}</div>
              {/* Directions links — the map popup is hover-fleeting; the overlay
                  is the only mobile-reachable place for navigation. */}
              <MapRouteLinks lat={record.fields.standort_karte.lat} long={record.fields.standort_karte.long} />
            </div>
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('terminwunsch', 'waagentyp')} value={record.fields.waagentyp} format="pill" />
        <RecordField label={fieldLabel('terminwunsch', 'anzahl_waagen')} value={record.fields.anzahl_waagen} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'serviceart')} value={Array.isArray(record.fields.serviceart) ? record.fields.serviceart.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('terminwunsch', 'wunschzeitraum_von')} value={record.fields.wunschzeitraum_von} format="date" />
        <RecordField label={fieldLabel('terminwunsch', 'wunschzeitraum_bis')} value={record.fields.wunschzeitraum_bis} format="date" />
        <RecordField label={fieldLabel('terminwunsch', 'bevorzugte_tageszeit')} value={record.fields.bevorzugte_tageszeit} format="pill" />
        <RecordField label={fieldLabel('terminwunsch', 'hinweise')} value={record.fields.hinweise} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('einsatzplanung')}
        items={einsatzplanungList.filter(r => Array.isArray(r.fields.terminwuensche) && r.fields.terminwuensche.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.einsatznummer ?? appLabel('einsatzplanung'), meta: r.fields.einsatzdatum })}
        onOpen={onOpenEinsatzplanung}
        onAdd={onAddEinsatzplanung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.TERMINWUNSCH} recordId={record.record_id} />
    </>
  );
}
