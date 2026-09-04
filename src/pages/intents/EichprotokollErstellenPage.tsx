/**
 * Eichprotokoll erstellen — 5-Schritt-Wizard.
 * Steps: 1) Einsatz wählen → 2) Kunde & Waage → 3) Messwerte & Eichklasse → 4) Prüfer → 5) Prüfen & anlegen.
 * Reads: einsatzplanung, kundenstamm. Writes: eichprotokoll (createEichprotokollEntry).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/DatePicker';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Field } from '@/components/blocks/Field';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldLookup, fieldDate } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatDate } from '@/lib/formatters';
import { tx } from '@/i18n';
import { LOOKUP_OPTIONS } from '@/types/app';

export default function EichprotokollErstellenPage() {
  const data = useDashboardData({ omit: ['einsatzplanung', 'kundenstamm'] });

  const einsaetze = useRecordSearch(servicePort, 'einsatzplanung', {
    searchFields: ['einsatznummer'],
    filter: "r.v_status == 'abgeschlossen' or r.v_status == 'in_durchfuehrung'",
    where: r => {
      const key = fieldLookup(r, 'status')?.key;
      return key === 'abgeschlossen' || key === 'in_durchfuehrung';
    },
    toItem: e => ({
      id: e.id,
      title: fieldText(e, 'einsatznummer') ?? e.id,
      subtitle: fieldDate(e, 'einsatzdatum') ? formatDate(fieldDate(e, 'einsatzdatum')!) : undefined,
      status: fieldLookup(e, 'status') ?? undefined,
    }),
  });

  const kunden = useRecordSearch(servicePort, 'kundenstamm', {
    searchFields: ['firmenname', 'nachname'],
    toItem: k => ({
      id: k.id,
      title: [fieldText(k, 'firmenname'), fieldText(k, 'vorname'), fieldText(k, 'nachname')]
        .filter(Boolean).join(' '),
      subtitle: fieldText(k, 'ort') ?? undefined,
    }),
  });

  const [step, setStep] = useState(1);

  const step1Form = useStepForm('eichprotokoll', {
    steps: { einsatz: 1 },
  });

  const step2Form = useStepForm('eichprotokoll', {
    steps: { kunde: 2, waagentyp: 2, hersteller: 2, seriennummer: 2, nennlast_kg: 2 },
  });

  const step3Form = useStepForm('eichprotokoll', {
    steps: {
      protokollnummer: 3, eichungsdatum: 3, eichklasse: 3,
      vorlagewert_kg: 3, istwert_kg: 3, abweichung_kg: 3,
      eichergebnis: 3, pruefmittel: 3, eichsiegel_nummer: 3, naechste_eichung: 3,
    },
  });

  const step4Form = useStepForm('eichprotokoll', {
    steps: { pruefer_vorname: 4, pruefer_nachname: 4, bemerkungen: 4 },
  });

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'eichprotokoll',
      entity: 'eichprotokoll',
      form: step1Form,
      primary: true,
      values: {
        ...step2Form.payload(),
        ...step3Form.payload(),
        ...step4Form.payload(),
      },
    },
  ], { draftKey: 'eichprotokoll-erstellen' });

  const restart = () => {
    submit.reset();
    step1Form.reset();
    step2Form.reset();
    step3Form.reset();
    step4Form.reset();
    setStep(1);
  };

  const waagentypOptions = LOOKUP_OPTIONS['eichprotokoll']?.['waagentyp'] ?? [];
  const eichklasseOptions = LOOKUP_OPTIONS['eichprotokoll']?.['eichklasse'] ?? [];
  const eichergebnisOptions = LOOKUP_OPTIONS['eichprotokoll']?.['eichergebnis'] ?? [];

  return (
    <IntentWizardShell
      title={tx('Eichprotokoll erstellen')}
      currentStep={step}
      onStepChange={setStep}
      loading={data.loading}
      error={data.error}
      onRetry={data.fetchAll}
      forms={[step1Form, step2Form, step3Form, step4Form]}
      draftKey="eichprotokoll-erstellen"
      intro={{
        description: tx('Ein Eichprotokoll für eine abgeschlossene oder laufende Einsatzprüfung anlegen.'),
        needs: [tx('Einsatznummer'), tx('Kundenzuordnung'), tx('Messwerte & Prüfergebnis'), tx('Name des Prüfers')],
      }}
    >
      {/* Schritt 1: Einsatz wählen */}
      <WizardStep
        label={tx('Einsatz')}
        description={tx('Wähle den Einsatz, für den das Protokoll erstellt wird.')}
      >
        <EntitySelectStep
          {...einsaetze.select}
          selectedId={step1Form.get('einsatz') as string}
          onSelect={id => {
            step1Form.set('einsatz', id, einsaetze.labelOf(id));
            setStep(2);
          }}
          searchPlaceholder={tx('Einsatznummer suchen …')}
          emptyText={tx('Keine abgeschlossenen oder laufenden Einsätze gefunden.')}
        />
      </WizardStep>

      {/* Schritt 2: Kunde & Waage */}
      <WizardStep
        label={tx('Kunde & Waage')}
        description={tx('Kunden zuordnen und Waagendaten erfassen.')}
      >
        {!step1Form.get('einsatz') ? (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Bitte zuerst einen Einsatz in Schritt 1 wählen.')}
          </StepNav>
        ) : (
          <div className="space-y-5">
            <EntitySelectStep
              {...kunden.select}
              selectedId={step2Form.get('kunde') as string}
              onSelect={id => {
                step2Form.set('kunde', id, kunden.labelOf(id));
              }}
              searchPlaceholder={tx('Firma oder Name suchen …')}
              emptyText={tx('Kein Kunde gefunden.')}
            />
            <div className="space-y-4 pt-2">
              <Field form={step2Form} name="waagentyp">
                <ChoiceGroup
                  {...step2Form.choice('waagentyp')}
                  options={waagentypOptions}
                />
              </Field>
              <Field form={step2Form} name="hersteller">
                <Input {...step2Form.field('hersteller')} placeholder={tx('z. B. Mettler-Toledo')} />
              </Field>
              <Field form={step2Form} name="seriennummer">
                <Input {...step2Form.field('seriennummer')} placeholder={tx('Seriennummer der Waage')} />
              </Field>
              <Field form={step2Form} name="nennlast_kg">
                <Input {...step2Form.number('nennlast_kg')} placeholder={tx('Nennlast in kg')} />
              </Field>
            </div>
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => step2Form.validate(['waagentyp'])}
              nextStepLabel={tx('Messwerte')}
            />
          </div>
        )}
      </WizardStep>

      {/* Schritt 3: Messwerte & Eichklasse */}
      <WizardStep
        label={tx('Messwerte')}
        description={tx('Messwerte, Eichklasse und Prüfergebnis eintragen.')}
      >
        {!step2Form.get('waagentyp') ? (
          <StepNav onBack={() => setStep(2)} nextDisabled>
            {tx('Bitte zuerst die Waagendaten in Schritt 2 erfassen.')}
          </StepNav>
        ) : (
          <div className="space-y-4">
            <Field form={step3Form} name="protokollnummer">
              <Input {...step3Form.field('protokollnummer')} placeholder={tx('z. B. EP-2026-0042')} />
            </Field>
            <Field form={step3Form} name="eichungsdatum">
              <DatePicker {...step3Form.date('eichungsdatum')} />
            </Field>
            <Field form={step3Form} name="eichklasse">
              <ChoiceGroup
                {...step3Form.choice('eichklasse')}
                options={eichklasseOptions}
              />
            </Field>
            <Field form={step3Form} name="vorlagewert_kg">
              <Input {...step3Form.number('vorlagewert_kg')} placeholder={tx('Vorlagewert in kg')} />
            </Field>
            <Field form={step3Form} name="istwert_kg">
              <Input {...step3Form.number('istwert_kg')} placeholder={tx('Istwert in kg')} />
            </Field>
            <Field form={step3Form} name="abweichung_kg">
              <Input {...step3Form.number('abweichung_kg')} placeholder={tx('Abweichung in kg')} />
            </Field>
            <Field form={step3Form} name="eichergebnis">
              <ChoiceGroup
                {...step3Form.choice('eichergebnis')}
                options={eichergebnisOptions}
              />
            </Field>
            <Field form={step3Form} name="pruefmittel">
              <Textarea {...step3Form.field('pruefmittel')} rows={2} placeholder={tx('Verwendete Prüfmittel')} />
            </Field>
            <Field form={step3Form} name="eichsiegel_nummer">
              <Input {...step3Form.field('eichsiegel_nummer')} placeholder={tx('Nummer des Eichsiegels')} />
            </Field>
            <Field form={step3Form} name="naechste_eichung">
              <DatePicker {...step3Form.date('naechste_eichung')} />
            </Field>
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => step3Form.validate(['protokollnummer', 'eichungsdatum', 'eichergebnis'])}
              nextStepLabel={tx('Prüfer')}
            />
          </div>
        )}
      </WizardStep>

      {/* Schritt 4: Prüfer */}
      <WizardStep
        label={tx('Prüfer')}
        description={tx('Namen des verantwortlichen Prüfers und optionale Bemerkungen angeben.')}
      >
        {!step3Form.get('protokollnummer') ? (
          <StepNav onBack={() => setStep(3)} nextDisabled>
            {tx('Bitte zuerst die Messwerte in Schritt 3 erfassen.')}
          </StepNav>
        ) : (
          <div className="space-y-4">
            <Field form={step4Form} name="pruefer_vorname">
              <Input {...step4Form.field('pruefer_vorname')} placeholder={tx('Vorname')} />
            </Field>
            <Field form={step4Form} name="pruefer_nachname">
              <Input {...step4Form.field('pruefer_nachname')} placeholder={tx('Nachname')} />
            </Field>
            <Field form={step4Form} name="bemerkungen">
              <Textarea {...step4Form.field('bemerkungen')} rows={3} placeholder={tx('Optionale Bemerkungen zum Eichvorgang')} />
            </Field>
            <StepNav
              onBack={() => setStep(3)}
              onNext={() => step4Form.validate(['pruefer_vorname', 'pruefer_nachname'])}
              nextStepLabel={tx('Prüfen')}
            />
          </div>
        )}
      </WizardStep>

      {/* Schritt 5: Zusammenfassung */}
      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[step1Form, step2Form, step3Form, step4Form]}
            submit={submit}
            whatHappensNext={tx('Das Eichprotokoll wird angelegt und ist sofort im System verfügbar.')}
          />
        )}
      </WizardStep>

      {/* Erfolg */}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[step1Form, step2Form, step3Form, step4Form]}
          next={[
            { label: tx('Weiteres Protokoll erstellen'), onClick: restart },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Das Protokoll ist gespeichert und kann über das Dashboard eingesehen werden.')}
        />
      )}
    </IntentWizardShell>
  );
}
