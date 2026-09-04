import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  prepareChallenge,
  PageUnavailableError,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import { useStepForm, useJourneySubmit } from '@/lib/journey';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { tx } from '@/i18n';

const SLUG = 'terminwunsch';

export default function Terminwunsch() {
  const SERVICEART_OPTIONS = [
  { key: 'kalibrierung', label: tx('Kalibrierung / Eichung') },
  { key: 'wartung', label: tx('Wartung') },
  { key: 'reparatur', label: tx('Reparatur') },
  { key: 'erstinbetriebnahme', label: tx('Erstinbetriebnahme') },
];

  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  const port = useMemo(
    () => (cfg && page ? createPublicPort(cfg, page) : null),
    [cfg, page],
  );

  const f = useStepForm('terminwunsch', {
    fields: [
      'firmenname', 'vorname', 'nachname', 'telefon', 'email',
      'strasse', 'hausnummer', 'plz', 'ort',
      'waagentyp', 'anzahl_waagen', 'serviceart',
      'wunschzeitraum_von', 'wunschzeitraum_bis', 'bevorzugte_tageszeit', 'hinweise',
    ],
    required: {
      firmenname: true, vorname: true, nachname: true, telefon: true,
      strasse: true, hausnummer: true, plz: true, ort: true,
      waagentyp: true, anzahl_waagen: true, serviceart: true,
      wunschzeitraum_von: true,
    },
    steps: {
      firmenname: 1, vorname: 1, nachname: 1, telefon: 1, email: 1,
      strasse: 1, hausnummer: 1, plz: 1, ort: 1,
      waagentyp: 2, anzahl_waagen: 2, serviceart: 2,
      wunschzeitraum_von: 3, wunschzeitraum_bis: 3, bevorzugte_tageszeit: 3, hinweise: 3,
    },
    autoComplete: true,
  });

  const submit = useJourneySubmit(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    port!,
    [{ key: 'terminwunsch', entity: 'terminwunsch', form: f, primary: true }],
    { draftKey: 'terminwunsch' },
  );

  const ep = page?.endpoints?.find(e => e.op === 'create');
  const appId = ep?.app_id ?? '';

  const handleFirstInteraction = () => {
    if (cfg && page && appId) prepareChallenge(cfg, page, 'POST', `/apps/${appId}/records`);
  };

  const restart = () => {
    f.reset();
    submit.reset();
    setStep(1);
  };

  // Serviceart: multiplelookup — managed as string[]
  const serviceartVal = Array.isArray(f.get('serviceart')) ? (f.get('serviceart') as string[]) : [];
  const toggleServiceart = (key: string) => {
    const next = serviceartVal.includes(key)
      ? serviceartVal.filter(k => k !== key)
      : [...serviceartVal, key];
    f.set('serviceart', next);
    if (next.length > 0) f.validate(['serviceart']);
  };

  if (loading || (!loading && !page)) {
    return <PublicShell loading={loading} unavailable={!loading && !page} />;
  }

  if (!cfg || !page || !port) {
    return <PublicShell unavailable />;
  }

  return (
    <PublicShell
      title={tx('Serviceanfrage stellen')}
      description={tx('Eichung, Wartung und Reparatur Ihrer Waagen – wir melden uns zum Wunschtermin.')}
    >
      <IntentWizardShell
        currentStep={step}
        onStepChange={setStep}
        forms={[f]}
        draftKey="terminwunsch"
        back={false}
        intro={{
          description: tx('In wenigen Schritten zur Serviceanfrage – wir planen den Termin und melden uns.'),
          needs: [
            tx('Firmenname und Adresse des Waagenstandorts'),
            tx('Waagentyp und gewünschte Serviceart'),
            tx('Gewünschter Zeitraum'),
          ],
          estimatedMinutes: 3,
        }}
      >
        {/* Step 1 — Kontaktdaten */}
        <WizardStep
          label={tx('Kontaktdaten')}
          description={tx('Ihre Kontaktdaten und die Adresse, an der die Waagen stehen.')}
        >
          <div className="space-y-4" onFocus={handleFirstInteraction}>
            <Bound form={f} name="firmenname" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bound form={f} name="vorname" />
              <Bound form={f} name="nachname" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bound form={f} name="telefon" />
              <Bound form={f} name="email" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Bound form={f} name="strasse" />
              <Bound form={f} name="hausnummer" className="w-28" />
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <Bound form={f} name="plz" className="w-32" />
              <Bound form={f} name="ort" />
            </div>
          </div>
          <StepNav
            onNext={() => f.validate(['firmenname', 'vorname', 'nachname', 'telefon', 'email', 'strasse', 'hausnummer', 'plz', 'ort'])}
            nextStepLabel={tx('Angaben zur Waage')}
          />
        </WizardStep>

        {/* Step 2 — Angaben zur Waage */}
        <WizardStep
          label={tx('Angaben zur Waage')}
          description={tx('Welche Waagen sollen gewartet, geeicht oder repariert werden?')}
        >
          <div className="space-y-5">
            <Field form={f} name="waagentyp">
              <ChoiceGroup {...f.choice('waagentyp')} />
            </Field>
            <Field form={f} name="anzahl_waagen">
              <Input {...f.number('anzahl_waagen')} min={1} className="w-40" />
            </Field>
            {/* serviceart — multiplelookup/checkbox */}
            <div className="space-y-1.5" data-field="serviceart">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-medium leading-none">{tx('Gewünschte Serviceart')}</span>
                <span aria-hidden="true" className="text-muted-foreground text-sm"> *</span>
              </div>
              <div
                id={f.fieldId('serviceart')}
                role="group"
                aria-required
                aria-invalid={Boolean(f.error('serviceart')) || undefined}
                className={`flex flex-wrap gap-2 ${f.error('serviceart') ? 'rounded-xl ring-2 ring-destructive/40 ring-offset-2 ring-offset-background' : ''}`}
              >
                {SERVICEART_OPTIONS.map(opt => {
                  const checked = serviceartVal.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleServiceart(opt.key)}
                      className={`inline-flex items-center gap-2 rounded-full border pl-2.5 pr-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        checked
                          ? 'border-primary bg-accent text-accent-foreground'
                          : 'border-input bg-muted/40 text-foreground hover:border-foreground/30 hover:bg-card'
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded flex items-center justify-center shrink-0 transition-colors border-2 ${
                          checked ? 'border-primary bg-primary' : 'border-muted-foreground/60 bg-card'
                        }`}
                        aria-hidden="true"
                      >
                        {checked && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-primary-foreground fill-current">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {f.error('serviceart') && (
                <p className="text-sm text-destructive" role="alert">{f.error('serviceart')}</p>
              )}
            </div>
          </div>
          <StepNav
            onNext={() => {
              if (serviceartVal.length === 0) {
                f.validate(['serviceart']);
                return false;
              }
              return f.validate(['waagentyp', 'anzahl_waagen', 'serviceart']);
            }}
            nextStepLabel={tx('Wunschtermin')}
          />
        </WizardStep>

        {/* Step 3 — Wunschtermin */}
        <WizardStep
          label={tx('Wunschtermin')}
          description={tx('In welchem Zeitraum soll der Service stattfinden?')}
        >
          <div className="space-y-5">
            <Bound form={f} name="wunschzeitraum_von" />
            <Bound form={f} name="wunschzeitraum_bis" hint={tx('Optional – falls Sie einen Endzeitraum angeben möchten.')} />
            <Field form={f} name="bevorzugte_tageszeit">
              <ChoiceGroup {...f.choice('bevorzugte_tageszeit')} allowClear />
            </Field>
            <Field form={f} name="hinweise">
              <Textarea {...f.field('hinweise')} rows={4} placeholder={tx('Z.B. Zugangshinweise, Ansprechpartner vor Ort, besondere Anforderungen ...')} />
            </Field>
          </div>
          <StepNav
            onNext={() => f.validate(['wunschzeitraum_von', 'wunschzeitraum_bis', 'bevorzugte_tageszeit', 'hinweise'])}
            nextStepLabel={tx('Prüfen & Absenden')}
          />
        </WizardStep>

        {/* Step 4 — Zusammenfassung */}
        <WizardStep label={tx('Prüfen & Absenden')}>
          {!submit.result && (
            <SummaryStep
              forms={[f]}
              submit={submit}
              whatHappensNext={tx('Wir melden uns werktags innerhalb von 24 Stunden, um einen konkreten Termin zu vereinbaren.')}
              confirmLabel={tx('Anfrage absenden')}
            />
          )}
        </WizardStep>

        {submit.result && (
          <SuccessStep
            result={submit.result}
            forms={[f]}
            whatHappensNext={tx('Wir melden uns werktags innerhalb von 24 Stunden, um einen konkreten Termin zu vereinbaren.')}
            next={[
              { label: tx('Weitere Anfrage stellen'), onClick: restart },
            ]}
          />
        )}
      </IntentWizardShell>
    </PublicShell>
  );
}
