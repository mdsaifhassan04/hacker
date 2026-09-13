import { DemoPatient } from '../types/session';

export const DEMO_PATIENTS: DemoPatient[] = [
  {
    patientId: 'PAT-1001',
    name: 'Ramesh Kumar (रमेश कुमार)',
    age: 64,
    gender: 'Male',
    mobile: '9876543210',
    lastVisit: '2026-02-14',
    previousDepartment: 'General Medicine',
  },
  {
    patientId: 'PAT-1002',
    name: 'Sunita Sharma (सुनीता शर्मा)',
    age: 52,
    gender: 'Female',
    mobile: '9812345678',
    lastVisit: '2026-01-20',
    previousDepartment: 'Orthopedics',
  },
  {
    patientId: 'PAT-1003',
    name: 'Anil Verma (अनिल वर्मा)',
    age: 38,
    gender: 'Male',
    mobile: '9988776655',
    lastVisit: '2025-11-05',
    previousDepartment: 'Cardiology',
  },
];
