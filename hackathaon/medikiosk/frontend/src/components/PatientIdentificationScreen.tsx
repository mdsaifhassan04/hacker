import React, { useState } from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { Button, Header, Input, ProgressBar, Select } from './ui';
import { DEMO_PATIENTS } from '../data/demoPatients';
import { DemoPatient, PatientSession } from '../types/session';
import { ArrowLeft, ArrowRight, UserCheck, UserPlus, ShieldCheck, CheckCircle2, Calendar, Phone, User } from 'lucide-react';

export interface PatientIdentificationScreenProps {
  onBack: () => void;
  onSessionCreated: (session: PatientSession) => void;
}

export const PatientIdentificationScreen: React.FC<PatientIdentificationScreenProps> = ({
  onBack,
  onSessionCreated,
}) => {
  const { t, language, setLanguage } = useTranslation();
  
  // Tab Mode: 'existing' | 'new'
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');

  // Existing Patient Selection State
  const [selectedDemoPatient, setSelectedDemoPatient] = useState<DemoPatient | null>(DEMO_PATIENTS[0]);

  // New Patient Form State
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newMobile, setNewMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const steps = [
    { id: 1, label: t('navigation.step_1') },
    { id: 2, label: t('navigation.step_2') },
    { id: 3, label: t('navigation.step_3') },
    { id: 4, label: t('navigation.step_4') },
  ];

  const handleExistingSelect = (patient: DemoPatient) => {
    setSelectedDemoPatient(patient);
    setFormError(null);
  };

  const handleConfirmExistingSession = () => {
    if (!selectedDemoPatient) {
      setFormError(t('errors.select_patient'));
      return;
    }

    const session: PatientSession = {
      sessionId: `SES-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: selectedDemoPatient.patientId,
      language: language,
      createdAt: new Date().toISOString(),
      patientDetails: selectedDemoPatient,
      isNewPatient: false,
    };

    onSessionCreated(session);
  };

  const handleCreateNewPatientSession = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim()) {
      setFormError(t('errors.name_required'));
      return;
    }
    if (!newAge || isNaN(Number(newAge)) || Number(newAge) <= 0) {
      setFormError(t('errors.age_required'));
      return;
    }
    if (newMobile && newMobile.length < 10) {
      setFormError(t('errors.mobile_invalid'));
      return;
    }

    const newPatient: DemoPatient = {
      patientId: `PAT-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName.trim(),
      age: Number(newAge),
      gender: newGender,
      mobile: newMobile || '9999999999',
      lastVisit: 'First OPD Registration',
      previousDepartment: 'N/A',
    };

    const session: PatientSession = {
      sessionId: `SES-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: newPatient.patientId,
      language: language,
      createdAt: new Date().toISOString(),
      patientDetails: newPatient,
      isNewPatient: true,
    };

    onSessionCreated(session);
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
        <ProgressBar currentStep={2} steps={steps} />

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{t('patient_id.step_label')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('patient_id.title')}
          </h2>
          <p className="text-base text-slate-600 font-medium">
            {t('patient_id.subtitle')}
          </p>
        </div>

        {/* MODE SWITCHER TABS: Existing Patient vs New Patient */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto p-1.5 bg-slate-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setPatientMode('existing');
              setFormError(null);
            }}
            className={`min-h-[56px] px-4 py-3 rounded-xl font-extrabold text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
              patientMode === 'existing'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
            }`}
          >
            <UserCheck className="w-6 h-6" />
            <span>{t('patient_id.existing_tab')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPatientMode('new');
              setFormError(null);
            }}
            className={`min-h-[56px] px-4 py-3 rounded-xl font-extrabold text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
              patientMode === 'new'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
            }`}
          >
            <UserPlus className="w-6 h-6" />
            <span>{t('patient_id.new_tab')}</span>
          </button>
        </div>

        {/* TAB 1: EXISTING PATIENT FLOW */}
        {patientMode === 'existing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t('patient_id.demo_list_title')}</h3>
                <p className="text-sm text-slate-500">{t('patient_id.demo_list_desc')}</p>
              </div>

              {/* Demo Patient Grid Cards (PAT-1001, PAT-1002, PAT-1003) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {DEMO_PATIENTS.map((p) => {
                  const isSelected = selectedDemoPatient?.patientId === p.patientId;

                  return (
                    <div
                      key={p.patientId}
                      onClick={() => handleExistingSelect(p)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-600 shadow-md ring-4 ring-teal-500/20'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                          {p.patientId}
                        </span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">{p.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{p.age} Yrs • {p.gender}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-0.5">
                        <p className="font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.mobile}</span>
                        </p>
                        {p.lastVisit && (
                          <p className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Last: {p.lastVisit}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Loaded Patient Detail Summary */}
              {selectedDemoPatient && (
                <div className="p-5 rounded-2xl bg-teal-900 text-white space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-800 pb-3">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                      {t('patient_id.selected_patient_title')}
                    </span>
                    <span className="font-mono text-xs bg-teal-800 px-2 py-0.5 rounded text-teal-200 font-bold">
                      {selectedDemoPatient.patientId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-teal-300 block">Name</span>
                      <span className="font-bold text-white text-base">{selectedDemoPatient.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-teal-300 block">Age / Gender</span>
                      <span className="font-bold text-white text-base">{selectedDemoPatient.age} Yrs / {selectedDemoPatient.gender}</span>
                    </div>
                    <div>
                      <span className="text-xs text-teal-300 block">Mobile</span>
                      <span className="font-bold text-white text-base">{selectedDemoPatient.mobile}</span>
                    </div>
                    <div>
                      <span className="text-xs text-teal-300 block">Previous Dept</span>
                      <span className="font-bold text-white text-base">{selectedDemoPatient.previousDepartment || 'General'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button variant="outline" size="lg" onClick={onBack} leftIcon={<ArrowLeft className="w-5 h-5" />}>
                {t('patient_id.back_button')}
              </Button>

              <Button
                variant="primary"
                size="xl"
                onClick={handleConfirmExistingSession}
                rightIcon={<ArrowRight className="w-6 h-6" />}
                className="w-full sm:w-auto shadow-lg shadow-teal-600/20"
              >
                {t('patient_id.create_session_button')}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: NEW PATIENT REGISTRATION FLOW */}
        {patientMode === 'new' && (
          <form onSubmit={handleCreateNewPatientSession} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t('patient_id.new_patient_title')}</h3>
                <p className="text-sm text-slate-500">{t('patient_id.new_patient_desc')}</p>
              </div>

              <div className="space-y-4">
                <Input
                  label={t('patient_id.name_label')}
                  placeholder={t('patient_id.name_placeholder')}
                  leftIcon={<User className="w-5 h-5" />}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  autoFocus
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('patient_id.age_label')}
                    placeholder={t('patient_id.age_placeholder')}
                    type="number"
                    value={newAge}
                    onChange={(e) => {
                      setNewAge(e.target.value);
                      if (formError) setFormError(null);
                    }}
                  />

                  <Select
                    label={t('patient_id.gender_label')}
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    options={[
                      { value: 'Male', label: 'Male (पुरुष)' },
                      { value: 'Female', label: 'Female (महिला)' },
                      { value: 'Other', label: 'Other (अन्य)' },
                    ]}
                  />
                </div>

                <Input
                  label={t('patient_id.mobile_label')}
                  placeholder={t('patient_id.mobile_placeholder')}
                  leftIcon={<Phone className="w-5 h-5" />}
                  value={newMobile}
                  onChange={(e) => {
                    setNewMobile(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  maxLength={10}
                />
              </div>

              {formError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button type="button" variant="outline" size="lg" onClick={onBack} leftIcon={<ArrowLeft className="w-5 h-5" />}>
                {t('patient_id.back_button')}
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="xl"
                rightIcon={<ArrowRight className="w-6 h-6" />}
                className="w-full sm:w-auto shadow-lg shadow-teal-600/20"
              >
                {t('patient_id.create_session_button')}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>{t('welcome.footer_hint')}</p>
      </footer>
    </div>
  );
};
