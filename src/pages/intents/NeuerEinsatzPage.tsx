/**
 * Neuer Einsatz — 5-Schritt-Wizard.
 * Steps: 1) Terminwünsche wählen → 2) Einsatzdetails → 3) Mitarbeiter & Fahrzeuge → 4) Zusammenfassung → 5) Erfolg.
 * Reads: terminwunsch, mitarbeiterstamm, fahrzeugstamm.
 * Writes: einsatzplanung (createEinsatzplanungEntry).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Field } from '@/components/blocks/Field';
import { Bound } from '@/components/blocks/Bound';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldLookup, todayIso } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LOOKUP_OPTIONS } from '@/types/app';
import { tx } from '@/i18n';

export default function NeuerEinsatzPage() {
  const data = useDashboardData({ omit: ['terminwunsch', 'mitarbeiterstamm', 'fahrzeugstamm'] });

  const terminwuensche = useRecordSearch(servicePort, 'terminwunsch', {
    searchFields: ['firmenname', 'nachname', 'ort'],
    toItem: tw => ({
      id: tw.id,
      title: [fieldText(tw, 'firmenname'), fieldText(tw, 'vorname'), fieldText(tw, 'nachname')]
        .filter(Boolean).join(' ') || tw.id,
      subtitle: [fieldText(tw, 'strasse'), fieldText(tw, 'ort')].filter(Boolean).join(', '),
      stats: [
        { label: tx('Waagentyp'), value: fieldLookup(tw, 'waagentyp')?.label ?? '—' },
        { label: tx('Waagen'), value: String(tw.fields['anzahl_waagen'] ?? '—') },
      ],
    }),
  });

  const mitarbeiter = useRecordSearch(servicePort, 'mitarbeiterstamm', {
    searchFields: ['vorname', 'nachname'],
    toItem: ma => ({
      id: ma.id,
      title: `${fieldText(ma, 'vorname')} ${fieldText(ma, 'nachname')}`.trim(),
      subtitle: fieldText(ma, 'personalnummer') ?? undefined,
      stats: [
        { label: tx('Führerschein'), value: fieldLookup(ma, 'fuehrerscheinklasse')?.label ?? '—' },
      ],
    }),
  });

  const fahrzeuge = useRecordSearch(servicePort, 'fahrzeugstamm', {
    searchFields: ['kennzeichen', 'bezeichnung'],
    toItem: fz => ({
      id: fz.id,
      title: fieldText(fz, 'kennzeichen') ?? fz.id,
      subtitle: fieldText(fz, 'bezeichnung') ?? undefined,
      stats: [
        { label: tx('Typ'), value: fieldLookup(fz, 'fahrzeugtyp')?.label ?? '—' },
      ],
    }),
  });

  const [step, setStep] = useState(1);

  const statusOptions = LOOKUP_OPTIONS['einsatzplanung']?.['status'] ?? [];
  const defaultStatus = statusOptions.find(o => o.key === 'geplant')?.key ?? statusOptions[0]?.key;

  const einsatzForm = useStepForm('einsatzplanung', {
    steps: {
      terminwuensche: 1,
      einsatznummer: 2,
      einsatzdatum: 2,
      geplante_startzeit: 2,
      geplante_endzeit: 2,
      status: 2,
      routenreihenfolge: 2,
      gesamtstrecke_km: 2,
      startpunkt: 2,
      mitarbeiter: 3,
      fahrzeuge: 3,
    },
    initial: {
      status: defaultStatus,
      einsatzdatum: todayIso(),
    },
  });

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'einsatz',
      entity: 'einsatzplanung',
      form: einsatzForm,
      primary: true,
    },
  ], { draftKey: 'neuer-einsatz' });

  const restart = () => { submit.reset(); einsatzForm.reset(); setStep(1); };

  return (
    <IntentWizardShell
      title={tx('Neuer Einsatz')}
      currentStep={step}
      onStepChange={setStep}
      loading={data.loading}
      error={data.error}
      onRetry={data.fetchAll}
      forms={[einsatzForm]}
      draftKey="neuer-einsatz"
      intro={{
        description: tx('Terminwünsche zuordnen, Datum und Zeit festlegen, Mitarbeiter und Fahrzeuge einteilen.'),
        needs: [tx('Offene Terminwünsche'), tx('Einsatzdatum'), tx('Verfügbare Mitarbeiter')],
      }}
    >
      {/* Schritt 1: Terminwünsche wählen */}
      <WizardStep
        label={tx('Terminwünsche')}
        heading={tx('Terminwünsche auswählen')}
        description={tx('Wähle einen oder mehrere Terminwünsche, die in diesem Einsatz bearbeitet werden.')}
      >
        <Field form={einsatzForm} name="terminwuensche">
          <EntitySelectStep
            {...terminwuensche.select}
            {...einsatzForm.records('terminwuensche', terminwuensche.labelOf)}
            searchPlaceholder={tx('Nach Firma, Name oder Ort suchen …')}
            emptyText={tx('Keine Terminwünsche gefunden.')}
          />
        </Field>
        <StepNav
          hideBack
          onNext={() => einsatzForm.validate(['terminwuensche'])}
          nextStepLabel={tx('Einsatzdetails')}
        />
      </WizardStep>

      {/* Schritt 2: Einsatzdetails */}
      <WizardStep
        label={tx('Details')}
        heading={tx('Einsatzdetails festlegen')}
        description={tx('Nummer, Datum, Zeiten und Status des Einsatzes eingeben.')}
      >
        {einsatzForm.get('terminwuensche') ? (
          <div className="space-y-4">
            <Bound form={einsatzForm} name="einsatznummer" />
            <Bound form={einsatzForm} name="einsatzdatum" />
            <Bound form={einsatzForm} name="geplante_startzeit" />
            <Bound form={einsatzForm} name="geplante_endzeit" />
            <Field form={einsatzForm} name="status">
              <ChoiceGroup {...einsatzForm.choice('status')} />
            </Field>
            <Bound form={einsatzForm} name="startpunkt" />
            <Bound form={einsatzForm} name="routenreihenfolge" />
            <Bound form={einsatzForm} name="gesamtstrecke_km" />
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => einsatzForm.validate(['einsatznummer', 'einsatzdatum', 'geplante_startzeit', 'geplante_endzeit', 'status'])}
              nextStepLabel={tx('Mitarbeiter & Fahrzeuge')}
            />
          </div>
        ) : (
          <StepNav
            onBack={() => setStep(1)}
            nextDisabled
          >
            {tx('Bitte zuerst Terminwünsche aus Schritt 1 auswählen.')}
          </StepNav>
        )}
      </WizardStep>

      {/* Schritt 3: Mitarbeiter & Fahrzeuge */}
      <WizardStep
        label={tx('Team & Fahrzeuge')}
        heading={tx('Mitarbeiter und Fahrzeuge zuteilen')}
        description={tx('Wähle die Mitarbeiter und Fahrzeuge, die für diesen Einsatz eingeplant werden.')}
      >
        {einsatzForm.get('einsatzdatum') ? (
          <div className="space-y-6">
            <div>
              <Field form={einsatzForm} name="mitarbeiter">
                <EntitySelectStep
                  {...mitarbeiter.select}
                  {...einsatzForm.records('mitarbeiter', mitarbeiter.labelOf)}
                  searchPlaceholder={tx('Nach Name suchen …')}
                  emptyText={tx('Keine Mitarbeiter gefunden.')}
                />
              </Field>
            </div>
            <div>
              <Field form={einsatzForm} name="fahrzeuge">
                <EntitySelectStep
                  {...fahrzeuge.select}
                  {...einsatzForm.records('fahrzeuge', fahrzeuge.labelOf)}
                  searchPlaceholder={tx('Nach Kennzeichen oder Bezeichnung suchen …')}
                  emptyText={tx('Keine Fahrzeuge gefunden.')}
                />
              </Field>
            </div>
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => einsatzForm.validate(['mitarbeiter', 'fahrzeuge'])}
              nextStepLabel={tx('Zusammenfassung')}
            />
          </div>
        ) : (
          <StepNav
            onBack={() => setStep(2)}
            nextDisabled
          >
            {tx('Bitte zuerst die Einsatzdetails in Schritt 2 ausfüllen.')}
          </StepNav>
        )}
      </WizardStep>

      {/* Schritt 4: Zusammenfassung */}
      <WizardStep label={tx('Zusammenfassung')}>
        {!submit.done && (
          <SummaryStep
            forms={[einsatzForm]}
            submit={submit}
            whatHappensNext={tx('Der Einsatz wird angelegt und ist sofort in der Einsatzplanung sichtbar.')}
          />
        )}
      </WizardStep>

      {/* Erfolg */}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[einsatzForm]}
          whatHappensNext={tx('Der Einsatz ist nun geplant. Eichprotokolle können nach Abschluss erfasst werden.')}
          next={[
            { label: tx('Weiteren Einsatz anlegen'), onClick: restart },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
