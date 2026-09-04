import type { Eichprotokoll, Einsatzplanung, Kundenstamm } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';

export interface EichprotokollDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Eichprotokoll;
  /** N:1-Ziel „Einsatzplanung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  einsatzplanungList: Einsatzplanung[];
  /** Klick auf die Einsatzplanung-Relation → overlay.push auf dessen Detail. */
  onOpenEinsatzplanung?: (record: Einsatzplanung) => void;
  /** N:1-Ziel „Kundenstamm": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenstammList: Kundenstamm[];
  /** Klick auf die Kundenstamm-Relation → overlay.push auf dessen Detail. */
  onOpenKundenstamm?: (record: Kundenstamm) => void;
}

export function EichprotokollDetails({
  record,
  einsatzplanungList,
  onOpenEinsatzplanung,
  kundenstammList,
  onOpenKundenstamm,
}: EichprotokollDetailsProps) {
  const einsatzTarget = einsatzplanungList.find(r => r.record_id === extractRecordId(record.fields.einsatz));
  const kundeTarget = kundenstammList.find(r => r.record_id === extractRecordId(record.fields.kunde));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('eichprotokoll', 'protokollnummer')} value={record.fields.protokollnummer} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'eichungsdatum')} value={record.fields.eichungsdatum} format="date" />
        <RecordField label={fieldLabel('eichprotokoll', 'waagentyp')} value={record.fields.waagentyp} format="pill" />
        <RecordField label={fieldLabel('eichprotokoll', 'hersteller')} value={record.fields.hersteller} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'seriennummer')} value={record.fields.seriennummer} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'nennlast_kg')} value={record.fields.nennlast_kg} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'eichklasse')} value={record.fields.eichklasse} format="pill" />
        <RecordField label={fieldLabel('eichprotokoll', 'vorlagewert_kg')} value={record.fields.vorlagewert_kg} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'istwert_kg')} value={record.fields.istwert_kg} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'abweichung_kg')} value={record.fields.abweichung_kg} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'eichergebnis')} value={record.fields.eichergebnis} format="pill" />
        <RecordField label={fieldLabel('eichprotokoll', 'pruefmittel')} value={record.fields.pruefmittel} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('eichprotokoll', 'eichsiegel_nummer')} value={record.fields.eichsiegel_nummer} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'naechste_eichung')} value={record.fields.naechste_eichung} format="date" />
        <RecordField label={fieldLabel('eichprotokoll', 'pruefer_vorname')} value={record.fields.pruefer_vorname} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'pruefer_nachname')} value={record.fields.pruefer_nachname} format="text" />
        <RecordField label={fieldLabel('eichprotokoll', 'unterschrift_pruefer')} className="md:col-span-2">
          {record.fields.unterschrift_pruefer ? (
            <MediaThumbnail src={record.fields.unterschrift_pruefer as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('eichprotokoll', 'fotos')} className="md:col-span-2">
          {record.fields.fotos ? (
            <MediaThumbnail src={record.fields.fotos as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('eichprotokoll', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('eichprotokoll', 'einsatz')}
          name={einsatzTarget?.fields.einsatznummer ?? '—'}
          meta={[einsatzTarget?.fields.startpunkt].filter(Boolean).join(' · ') || undefined}
          onClick={einsatzTarget && onOpenEinsatzplanung ? () => onOpenEinsatzplanung!(einsatzTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('eichprotokoll', 'kunde')}
          name={kundeTarget?.fields.firmenname ?? '—'}
          meta={[kundeTarget?.fields.telefon, kundeTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={kundeTarget && onOpenKundenstamm ? () => onOpenKundenstamm!(kundeTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.EICHPROTOKOLL} recordId={record.record_id} />
    </>
  );
}
