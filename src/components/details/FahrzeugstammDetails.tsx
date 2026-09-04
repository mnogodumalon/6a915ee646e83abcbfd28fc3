import type { Fahrzeugstamm, Einsatzplanung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface FahrzeugstammDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Fahrzeugstamm;
  /** 1:N „Einsatzplanung" (fahrzeuge): VOLLE Liste — der Block filtert auf diesen Record. */
  einsatzplanungList: Einsatzplanung[];
  /** Zeilen-Klick → overlay.push auf das Einsatzplanung-Detail (nie der Edit-Dialog). */
  onOpenEinsatzplanung: (record: Einsatzplanung) => void;
  /** Kontextuelles „+": öffnet den Einsatzplanung-Dialog mit diesem Record vorgesetzt. */
  onAddEinsatzplanung: () => void;
}

export function FahrzeugstammDetails({
  record,
  einsatzplanungList,
  onOpenEinsatzplanung,
  onAddEinsatzplanung,
}: FahrzeugstammDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('fahrzeugstamm', 'kennzeichen')} value={record.fields.kennzeichen} format="text" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'fahrzeugtyp')} value={record.fields.fahrzeugtyp} format="pill" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'anhaenger_vorhanden')} value={record.fields.anhaenger_vorhanden} format="bool" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'max_nutzlast_kg')} value={record.fields.max_nutzlast_kg} format="text" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'zulassungsdatum')} value={record.fields.zulassungsdatum} format="date" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'naechste_hauptuntersuchung')} value={record.fields.naechste_hauptuntersuchung} format="date" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'naechste_eichung_fahrzeug')} value={record.fields.naechste_eichung_fahrzeug} format="date" />
        <RecordField label={fieldLabel('fahrzeugstamm', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('einsatzplanung')}
        items={einsatzplanungList.filter(r => Array.isArray(r.fields.fahrzeuge) && r.fields.fahrzeuge.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.einsatznummer ?? appLabel('einsatzplanung'), meta: r.fields.einsatzdatum })}
        onOpen={onOpenEinsatzplanung}
        onAdd={onAddEinsatzplanung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.FAHRZEUGSTAMM} recordId={record.record_id} />
    </>
  );
}
