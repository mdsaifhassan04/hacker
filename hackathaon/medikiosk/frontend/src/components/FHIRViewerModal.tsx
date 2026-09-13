import React, { useState, useEffect } from 'react';
import { Modal, Button } from './ui';
import { PatientSession } from '../types/session';
import { fhirService, FHIRBundle } from '../services/FHIRService';
import {
  Code2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  FileCode,
  Layers,
  Database,
} from 'lucide-react';

export interface FHIRViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PatientSession;
}

export const FHIRViewerModal: React.FC<FHIRViewerModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [bundle, setBundle] = useState<FHIRBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedResourceType, setSelectedResourceType] = useState<string>('ALL');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && session) {
      setIsLoading(true);
      fhirService.exportEncounterToFHIR(session).then((res) => {
        setBundle(res);
        setIsLoading(false);
      });
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (bundle) {
      navigator.clipboard.writeText(JSON.stringify(filteredData, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    if (bundle) {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `FHIR_Bundle_${session.sessionId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const resourceTypes = [
    'ALL',
    'Patient',
    'Encounter',
    'Condition',
    'Observation',
    'MedicationStatement',
    'AllergyIntolerance',
    'DocumentReference',
  ];

  const filteredEntries = bundle?.entry?.filter((e) => {
    if (selectedResourceType === 'ALL') return true;
    return e.resource.resourceType === selectedResourceType;
  }) || [];

  const filteredData = selectedResourceType === 'ALL'
    ? bundle
    : {
        resourceType: 'BundleSubCollection',
        parentBundleId: bundle?.id,
        disclaimer: fhirService.constructor.name ? fhirService.constructor.prototype ? 'FHIR-compatible prototype.' : 'FHIR-compatible prototype.' : 'FHIR-compatible prototype.',
        resourceTypeFilter: selectedResourceType,
        count: filteredEntries.length,
        resources: filteredEntries.map((e) => e.resource),
      };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`FHIR R4 Interoperability Export — ${session.patientDetails.name}`}
      maxWidth="xl"
    >
      <div className="space-y-4 text-slate-100 font-sans">
        
        {/* TOP DISCLAIMER & ABDM READINESS BANNER */}
        <div className="p-4 bg-teal-950/60 border border-teal-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">FHIR-compatible prototype</span>
                <span className="px-2 py-0.5 bg-teal-900 border border-teal-700 text-teal-300 text-[10px] font-mono font-bold rounded-md uppercase">
                  ABDM R4 Extensible
                </span>
              </div>
              <p className="text-slate-300 mt-0.5 leading-snug">
                Transforms clinical intake into HL7 FHIR R4 Bundle conforming to NRCES NDHM OP Consult Record (<code className="text-teal-300">OPConsultRecord</code>) structure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handleCopyJson}
              leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-teal-400" />}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs font-mono"
            >
              {isCopied ? 'Copied!' : 'Copy JSON'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDownloadJson}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-mono shadow-md"
            >
              Download
            </Button>
          </div>
        </div>

        {/* RESOURCE FILTER TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] pr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Map:</span>
          </span>
          {resourceTypes.map((type) => {
            const count = type === 'ALL'
              ? bundle?.total || 0
              : bundle?.entry?.filter((e) => e.resource.resourceType === type).length || 0;

            const isSelected = selectedResourceType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedResourceType(type)}
                className={`py-1.5 px-3 rounded-xl font-mono font-bold whitespace-nowrap transition-all cursor-pointer border text-[11px] ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                    : count > 0
                    ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                }`}
                disabled={count === 0 && type !== 'ALL'}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>

        {/* JSON DISPLAY BOX */}
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl p-8 text-slate-400 space-y-3">
            <Code2 className="w-8 h-8 text-teal-400 animate-pulse" />
            <p className="text-xs font-mono font-bold">Transforming clinical intake into FHIR R4 Bundle JSON...</p>
          </div>
        ) : (
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                <FileCode className="w-4 h-4" />
                <span>FHIR_R4_Bundle_{session.sessionId}.json</span>
              </span>
              <span>Total FHIR Resources: {bundle?.total || 0}</span>
            </div>

            <pre className="h-96 overflow-y-auto overflow-x-auto text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded-xl border border-slate-900/80 leading-relaxed select-all">
              {JSON.stringify(filteredData, null, 2)}
            </pre>
          </div>
        )}

        {/* ABDM EXTENSIBILITY FOOTER NOTE */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Target Profile: NRCES NDHM OPConsultRecord R4</span>
          </span>
          <span className="text-slate-500">Endpoint: POST /api/integration/fhir/encounter/{session.sessionId}</span>
        </div>
      </div>
    </Modal>
  );
};
