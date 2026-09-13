import random
from datetime import datetime

# Mock demo patient data
DEMO_PATIENT = {
    "name": "Demo Patient",
    "age": 52,
    "complaint": "Chest pain",
    "durationHours": 6,
    "severity": 7,
    "breathlessness": True,
    "hypertension": True,
}

def get_demo_patient_data():
    """Return the static demo patient record."""
    return DEMO_PATIENT

def mock_speech_recognition(language: str = "en") -> str:
    """Return a deterministic speech transcript based on the demo patient.
    Supports English ('en') and Hindi ('hi')."""
    en_phrase = (
        f"I have {DEMO_PATIENT['complaint'].lower()} for "
        f"{DEMO_PATIENT['durationHours']} hours, severity "
        f"{DEMO_PATIENT['severity']} out of 10, "
        f"with breathlessness."
    )
    hi_phrase = (
        f"{DEMO_PATIENT['durationHours']} घंटे से {DEMO_PATIENT['complaint']} है, "
        f"तीव्रता {DEMO_PATIENT['severity']} में से 10, और साँस फूलना।"
    )
    return hi_phrase if language == "hi" else en_phrase

def mock_ocr_result(filename: str) -> dict:
    """Return a deterministic OCR result based on the filename.
    If the filename indicates a lab report, return lab data; otherwise prescription data.
    """
    is_lab = any(k in filename.lower() for k in ["lab", "blood", "report", "test"])
    processed_at = datetime.now().isoformat()
    disclaimer = "Mock OCR extraction for DEMO_MODE. Not a clinical record."
    if is_lab:
        return {
            "documentId": f"DOC-MOCK-{random.randint(1000,9999)}",
            "sourceDocument": filename,
            "rawText": "LAB MOCK DATA",
            "structuredInfo": {
                "docType": "lab_report",
                "prescriptions": [],
                "labReports": [
                    {
                        "test": {"value": "Fasting Blood Sugar", "confidence": 1.0, "sourceDocument": filename},
                        "value": {"value": "110", "confidence": 1.0, "sourceDocument": filename},
                        "unit": {"value": "mg/dL", "confidence": 1.0, "sourceDocument": filename},
                        "referenceRange": {"value": "70-100 mg/dL", "confidence": 1.0, "sourceDocument": filename},
                        "date": {"value": datetime.now().strftime("%Y-%m-%d"), "confidence": 1.0, "sourceDocument": filename},
                    }
                ],
            },
            "confidenceAverage": 1.0,
            "processedAt": processed_at,
            "disclaimer": disclaimer,
        }
    else:
        return {
            "documentId": f"DOC-MOCK-{random.randint(1000,9999)}",
            "sourceDocument": filename,
            "rawText": "PRESCRIPTION MOCK DATA",
            "structuredInfo": {
                "docType": "prescription",
                "prescriptions": [
                    {
                        "medicine": {"value": "Metformin", "confidence": 1.0, "sourceDocument": filename},
                        "strength": {"value": "500mg", "confidence": 1.0, "sourceDocument": filename},
                        "dose": {"value": "1 Tab", "confidence": 1.0, "sourceDocument": filename},
                        "frequency": {"value": "Twice daily", "confidence": 1.0, "sourceDocument": filename},
                        "duration": {"value": "30 days", "confidence": 1.0, "sourceDocument": filename},
                        "date": {"value": datetime.now().strftime("%Y-%m-%d"), "confidence": 1.0, "sourceDocument": filename},
                    },
                    {
                        "medicine": {"value": "Amoxicillin", "confidence": 1.0, "sourceDocument": filename},
                        "strength": {"value": "250mg", "confidence": 1.0, "sourceDocument": filename},
                        "dose": {"value": "1 Cap", "confidence": 1.0, "sourceDocument": filename},
                        "frequency": {"value": "Thrice daily", "confidence": 1.0, "sourceDocument": filename},
                        "duration": {"value": "5 days", "confidence": 1.0, "sourceDocument": filename},
                        "date": {"value": datetime.now().strftime("%Y-%m-%d"), "confidence": 1.0, "sourceDocument": filename},
                    },
                ],
                "labReports": [],
            },
            "confidenceAverage": 1.0,
            "processedAt": processed_at,
            "disclaimer": disclaimer,
        }

def mock_ai_summary(session_data: dict) -> dict:
    """Generate a deterministic clinical summary JSON for DEMO_MODE.
    Mirrors the structure produced by the real LLMService.
    """
    patient = DEMO_PATIENT
    chief_complaint = patient["complaint"]
    hpi = f"{patient['complaint']} for {patient['durationHours']} hours, severity {patient['severity']}/10, breathlessness: {'yes' if patient['breathlessness'] else 'no'}"
    past_medical_history = "Hypertension" if patient.get("hypertension") else "Not reported"
    medication_history = "Metformin 500mg twice daily; Amoxicillin 250mg thrice daily"
    allergy_history = "Not reported"
    surgical_history = "Not reported"
    family_history = "Not reported"
    personal_history = "Not reported"
    relevant_investigations = "OCR Prescription: Metformin, Amoxicillin"
    red_flags = "⚠️ Chest Pain with Breathlessness (CRITICAL)"
    info_requires = [
        "Verify symptom duration and severity with patient.",
        "Confirm medication dosages during consultation.",
    ]
    summary = {
        "chiefComplaint": chief_complaint,
        "historyOfPresentIllness": hpi,
        "pastMedicalHistory": past_medical_history,
        "medicationHistory": medication_history,
        "allergyHistory": allergy_history,
        "surgicalHistory": surgical_history,
        "familyHistory": family_history,
        "personalHistory": personal_history,
        "relevantInvestigations": relevant_investigations,
        "redFlags": red_flags,
        "informationRequiringVerification": info_requires,
        "isDoctorVerified": False,
        "verificationStatus": "UNVERIFIED_DRAFT",
        "encounterId": session_data.get("sessionId", "DEMO-SESSION-001"),
        "generatedAt": datetime.now().isoformat(),
        "verifiedAt": None,
        "verifiedByDoctorId": None,
    }
    return summary
