export type SickLeaveStatus = 'active' | 'completed' | 'cancelled';
export type AgeCategory = 'under_3' | 'over_3';
export type LeaveType = '7_days' | '15_days' | 'commission';
export type DoctorFacsimile = '169501' | '330825';

export interface SickLeave {
  id: string;
  medicalRecordNumber: string;
  parentName: string;
  childName: string;
  ageCategory: AgeCategory;
  diagnosisCode: string;
  secondaryDiagnosisCode?: string;
  leaveType: LeaveType;
  openingDoctor: DoctorFacsimile;
  closingDoctor?: DoctorFacsimile;
  hasLabResults: boolean;
  hasSpecialistReport: boolean;
  hasConsiliaryReport?: boolean;
  hasHospitalDays: boolean;
  hospitalDaysFrom?: string;
  hospitalDaysTo?: string;
  status: SickLeaveStatus;
  startDate: string;
  endDate?: string;
  lastCheckedDate?: string;
  createdAt: string;
}
