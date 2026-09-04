import type { Mitarbeiterstamm, Einsatzplanung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface MitarbeiterstammDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitarbeiterstamm;
  /** 1:N „Einsatzplanung" (mitarbeiter): VOLLE Liste — der Block filtert auf diesen Record. */
  einsatzplanungList: Einsatzplanung[];
  /** Zeilen-Klick → overlay.push auf das Einsatzplanung-Detail (nie der Edit-Dialog). */
  onOpenEinsatzplanung: (record: Einsatzplanung) => void;
  /** Kontextuelles „+": öffnet den Einsatzplanung-Dialog mit diesem Record vorgesetzt. */
  onAddEinsatzplanung: () => void;
}

export function MitarbeiterstammDetails({
  record,
  einsatzplanungList,
  onOpenEinsatzplanung,
  onAddEinsatzplanung,
}: MitarbeiterstammDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitarbeiterstamm', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'personalnummer')} value={record.fields.personalnummer} format="text" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'fuehrerscheinklasse')} value={record.fields.fuehrerscheinklasse} format="pill" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'eichberechtigung')} value={record.fields.eichberechtigung} format="bool" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'qualifikationen')} value={record.fields.qualifikationen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'arbeitszeitmodell')} value={record.fields.arbeitszeitmodell} format="pill" />
        <RecordField label={fieldLabel('mitarbeiterstamm', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('einsatzplanung')}
        items={einsatzplanungList.filter(r => Array.isArray(r.fields.mitarbeiter) && r.fields.mitarbeiter.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.einsatznummer ?? appLabel('einsatzplanung'), meta: r.fields.einsatzdatum })}
        onOpen={onOpenEinsatzplanung}
        onAdd={onAddEinsatzplanung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITARBEITERSTAMM} recordId={record.record_id} />
    </>
  );
}
