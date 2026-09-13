import React, { useState } from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { Button, Header, Input, ProgressBar, Select } from './ui';
import { PatientSession, MedicalHistory, PastConditions, MedicationItem, AllergyItem, SurgeryItem, PersonalHistory } from '../types/session';
import { ArrowLeft, ArrowRight, Activity, Plus, Trash2, ShieldCheck, HeartPulse, Pill, AlertOctagon, User, Users } from 'lucide-react';

export interface MedicalHistoryScreenProps {
  session: PatientSession;
  onBack: () => void;
  onCompleteMedicalHistory: (history: MedicalHistory) => void;
}

export const MedicalHistoryScreen: React.FC<MedicalHistoryScreenProps> = ({
  session,
  onBack,
  onCompleteMedicalHistory,
}) => {
  const { t, language, setLanguage } = useTranslation();

  const steps = [
    { id: 1, label: t('navigation.step_1') },
    { id: 2, label: t('navigation.step_2') },
    { id: 3, label: t('navigation.step_3') },
    { id: 4, label: t('navigation.step_4') },
    { id: 5, label: t('navigation.step_5') },
  ];

  // 1. Past Conditions State
  const [pastConditions, setPastConditions] = useState<PastConditions>({
    diabetes: false,
    hypertension: false,
    asthma: false,
    tuberculosis: false,
    cardiacDisease: false,
    other: '',
  });

  // 2. Medications Repeatable List State
  const [medications, setMedications] = useState<MedicationItem[]>([]);

  // 3. Allergies Repeatable List State
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);

  // 4. Surgeries Repeatable List State
  const [surgeries, setSurgeries] = useState<SurgeryItem[]>([]);

  // 5. Family History State
  const [familyHistory, setFamilyHistory] = useState<string>('');

  // 6. Personal History State
  const [diet, setDiet] = useState<string>('');
  const [sleep, setSleep] = useState<string>('');
  const [tobacco, setTobacco] = useState<string>('');
  const [alcohol, setAlcohol] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handlers for adding/removing items
  const handleAddMedication = () => {
    setMedications([...medications, { medicine: '', strength: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleUpdateMedication = (index: number, field: keyof MedicationItem, val: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  const handleAddAllergy = () => {
    setAllergies([...allergies, { type: 'drug', substance: '', reaction: '' }]);
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleUpdateAllergy = (index: number, field: keyof AllergyItem, val: string) => {
    const updated = [...allergies];
    updated[index] = { ...updated[index], [field]: val };
    setAllergies(updated);
  };

  const handleAddSurgery = () => {
    setSurgeries([...surgeries, { procedure: '', approximateDate: '' }]);
  };

  const handleRemoveSurgery = (index: number) => {
    setSurgeries(surgeries.filter((_, i) => i !== index));
  };

  const handleUpdateSurgery = (index: number, field: keyof SurgeryItem, val: string) => {
    const updated = [...surgeries];
    updated[index] = { ...updated[index], [field]: val };
    setSurgeries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const NOT_REPORTED = 'Not reported';

    // 1. Evaluate Past Conditions
    const hasAnyPastCondition =
      pastConditions.diabetes ||
      pastConditions.hypertension ||
      pastConditions.asthma ||
      pastConditions.tuberculosis ||
      pastConditions.cardiacDisease ||
      Boolean(pastConditions.other.trim());

    const finalPastConditions: PastConditions | string = hasAnyPastCondition
      ? {
          ...pastConditions,
          other: pastConditions.other.trim() || NOT_REPORTED,
        }
      : NOT_REPORTED;

    // 2. Evaluate Medications
    const validMeds = medications.filter((m) => m.medicine.trim() !== '');
    const finalMeds: MedicationItem[] | string = validMeds.length > 0
      ? validMeds.map((m) => ({
          medicine: m.medicine.trim(),
          strength: m.strength.trim() || NOT_REPORTED,
          frequency: m.frequency.trim() || NOT_REPORTED,
          duration: m.duration.trim() || NOT_REPORTED,
        }))
      : NOT_REPORTED;

    // 3. Evaluate Allergies
    const validAllergies = allergies.filter((a) => a.substance.trim() !== '');
    const finalAllergies: AllergyItem[] | string = validAllergies.length > 0
      ? validAllergies.map((a) => ({
          type: a.type || 'drug',
          substance: a.substance.trim(),
          reaction: a.reaction.trim() || NOT_REPORTED,
        }))
      : NOT_REPORTED;

    // 4. Evaluate Surgeries
    const validSurgeries = surgeries.filter((s) => s.procedure.trim() !== '');
    const finalSurgeries: SurgeryItem[] | string = validSurgeries.length > 0
      ? validSurgeries.map((s) => ({
          procedure: s.procedure.trim(),
          approximateDate: s.approximateDate.trim() || NOT_REPORTED,
        }))
      : NOT_REPORTED;

    // 5. Evaluate Family History
    const finalFamilyHistory = familyHistory.trim() || NOT_REPORTED;

    // 6. Evaluate Personal History
    const hasAnyPersonal = diet || sleep || tobacco || alcohol || occupation.trim();
    const finalPersonalHistory: PersonalHistory | string = hasAnyPersonal
      ? {
          diet: diet || NOT_REPORTED,
          sleep: sleep || NOT_REPORTED,
          tobacco: tobacco || NOT_REPORTED,
          alcohol: alcohol || NOT_REPORTED,
          occupation: occupation.trim() || NOT_REPORTED,
        }
      : NOT_REPORTED;

    const fullHistory: MedicalHistory = {
      pastConditions: finalPastConditions,
      medications: finalMeds,
      allergies: finalAllergies,
      surgeries: finalSurgeries,
      familyHistory: finalFamilyHistory,
      personalHistory: finalPersonalHistory,
    };

    // Construct full session payload
    const fullSessionPayload: PatientSession = {
      ...session,
      medicalHistory: fullHistory,
    };

    // Post complete session to backend API
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      await fetch(`${apiBaseUrl}/api/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullSessionPayload),
      });
    } catch {
      // Graceful fallback if backend server is offline
    }

    setIsSubmitting(false);
    onCompleteMedicalHistory(fullHistory);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header
        hospitalName={t('header.hospital')}
        kioskId={t('header.kiosk_id')}
        languageSelector={
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="min-h-[44px] px-3 bg-teal-50 border border-teal-300 rounded-xl text-teal-900 font-bold text-sm outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        }
      />

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Step Progress Bar */}
        <ProgressBar currentStep={5} steps={steps} />

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{t('med_history.step_label')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('med_history.title')}
          </h2>
          <p className="text-base text-slate-600 font-medium">
            {t('med_history.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: PAST MEDICAL CONDITIONS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-600" />
              <span>{t('med_history.past_conditions_title')}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'diabetes', label: t('med_history.diabetes') },
                { key: 'hypertension', label: t('med_history.hypertension') },
                { key: 'asthma', label: t('med_history.asthma') },
                { key: 'tuberculosis', label: t('med_history.tuberculosis') },
                { key: 'cardiacDisease', label: t('med_history.cardiac_disease') },
              ].map((item) => {
                const isChecked = pastConditions[item.key as keyof PastConditions] as boolean;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setPastConditions({
                        ...pastConditions,
                        [item.key]: !isChecked,
                      })
                    }
                    className={`min-h-[56px] p-4 rounded-2xl border-2 text-left font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="font-extrabold text-lg">{isChecked ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>

            <Input
              label={t('med_history.other_conditions')}
              placeholder="Type any other past conditions (e.g. Thyroid, Kidney Stones...)"
              value={pastConditions.other}
              onChange={(e) => setPastConditions({ ...pastConditions, other: e.target.value })}
            />
          </div>

          {/* SECTION 2: CURRENT MEDICATIONS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-600" />
                <span>{t('med_history.medications_title')}</span>
              </h3>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleAddMedication}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('med_history.add_medication')}
              </Button>
            </div>

            {medications.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                No medications added yet. Will be recorded as "{t('med_history.not_reported')}".
              </p>
            ) : (
              <div className="space-y-4">
                {medications.map((med, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Medicine #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <Input
                        placeholder={t('med_history.medicine_name')}
                        value={med.medicine}
                        onChange={(e) => handleUpdateMedication(idx, 'medicine', e.target.value)}
                      />
                      <Input
                        placeholder={t('med_history.strength')}
                        value={med.strength}
                        onChange={(e) => handleUpdateMedication(idx, 'strength', e.target.value)}
                      />
                      <Input
                        placeholder={t('med_history.frequency')}
                        value={med.frequency}
                        onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                      />
                      <Input
                        placeholder={t('med_history.duration')}
                        value={med.duration}
                        onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: ALLERGIES */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <span>{t('med_history.allergies_title')}</span>
              </h3>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleAddAllergy}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('med_history.add_allergy')}
              </Button>
            </div>

            {allergies.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                No allergies added. Will be recorded as "{t('med_history.not_reported')}".
              </p>
            ) : (
              <div className="space-y-4">
                {allergies.map((alg, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Allergy #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(idx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Select
                        value={alg.type}
                        onChange={(e) => handleUpdateAllergy(idx, 'type', e.target.value)}
                        options={[
                          { value: 'drug', label: 'Drug / Medicine Allergy' },
                          { value: 'food', label: 'Food Allergy' },
                          { value: 'other', label: 'Environmental / Other' },
                        ]}
                      />
                      <Input
                        placeholder={t('med_history.allergy_substance')}
                        value={alg.substance}
                        onChange={(e) => handleUpdateAllergy(idx, 'substance', e.target.value)}
                      />
                      <Input
                        placeholder={t('med_history.allergy_reaction')}
                        value={alg.reaction}
                        onChange={(e) => handleUpdateAllergy(idx, 'reaction', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: SURGERIES */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>{t('med_history.surgeries_title')}</span>
              </h3>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleAddSurgery}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('med_history.add_surgery')}
              </Button>
            </div>

            {surgeries.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                No past surgeries added. Will be recorded as "{t('med_history.not_reported')}".
              </p>
            ) : (
              <div className="space-y-4">
                {surgeries.map((surg, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Surgery #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSurgery(idx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder={t('med_history.surgery_procedure')}
                        value={surg.procedure}
                        onChange={(e) => handleUpdateSurgery(idx, 'procedure', e.target.value)}
                      />
                      <Input
                        placeholder={t('med_history.surgery_date')}
                        value={surg.approximateDate}
                        onChange={(e) => handleUpdateSurgery(idx, 'approximateDate', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5: FAMILY HISTORY */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>{t('med_history.family_history_title')}</span>
            </h3>

            <Input
              placeholder={t('med_history.family_history_placeholder')}
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              helperText="Leave blank if not applicable (will be saved as 'Not reported')"
            />
          </div>

          {/* SECTION 6: PERSONAL & LIFESTYLE HISTORY */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>{t('med_history.personal_history_title')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Diet */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{t('med_history.diet')}</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiet(diet === d ? '' : d)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        diet === d ? 'bg-teal-600 border-teal-600 text-white shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{t('med_history.sleep')}</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Normal', 'Insomnia', 'Irregular'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSleep(sleep === s ? '' : s)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        sleep === s ? 'bg-teal-600 border-teal-600 text-white shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tobacco */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{t('med_history.tobacco')}</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['No', 'Smoking', 'Chewing', 'Past history'].map((tb) => (
                    <button
                      key={tb}
                      type="button"
                      onClick={() => setTobacco(tobacco === tb ? '' : tb)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        tobacco === tb ? 'bg-teal-600 border-teal-600 text-white shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {tb}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alcohol */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{t('med_history.alcohol')}</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['No', 'Occasional', 'Regular'].map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => setAlcohol(alcohol === al ? '' : al)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        alcohol === al ? 'bg-teal-600 border-teal-600 text-white shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Occupation */}
            <Input
              label={t('med_history.occupation')}
              placeholder="e.g. Farmer, Driver, Desk Job, Business, Student, Retired"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>

          {/* ACTION BAR */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-5 h-5" />}
            >
              {t('buttons.back')}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="xl"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-6 h-6" />}
              className="w-full sm:w-auto shadow-xl shadow-teal-600/30 border-2 border-teal-500"
            >
              {t('med_history.submit_button')}
            </Button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>{t('welcome.footer_hint')}</p>
      </footer>
    </div>
  );
};
