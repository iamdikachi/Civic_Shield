/**
 * Types and Interfaces for the Online Crime Reporting System
 */

export enum CrimeCategory {
  THEFT = "Theft",
  ASSAULT = "Assault",
  KIDNAPPING = "Kidnapping",
  FRAUD = "Fraud",
  CYBERCRIME = "Cybercrime",
  DOMESTIC_VIOLENCE = "Domestic Violence",
  VANDALISM = "Vandalism",
  HOMICIDE = "Homicide",
  MISSING_PERSON = "Missing Person",
  OTHER = "Other",
}

export enum ReportStatus {
  SUBMITTED = "Submitted",
  UNDER_REVIEW = "Under Review",
  INVESTIGATING = "Investigating",
  RESOLVED = "Resolved/Closed",
  REJECTED = "Rejected (False/Unfounded)",
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  zone: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "audio";
  url: string;
  size: string;
}

export interface ReporterInfo {
  isAnonymous: boolean;
  fullName?: string;
  phone?: string;
  email?: string;
  hasConsent: boolean;
}

export interface Officer {
  id: string;
  name: string;
  badgeNumber: string;
  role: "Officer" | "Supervisor" | "Admin";
  zone: string;
  activeCases: number;
  email: string;
  phone: string;
}

export interface ReportComment {
  id: string;
  sender: "Reporter" | "Officer" | "System";
  senderName: string;
  text: string;
  timestamp: string;
  isPrivate: boolean; // private comments are staff-only
}

export interface Report {
  id: string; // Case reference number like CR-2026-X
  category: CrimeCategory;
  otherCategoryDetails?: string;
  date: string;
  time: string;
  description: string;
  personsInvolved?: number;
  weaponInvolved: boolean;
  weaponType?: string;
  location: LocationData;
  evidence: EvidenceFile[];
  reporter: ReporterInfo;
  status: ReportStatus;
  assignedOfficerId?: string;
  officerNotes?: string; // Public officer notes
  internalNotes?: string; // Private internal notes
  createdAt: string;
  updatedAt: string;
  timeline: {
    status: ReportStatus;
    note: string;
    timestamp: string;
    updatedBy: string;
  }[];
  comments: ReportComment[];
  corroboratingReportIds?: string[]; // IDs of other reports merged into this case
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: "Citizen" | "Officer" | "Supervisor" | "Admin";
  badgeNumber?: string;
  zone?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  caseId?: string;
}

export interface Notification {
  id: string;
  userId: string; // "all-staff", "citizen-id", etc.
  title: string;
  message: string;
  caseId?: string;
  timestamp: string;
  isRead: boolean;
}

export interface SystemSettings {
  duplicateRadiusMeters: number; // e.g. 500
  duplicateTimeWindowHours: number; // e.g. 24
  categories: string[];
  zones: string[];
  notificationTemplates: {
    [key in ReportStatus]: string;
  };
}
