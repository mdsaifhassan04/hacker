import os
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
from dotenv import load_dotenv

try:
    from app.fhir_service import FHIRMapper
except ImportError:
    from fhir_service import FHIRMapper

load_dotenv()

# DEMO_MODE flag – when true, all external AI services are bypassed with deterministic mock data
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

app = FastAPI(
    title="MediKiosk API",
    description="AI-Powered Pre-Consultation Clinical Intake Platform",
    version="0.1.0"
)

# Configure CORS for frontend access
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and serve statically
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "application/pdf"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


class ConsentRecord(BaseModel):
    sessionId: str
    consentStatus: str  # "ACCEPTED" | "DECLINED"
    timestamp: str
    consentVersion: str = "v1.0-SIH2026"


class DocumentRecord(BaseModel):
    documentId: str
    sessionId: str
    filename: str
    fileType: str
    fileSize: int
    uploadedAt: str
    fileUrl: str


class FullIntakeSession(BaseModel):
    sessionId: str
    patientId: str
    language: str
    createdAt: str
    patientDetails: Dict[str, Any]
    isNewPatient: bool
    consentRecord: Optional[ConsentRecord] = None
    chiefComplaint: Optional[str] = "Not reported"
    pathwayId: Optional[str] = None
    clinicalResponses: Optional[List[Dict[str, Any]]] = []
    medicalHistory: Optional[Dict[str, Any]] = None
    uploadedDocuments: Optional[List[Dict[str, Any]]] = []
    redFlagAssessment: Optional[Dict[str, Any]] = None
    clinicalSummary: Optional[Dict[str, Any]] = None


class AuditLogPayload(BaseModel):
    logId: str
    eventType: str
    sessionId: str
    patientId: str
    actorId: str
    timestamp: str
    details: str
    previousValue: Optional[Any] = None
    newValue: Optional[Any] = None


class OCRCorrectionPayload(BaseModel):
    documentId: str
    sessionId: str
    correctedInfo: Dict[str, Any]
    doctorId: Optional[str] = "DOC-OPD-101"


# In-memory storage databases
consent_db = []
intake_db = []
documents_db = []
audit_db = []


@app.get("/")
def read_root():
    return {"message": "Welcome to MediKiosk API"}


@app.get("/api/health")
def get_health():
    return {"status": "ok"}


@app.post("/api/consent")
def record_consent(record: ConsentRecord):
    if not record.sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required")
    
    consent_db.append(record.dict())
    return {
        "status": "ok",
        "message": f"Consent {record.consentStatus} recorded successfully",
        "consentRecord": record.dict()
    }


@app.get("/api/consent")
def list_consents():
    return {"status": "ok", "count": len(consent_db), "consents": consent_db}


@app.post("/api/documents/upload")
async def upload_document(
    sessionId: str = Form(...),
    file: UploadFile = File(...)
):
    if not sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required for encounter association")
    
    filename = file.filename or "document"
    ext = os.path.splitext(filename)[1].lower()

    # Validate file extension and MIME type
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Only JPG, PNG, and PDF files are allowed."
        )

    # Secure file saving with UUID prefix
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    file_size = len(content)

    with open(file_path, "wb") as f:
        f.write(content)

    doc_record = {
        "documentId": f"DOC-{uuid.uuid4().hex[:8].upper()}",
        "sessionId": sessionId,
        "filename": filename,
        "fileType": file.content_type,
        "fileSize": file_size,
        "uploadedAt": datetime.now().isoformat(),
        "fileUrl": f"/uploads/{unique_name}"
    }

    documents_db.append(doc_record)
    return {
        "status": "ok",
        "message": "Document uploaded successfully",
        "document": doc_record
    }


@app.get("/api/documents/{session_id}")
def get_session_documents(session_id: str):
    session_docs = [d for d in documents_db if d["sessionId"] == session_id]
    return {"status": "ok", "count": len(session_docs), "documents": session_docs}


@app.post("/api/ocr/process")
def process_document_ocr(
    documentId: str = Form(...),
    filename: str = Form(...)
):
    if not documentId:
        raise HTTPException(status_code=400, detail="documentId is required")

    processed_at = datetime.now().isoformat()
    disclaimer = "Preliminary AI/OCR extraction for pre-consultation summary. Final verification by attending OPD physician required."

    is_lab_report = any(k in filename.lower() for k in ["lab", "blood", "report", "test"])

    if is_lab_report:
        ocr_result = {
            "documentId": documentId,
            "sourceDocument": filename,
            "rawText": f"MAX PATHOLOGY LABORATORY - OPD DIAGNOSTICS\nDate: 12/09/2026 | Patient ID: PAT-1001\n----------------------------------------\nTEST NAME              RESULT    UNIT    REF RANGE\n----------------------------------------\nFasting Blood Sugar    110       mg/dL   (70 - 100)\nHbA1c                  6.8       %       (< 5.7)\nHemoglobin             13.5      g/dL    (12.0 - 15.5)\n----------------------------------------",
            "structuredInfo": {
                "docType": "lab_report",
                "prescriptions": [],
                "labReports": [
                    {
                        "test": {"value": "Fasting Blood Sugar", "confidence": 0.97, "sourceDocument": filename},
                        "value": {"value": "110", "confidence": 0.99, "sourceDocument": filename},
                        "unit": {"value": "mg/dL", "confidence": 0.98, "sourceDocument": filename},
                        "referenceRange": {"value": "70 - 100 mg/dL", "confidence": 0.93, "sourceDocument": filename},
                        "date": {"value": "2026-09-12", "confidence": 0.96, "sourceDocument": filename}
                    },
                    {
                        "test": {"value": "HbA1c", "confidence": 0.98, "sourceDocument": filename},
                        "value": {"value": "6.8", "confidence": 0.99, "sourceDocument": filename},
                        "unit": {"value": "%", "confidence": 0.97, "sourceDocument": filename},
                        "referenceRange": {"value": "< 5.7 %", "confidence": 0.94, "sourceDocument": filename},
                        "date": {"value": "2026-09-12", "confidence": 0.96, "sourceDocument": filename}
                    },
                    {
                        "test": {"value": "Hemoglobin", "confidence": 0.96, "sourceDocument": filename},
                        "value": {"value": "13.5", "confidence": 0.98, "sourceDocument": filename},
                        "unit": {"value": "g/dL", "confidence": 0.97, "sourceDocument": filename},
                        "referenceRange": {"value": "12.0 - 15.5 g/dL", "confidence": 0.92, "sourceDocument": filename},
                        "date": {"value": "2026-09-12", "confidence": 0.96, "sourceDocument": filename}
                    }
                ]
            },
            "confidenceAverage": 0.96,
            "processedAt": processed_at,
            "disclaimer": disclaimer
        }
    else:
        ocr_result = {
            "documentId": documentId,
            "sourceDocument": filename,
            "rawText": f"AIIMS NEW DELHI - DEPT OF GENERAL MEDICINE\nDate: 10/09/2026 | Dr. A. K. Sharma, MD\n----------------------------------------\nRx:\n1. Tab Metformin 500mg - 1 Tab twice daily x 30 days\n2. Cap Amoxicillin 250mg - 1 Cap thrice daily x 5 days\n3. Tab Paracetamol 650mg - 1 Tab SOS x 3 days\n----------------------------------------",
            "structuredInfo": {
                "docType": "prescription",
                "prescriptions": [
                    {
                        "medicine": {"value": "Metformin", "confidence": 0.96, "sourceDocument": filename},
                        "strength": {"value": "500mg", "confidence": 0.98, "sourceDocument": filename},
                        "dose": {"value": "1 Tab", "confidence": 0.95, "sourceDocument": filename},
                        "frequency": {"value": "Twice daily", "confidence": 0.94, "sourceDocument": filename},
                        "duration": {"value": "30 days", "confidence": 0.92, "sourceDocument": filename},
                        "date": {"value": "2026-09-10", "confidence": 0.97, "sourceDocument": filename}
                    },
                    {
                        "medicine": {"value": "Amoxicillin", "confidence": 0.93, "sourceDocument": filename},
                        "strength": {"value": "250mg", "confidence": 0.95, "sourceDocument": filename},
                        "dose": {"value": "1 Cap", "confidence": 0.94, "sourceDocument": filename},
                        "frequency": {"value": "Thrice daily", "confidence": 0.91, "sourceDocument": filename},
                        "duration": {"value": "5 days", "confidence": 0.90, "sourceDocument": filename},
                        "date": {"value": "2026-09-10", "confidence": 0.97, "sourceDocument": filename}
                    }
                ],
                "labReports": []
            },
            "confidenceAverage": 0.94,
            "processedAt": processed_at,
            "disclaimer": disclaimer
        }

    return {
        "status": "ok",
        "message": "Document OCR processed successfully",
        "ocrResult": ocr_result
    }


@app.post("/api/intake")
def save_full_intake(session: FullIntakeSession):
    if not session.sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required")
    
    session_data = session.dict()
    
    # Ensure strict "Not reported" fallback for any omitted fields
    if not session_data.get("chiefComplaint"):
        session_data["chiefComplaint"] = "Not reported"
        
    if not session_data.get("medicalHistory"):
        session_data["medicalHistory"] = {
            "pastConditions": "Not reported",
            "medications": "Not reported",
            "allergies": "Not reported",
            "surgeries": "Not reported",
            "familyHistory": "Not reported",
            "personalHistory": "Not reported"
        }

    intake_db.append(session_data)
    return {
        "status": "ok",
        "message": "Full clinical intake session saved successfully to backend",
        "session": session_data
    }


@app.get("/api/intake")
def list_intake_sessions():
    return {"status": "ok", "count": len(intake_db), "sessions": intake_db}


@app.post("/api/summary/generate")
def generate_summary_api(session_data: Dict[str, Any]):
    chief_complaint = session_data.get("chiefComplaint", "Not reported") or "Not reported"
    clinical_responses = session_data.get("clinicalResponses", []) or []
    med_history = session_data.get("medicalHistory", {}) or {}
    docs = session_data.get("uploadedDocuments", []) or []
    red_flag = session_data.get("redFlagAssessment", {}) or {}

    # 1. HPI
    hpi_items = [f"{r.get('questionTextEn', '')}: {r.get('answerDisplayEn', '')}" for r in clinical_responses if r.get('questionTextEn')]
    hpi_text = " • ".join(hpi_items) if hpi_items else "Not reported"

    # 2. Past Conditions
    past_conditions = "Not reported"
    if isinstance(med_history.get("pastConditions"), dict):
      pc = med_history["pastConditions"]
      conds = [k.capitalize() for k, v in pc.items() if v is True and k != "other"]
      if pc.get("other"):
        conds.append(str(pc["other"]))
      if conds:
        past_conditions = ", ".join(conds)
    elif isinstance(med_history.get("pastConditions"), str) and med_history["pastConditions"].strip():
      past_conditions = med_history["pastConditions"]

    # 3. Medications
    meds_text = "Not reported"
    if isinstance(med_history.get("medications"), list) and med_history["medications"]:
      med_list = [f"{m.get('medicine', '')} ({m.get('strength', 'strength unspec')})" for m in med_history["medications"] if m.get('medicine')]
      if med_list:
        meds_text = "; ".join(med_list)

    # 4. Investigations / OCR
    investigations = "Not reported"
    if docs:
      inv_items = []
      for d in docs:
        if d.get("ocrResult"):
          ocr = d["ocrResult"]
          if ocr.get("structuredInfo", {}).get("prescriptions"):
            rx_names = ", ".join([p["medicine"]["value"] for p in ocr["structuredInfo"]["prescriptions"]])
            inv_items.append(f"OCR Rx ({d.get('filename')}): {rx_names}")
          if ocr.get("structuredInfo", {}).get("labReports"):
            lab_names = ", ".join([f"{l['test']['value']}: {l['value']['value']}" for l in ocr["structuredInfo"]["labReports"]])
            inv_items.append(f"OCR Lab ({d.get('filename')}): {lab_names}")
      if inv_items:
        investigations = " | ".join(inv_items)

    # 5. Red Flags
    rf_text = "No red flags triggered"
    if red_flag.get("priorityAssessment") and red_flag.get("triggeredFlags"):
      rf_text = "; ".join([f"⚠️ {f.get('name')} ({f.get('severity')})" for f in red_flag["triggeredFlags"]])

    summary = {
        "chiefComplaint": chief_complaint,
        "historyOfPresentIllness": hpi_text,
        "pastMedicalHistory": past_conditions,
        "medicationHistory": meds_text,
        "allergyHistory": "Not reported",
        "surgicalHistory": "Not reported",
        "familyHistory": str(med_history.get("familyHistory", "Not reported") or "Not reported"),
        "personalHistory": "Not reported",
        "relevantInvestigations": investigations,
        "redFlags": rf_text,
        "informationRequiringVerification": [
            "Verify self-reported symptom onset duration with attending doctor.",
            "Confirm drug dosage and allergies during physical OPD consultation."
        ],
        "isDoctorVerified": False,  # Mandatory False default
        "generatedAt": datetime.now().isoformat(),
        "verifiedAt": None,
        "verifiedByDoctorId": None
    }

    return {"status": "ok", "summary": summary}


@app.post("/api/summary/verify")
def verify_summary_api(payload: Dict[str, Any]):
    session_id = payload.get("sessionId")
    doctor_id = payload.get("doctorId", "DOC-OPD-101")
    verified_at = payload.get("verifiedAt", datetime.now().isoformat())

    # Update in intake_db if present
    for session in intake_db:
        if session.get("sessionId") == session_id and session.get("clinicalSummary"):
            session["clinicalSummary"]["isDoctorVerified"] = True
            session["clinicalSummary"]["verifiedAt"] = verified_at
            session["clinicalSummary"]["verifiedByDoctorId"] = doctor_id

    return {
        "status": "ok",
        "message": f"Summary for session '{session_id}' verified by doctor '{doctor_id}'",
        "verifiedAt": verified_at
    }


@app.post("/api/audit/log")
def log_audit_event(entry: AuditLogPayload):
    audit_db.append(entry.dict())
    return {"status": "ok", "message": f"Audit event '{entry.eventType}' recorded"}


@app.get("/api/audit/logs/{session_id}")
def get_session_audit_logs(session_id: str):
    session_logs = [log for log in audit_db if log.get("sessionId") == session_id]
    return {"status": "ok", "count": len(session_logs), "logs": session_logs}


@app.post("/api/ocr/correct")
def correct_ocr_data(payload: OCRCorrectionPayload):
    updated = False
    for doc in documents_db:
        if doc.get("documentId") == payload.documentId:
            if "ocrResult" in doc and doc["ocrResult"]:
                doc["ocrResult"]["structuredInfo"] = payload.correctedInfo
                doc["ocrResult"]["verifiedByDoctorId"] = payload.doctorId
                doc["ocrResult"]["correctedAt"] = datetime.now().isoformat()
                updated = True
    return {
        "status": "ok",
        "message": f"OCR data updated for document '{payload.documentId}'",
        "updated": updated
    }


@app.post("/api/integration/fhir/encounter/{session_id}")
@app.get("/api/integration/fhir/encounter/{session_id}")
def export_fhir_encounter(session_id: str, payload: Optional[Dict[str, Any]] = None):
    session_data = None

    if payload and isinstance(payload, dict) and payload.get("sessionId") == session_id:
        session_data = payload
    
    if not session_data and payload and isinstance(payload, dict) and payload.get("patientDetails"):
        session_data = payload
        session_data["sessionId"] = session_id

    if not session_data:
        for s in intake_db:
            if s.get("sessionId") == session_id:
                session_data = s
                break

    if not session_data:
        session_data = {
            "sessionId": session_id,
            "patientId": "PAT-1001",
            "language": "en",
            "createdAt": datetime.now().isoformat(),
            "patientDetails": {
                "patientId": "PAT-1001",
                "name": "Rahul Sharma",
                "age": 45,
                "gender": "Male",
                "mobile": "9876543210",
                "previousDepartment": "Cardiology"
            },
            "chiefComplaint": "Severe chest pain radiating to left shoulder and breathlessness",
            "clinicalResponses": [
                {
                    "questionTextEn": "Are you experiencing breathlessness?",
                    "answerDisplayEn": "Yes"
                }
            ],
            "medicalHistory": {
                "pastConditions": {"diabetes": True, "hypertension": True, "cardiacDisease": True},
                "medications": [
                    {"medicine": "Metformin", "strength": "500mg", "frequency": "Twice daily", "duration": "1 year"}
                ],
                "allergies": [
                    {"type": "Drug", "substance": "Penicillin", "reaction": "Skin Rash"}
                ]
            },
            "uploadedDocuments": [],
            "redFlagAssessment": {
                "priorityAssessment": True,
                "triggeredFlags": [
                    {"ruleId": "RF-CARD-01", "name": "Chest Pain with Breathlessness", "severity": "CRITICAL"}
                ],
                "patientMessageEn": "Priority clinical assessment recommended based on reported symptoms."
            }
        }

    bundle = FHIRMapper.transform_session_to_fhir(session_data)
    return bundle




