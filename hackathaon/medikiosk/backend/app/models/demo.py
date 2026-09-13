from pydantic import BaseModel

class DemoPatient(BaseModel):
    name: str
    age: int
    complaint: str
    durationHours: int
    severity: int
    breathlessness: bool
    hypertension: bool

class DemoPrescription(BaseModel):
    medicine: str
    strength: str
    dose: str
    frequency: str
    duration: str
    date: str
    confidence: float = 1.0

class DemoLabReport(BaseModel):
    test: str
    value: str
    unit: str
    referenceRange: str
    date: str
    confidence: float = 1.0
