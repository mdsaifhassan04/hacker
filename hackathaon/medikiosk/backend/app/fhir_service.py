import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional


class FHIRMapper:
    """
    Interoperability mapper converting MediKiosk clinical intake session data
    into FHIR R4 compatible JSON structures.

    Clearly labeled as: "FHIR-compatible prototype."
    Extensible architecture designed for future ABDM (NDHM) integration.
    """

    DISCLAIMER = "FHIR-compatible prototype."
    ABDM_OP_CONSULT_PROFILE = "https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord"
    SYSTEM_BASE = "https://medikiosk.health/fhir"

    @classmethod
    def transform_session_to_fhir(cls, session: Dict[str, Any]) -> Dict[str, Any]:
        session_id = session.get("sessionId", f"SESS-{uuid.uuid4().hex[:8].upper()}")
        patient_details = session.get("patientDetails", {})
        patient_id = session.get("patientId") or patient_details.get("patientId") or "PAT-UNKNOWN"
        created_at = session.get("createdAt") or datetime.now().isoformat()
        department = patient_details.get("previousDepartment", "General Medicine OPD")

        patient_ref = f"Patient/{patient_id}"
        encounter_ref = f"Encounter/{session_id}"

        # 1. Build FHIR Patient
        patient_resource = cls.build_patient(patient_details, patient_id)

        # 2. Build FHIR Encounter
        encounter_resource = cls.build_encounter(session_id, patient_id, created_at, department)

        # 3. Build FHIR Conditions (Past History)
        condition_resources = cls.build_conditions(session.get("medicalHistory"), patient_ref, encounter_ref)

        # 4. Build FHIR Observations (Chief Complaint, Questionnaire, Red Flags, OCR Labs)
        observation_resources = cls.build_observations(
            chief_complaint=session.get("chiefComplaint"),
            clinical_responses=session.get("clinicalResponses") or [],
            red_flag=session.get("redFlagAssessment"),
            uploaded_docs=session.get("uploadedDocuments") or [],
            patient_ref=patient_ref,
            encounter_ref=encounter_ref
        )

        # 5. Build FHIR MedicationStatements (Current Medications & OCR Prescriptions)
        medication_resources = cls.build_medications(
            medical_history=session.get("medicalHistory"),
            uploaded_docs=session.get("uploadedDocuments") or [],
            patient_ref=patient_ref,
            encounter_ref=encounter_ref
        )

        # 6. Build FHIR AllergyIntolerances
        allergy_resources = cls.build_allergies(session.get("medicalHistory"), patient_ref)

        # 7. Build FHIR DocumentReferences
        doc_resources = cls.build_document_references(session.get("uploadedDocuments") or [], patient_ref, encounter_ref)

        # Collect all resource entries
        all_resources = [
            patient_resource,
            encounter_resource,
            *condition_resources,
            *observation_resources,
            *medication_resources,
            *allergy_resources,
            *doc_resources
        ]

        entries = [{"fullUrl": f"urn:uuid:{res.get('id', str(uuid.uuid4()))}", "resource": res} for res in all_resources]

        # Construct FHIR R4 Bundle
        bundle = {
            "resourceType": "Bundle",
            "id": f"BUNDLE-{session_id}",
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.now().isoformat(),
                "profile": [cls.ABDM_OP_CONSULT_PROFILE],
                "tag": [
                    {
                        "system": f"{cls.SYSTEM_BASE}/meta",
                        "code": "FHIR_PROTOTYPE",
                        "display": cls.DISCLAIMER
                    }
                ]
            },
            "type": "collection",
            "timestamp": datetime.now().isoformat(),
            "identifier": {
                "system": f"{cls.SYSTEM_BASE}/bundle",
                "value": f"BUNDLE-{session_id}"
            },
            "disclaimer": cls.DISCLAIMER,
            "abdmExtensibility": {
                "readyForAbdmM1M2M3": True,
                "targetProfile": "ABDM OP Consult Record (R4)",
                "abhaAddressPlaceholder": f"{patient_id.lower()}@sbx"
            },
            "total": len(entries),
            "entry": entries
        }

        return bundle

    @classmethod
    def build_patient(cls, details: Dict[str, Any], patient_id: str) -> Dict[str, Any]:
        gender_map = {"male": "male", "female": "female", "other": "other"}
        raw_gender = str(details.get("gender", "unknown")).lower()
        fhir_gender = gender_map.get(raw_gender, "unknown")

        return {
            "resourceType": "Patient",
            "id": patient_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"]
            },
            "identifier": [
                {
                    "system": f"{cls.SYSTEM_BASE}/patient-id",
                    "value": patient_id
                },
                {
                    "system": "https://healthid.ndhm.gov.in",
                    "value": f"91-{details.get('mobile', '0000000000')}-ABHA",
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                                "code": "MR",
                                "display": "Medical Record Number (ABHA Placeholder)"
                            }
                        ]
                    }
                }
            ],
            "active": True,
            "name": [
                {
                    "use": "official",
                    "text": details.get("name", "Unknown Patient")
                }
            ],
            "telecom": [
                {
                    "system": "phone",
                    "value": details.get("mobile", ""),
                    "use": "mobile"
                }
            ] if details.get("mobile") else [],
            "gender": fhir_gender,
            "extension": [
                {
                    "url": "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Age",
                    "valueQuantity": {
                        "value": details.get("age", 0),
                        "unit": "years",
                        "system": "http://unitsofmeasure.org",
                        "code": "a"
                    }
                }
            ],
            "disclaimer": cls.DISCLAIMER
        }

    @classmethod
    def build_encounter(cls, session_id: str, patient_id: str, created_at: str, department: str) -> Dict[str, Any]:
        return {
            "resourceType": "Encounter",
            "id": session_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter"]
            },
            "identifier": [
                {
                    "system": f"{cls.SYSTEM_BASE}/encounter-id",
                    "value": session_id
                }
            ],
            "status": "finished",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "ambulatory"
            },
            "type": [
                {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "11429006",
                            "display": "Consultation (procedure)"
                        }
                    ],
                    "text": f"Pre-Consultation Intake - {department}"
                }
            ],
            "subject": {
                "reference": f"Patient/{patient_id}"
            },
            "period": {
                "start": created_at
            },
            "serviceType": {
                "text": department
            },
            "disclaimer": cls.DISCLAIMER
        }

    @classmethod
    def build_conditions(cls, med_history: Optional[Dict[str, Any]], patient_ref: str, encounter_ref: str) -> List[Dict[str, Any]]:
        conditions = []
        if not med_history:
            return conditions

        pc = med_history.get("pastConditions")
        active_cond_names = []

        if isinstance(pc, dict):
            if pc.get("diabetes"): active_cond_names.append(("Diabetes Mellitus", "73211009"))
            if pc.get("hypertension"): active_cond_names.append(("Hypertension", "38341003"))
            if pc.get("asthma"): active_cond_names.append(("Bronchial Asthma", "195967001"))
            if pc.get("tuberculosis"): active_cond_names.append(("Tuberculosis", "56717001"))
            if pc.get("cardiacDisease"): active_cond_names.append(("Cardiac Disease", "53741008"))
            if pc.get("other"): active_cond_names.append((str(pc["other"]), "410605003"))
        elif isinstance(pc, str) and pc.strip() and pc != "Not reported":
            for part in pc.split(","):
                part_str = part.strip()
                if part_str:
                    active_cond_names.append((part_str, "410605003"))

        for name, snomed_code in active_cond_names:
            cond_id = f"COND-{uuid.uuid4().hex[:8].upper()}"
            conditions.append({
                "resourceType": "Condition",
                "id": cond_id,
                "meta": {
                    "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition"]
                },
                "clinicalStatus": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                            "code": "active",
                            "display": "Active"
                        }
                    ]
                },
                "verificationStatus": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                            "code": "confirmed",
                            "display": "Confirmed"
                        }
                    ]
                },
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                                "code": "problem-list-item",
                                "display": "Problem List Item"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": snomed_code,
                            "display": name
                        }
                    ],
                    "text": name
                },
                "subject": {"reference": patient_ref},
                "encounter": {"reference": encounter_ref},
                "recordedDate": datetime.now().isoformat(),
                "disclaimer": cls.DISCLAIMER
            })

        return conditions

    @classmethod
    def build_observations(
        cls,
        chief_complaint: Optional[str],
        clinical_responses: List[Dict[str, Any]],
        red_flag: Optional[Dict[str, Any]],
        uploaded_docs: List[Dict[str, Any]],
        patient_ref: str,
        encounter_ref: str
    ) -> List[Dict[str, Any]]:
        obs_list = []

        # 1. Chief Complaint Observation
        if chief_complaint and chief_complaint != "Not reported":
            obs_list.append({
                "resourceType": "Observation",
                "id": f"OBS-CC-{uuid.uuid4().hex[:8].upper()}",
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "exam",
                                "display": "Exam"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "10154-3",
                            "display": "Chief complaint Narrative"
                        }
                    ],
                    "text": "Chief Complaint"
                },
                "subject": {"reference": patient_ref},
                "encounter": {"reference": encounter_ref},
                "effectiveDateTime": datetime.now().isoformat(),
                "valueString": chief_complaint,
                "disclaimer": cls.DISCLAIMER
            })

        # 2. Questionnaire Responses as Observations
        for resp in clinical_responses:
            if resp.get("questionTextEn") and resp.get("answerDisplayEn"):
                obs_list.append({
                    "resourceType": "Observation",
                    "id": f"OBS-Q-{uuid.uuid4().hex[:8].upper()}",
                    "status": "final",
                    "code": {
                        "text": resp.get("questionTextEn")
                    },
                    "subject": {"reference": patient_ref},
                    "encounter": {"reference": encounter_ref},
                    "valueString": resp.get("answerDisplayEn"),
                    "disclaimer": cls.DISCLAIMER
                })

        # 3. Red-Flag Assessment Observation
        if red_flag:
            has_red_flag = red_flag.get("priorityAssessment") is True
            triggered = red_flag.get("triggeredFlags") or []
            message = red_flag.get("patientMessageEn") or "Standard triage assessment"

            obs_list.append({
                "resourceType": "Observation",
                "id": f"OBS-RF-{uuid.uuid4().hex[:8].upper()}",
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "survey",
                                "display": "Survey"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "69730-0",
                            "display": "Emergency medical triage assessment"
                        }
                    ],
                    "text": "Red-Flag Safety Triage Assessment"
                },
                "subject": {"reference": patient_ref},
                "encounter": {"reference": encounter_ref},
                "valueString": message,
                "interpretation": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                                "code": "CRIT" if has_red_flag else "N",
                                "display": "Critical Priority" if has_red_flag else "Normal"
                            }
                        ]
                    }
                ],
                "note": [{"text": f"Triggered Rules: {', '.join([f.get('name', '') for f in triggered])}"}] if triggered else [],
                "disclaimer": cls.DISCLAIMER
            })

        # 4. OCR Lab Observations
        for doc in uploaded_docs:
            ocr = doc.get("ocrResult")
            if ocr and isinstance(ocr, dict):
                labs = ocr.get("structuredInfo", {}).get("labReports") or []
                for lab in labs:
                    test_name = lab.get("test", {}).get("value", "Laboratory Test")
                    test_val = lab.get("value", {}).get("value", "N/A")
                    test_unit = lab.get("unit", {}).get("value", "")
                    ref_range = lab.get("referenceRange", {}).get("value", "")

                    obs_list.append({
                        "resourceType": "Observation",
                        "id": f"OBS-LAB-{uuid.uuid4().hex[:8].upper()}",
                        "status": "final",
                        "category": [
                            {
                                "coding": [
                                    {
                                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                        "code": "laboratory",
                                        "display": "Laboratory"
                                    }
                                ]
                            }
                        ],
                        "code": {"text": test_name},
                        "subject": {"reference": patient_ref},
                        "encounter": {"reference": encounter_ref},
                        "valueString": f"{test_val} {test_unit}".strip(),
                        "referenceRange": [{"text": ref_range}] if ref_range else [],
                        "note": [{"text": f"Extracted via OCR from source file: {doc.get('filename')}"}],
                        "disclaimer": cls.DISCLAIMER
                    })

        return obs_list

    @classmethod
    def build_medications(
        cls,
        medical_history: Optional[Dict[str, Any]],
        uploaded_docs: List[Dict[str, Any]],
        patient_ref: str,
        encounter_ref: str
    ) -> List[Dict[str, Any]]:
        med_list = []

        # 1. Patient Self-Reported Medications
        if medical_history and isinstance(medical_history.get("medications"), list):
            for m in medical_history["medications"]:
                med_name = m.get("medicine")
                if med_name:
                    med_list.append({
                        "resourceType": "MedicationStatement",
                        "id": f"MED-{uuid.uuid4().hex[:8].upper()}",
                        "status": "active",
                        "medicationCodeableConcept": {
                            "text": med_name
                        },
                        "subject": {"reference": patient_ref},
                        "context": {"reference": encounter_ref},
                        "dosage": [
                            {
                                "text": f"{m.get('strength', '')} {m.get('frequency', '')} for {m.get('duration', '')}".strip()
                            }
                        ],
                        "disclaimer": cls.DISCLAIMER
                    })

        # 2. OCR Extracted Prescriptions
        for doc in uploaded_docs:
            ocr = doc.get("ocrResult")
            if ocr and isinstance(ocr, dict):
                rxs = ocr.get("structuredInfo", {}).get("prescriptions") or []
                for rx in rxs:
                    med_name = rx.get("medicine", {}).get("value")
                    if med_name:
                        strength = rx.get("strength", {}).get("value", "")
                        freq = rx.get("frequency", {}).get("value", "")
                        duration = rx.get("duration", {}).get("value", "")

                        med_list.append({
                            "resourceType": "MedicationStatement",
                            "id": f"MED-OCR-{uuid.uuid4().hex[:8].upper()}",
                            "status": "active",
                            "medicationCodeableConcept": {
                                "text": med_name
                            },
                            "subject": {"reference": patient_ref},
                            "context": {"reference": encounter_ref},
                            "dosage": [
                                {
                                    "text": f"OCR Extracted: {strength} {freq} x {duration}".strip()
                                }
                            ],
                            "note": [{"text": f"Extracted via OCR from prescription: {doc.get('filename')}"}],
                            "disclaimer": cls.DISCLAIMER
                        })

        return med_list

    @classmethod
    def build_allergies(cls, medical_history: Optional[Dict[str, Any]], patient_ref: str) -> List[Dict[str, Any]]:
        allergies = []
        if medical_history and isinstance(medical_history.get("allergies"), list):
            for a in medical_history["allergies"]:
                substance = a.get("substance")
                if substance:
                    alg_type = a.get("type", "medication").lower()
                    fhir_category = "medication" if "drug" in alg_type or "med" in alg_type else "food" if "food" in alg_type else "environment"

                    allergies.append({
                        "resourceType": "AllergyIntolerance",
                        "id": f"ALG-{uuid.uuid4().hex[:8].upper()}",
                        "clinicalStatus": {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                                    "code": "active",
                                    "display": "Active"
                                }
                            ]
                        },
                        "category": [fhir_category],
                        "code": {"text": substance},
                        "patient": {"reference": patient_ref},
                        "reaction": [
                            {
                                "manifestation": [
                                    {"text": a.get("reaction", "Unspecified reaction")}
                                ]
                            }
                        ] if a.get("reaction") else [],
                        "disclaimer": cls.DISCLAIMER
                    })

        return allergies

    @classmethod
    def build_document_references(cls, uploaded_docs: List[Dict[str, Any]], patient_ref: str, encounter_ref: str) -> List[Dict[str, Any]]:
        doc_refs = []
        for doc in uploaded_docs:
            doc_id = doc.get("documentId", f"DOC-{uuid.uuid4().hex[:8].upper()}")
            doc_refs.append({
                "resourceType": "DocumentReference",
                "id": doc_id,
                "status": "current",
                "docStatus": "preliminary",
                "type": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "34105-7",
                            "display": "Hospital discharge summary or clinical document"
                        }
                    ],
                    "text": doc.get("fileType", "Clinical Document")
                },
                "subject": {"reference": patient_ref},
                "context": {
                    "encounter": [{"reference": encounter_ref}]
                },
                "content": [
                    {
                        "attachment": {
                            "contentType": doc.get("fileType", "application/pdf"),
                            "url": doc.get("fileUrl", ""),
                            "title": doc.get("filename", "Uploaded Medical Document"),
                            "size": doc.get("fileSize", 0),
                            "creation": doc.get("uploadedAt", datetime.now().isoformat())
                        }
                    }
                ],
                "disclaimer": cls.DISCLAIMER
            })

        return doc_refs
