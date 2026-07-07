import { CrimeCategory, ReportStatus, Report, User, Officer, AuditLog, Notification, SystemSettings } from "../types";

// Helper to format ISO timestamp relative to now
const getRelativeDateString = (offsetDays: number, hourOffset: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(d.getHours() - hourOffset);
  return d.toISOString().split("T")[0];
};

const getRelativeTimeString = (hourOffset: number = 0): string => {
  const d = new Date();
  d.setHours(d.getHours() - hourOffset);
  const hrs = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${hrs}:${mins}`;
};

// Initial Officers
export const INITIAL_OFFICERS: Officer[] = [
  {
    id: "off-1",
    name: "Sergeant Marcus Vance",
    badgeNumber: "BADGE-8092",
    role: "Supervisor",
    zone: "Downtown (North)",
    activeCases: 2,
    email: "m.vance@police.metroheights.gov",
    phone: "555-019-2831",
  },
  {
    id: "off-2",
    name: "Officer Sarah Jenkins",
    badgeNumber: "BADGE-4412",
    role: "Officer",
    zone: "Residential West",
    activeCases: 3,
    email: "s.jenkins@police.metroheights.gov",
    phone: "555-019-2442",
  },
  {
    id: "off-3",
    name: "Inspector Alan Turing",
    badgeNumber: "BADGE-0101",
    role: "Officer",
    zone: "Industrial East",
    activeCases: 1,
    email: "a.turing@police.metroheights.gov",
    phone: "555-019-1010",
  },
  {
    id: "off-4",
    name: "Chief Evelyn Carter",
    badgeNumber: "BADGE-0001",
    role: "Admin",
    zone: "Downtown (South)",
    activeCases: 0,
    email: "e.carter@police.metroheights.gov",
    phone: "555-019-0001",
  }
];

// Initial Users
export const INITIAL_USERS: User[] = [
  {
    id: "usr-1",
    email: "citizen@civic.com",
    fullName: "James Peterson",
    phone: "555-123-4567",
    role: "Citizen",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "usr-2",
    email: "officer@police.gov",
    fullName: "Officer Sarah Jenkins",
    phone: "555-019-2442",
    role: "Officer",
    badgeNumber: "BADGE-4412",
    zone: "Residential West",
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "usr-3",
    email: "admin@police.gov",
    fullName: "Chief Evelyn Carter",
    phone: "555-019-0001",
    role: "Admin",
    badgeNumber: "BADGE-0001",
    zone: "Downtown (South)",
    createdAt: "2025-12-01T10:00:00Z",
  }
];

// Initial Reports database
export const INITIAL_REPORTS: Report[] = [
  {
    id: "CR-2026-801",
    category: CrimeCategory.THEFT,
    date: getRelativeDateString(1, 4), // yesterday
    time: "14:30",
    description: "Witnessed a suspect snatch a delivery parcel from the porch of house #104. Suspect was wearing a gray hoodie and dark sunglasses, fled on a black scooter going east on Maple Street.",
    personsInvolved: 1,
    weaponInvolved: false,
    location: {
      latitude: 40.7180,
      longitude: -74.0120,
      address: "104 Maple Street, Residential West",
      landmark: "Opposite the park bench",
      zone: "Residential West",
    },
    evidence: [
      {
        id: "ev-1",
        name: "porch_camera_recording.mp4",
        type: "video",
        url: "#",
        size: "4.8 MB",
      }
    ],
    reporter: {
      isAnonymous: false,
      fullName: "James Peterson",
      phone: "555-123-4567",
      email: "citizen@civic.com",
      hasConsent: true,
    },
    status: ReportStatus.INVESTIGATING,
    assignedOfficerId: "off-2",
    internalNotes: "Suspect matches description of local parcel theft ring operating in Area B.",
    officerNotes: "Footage has been reviewed and shared with local patrol units. Patrol density increased in Maple Street.",
    createdAt: `${getRelativeDateString(1)}T14:45:00Z`,
    updatedAt: `${getRelativeDateString(0)}T09:00:00Z`,
    timeline: [
      {
        status: ReportStatus.SUBMITTED,
        note: "Case reported by citizen James Peterson",
        timestamp: `${getRelativeDateString(1)}T14:45:00Z`,
        updatedBy: "James Peterson",
      },
      {
        status: ReportStatus.UNDER_REVIEW,
        note: "Officer assigned and details undergoing verification",
        timestamp: `${getRelativeDateString(1)}T16:00:00Z`,
        updatedBy: "System",
      },
      {
        status: ReportStatus.INVESTIGATING,
        note: "Video evidence logged. Active patrol dispatched.",
        timestamp: `${getRelativeDateString(0)}T09:00:00Z`,
        updatedBy: "Officer Sarah Jenkins",
      }
    ],
    comments: [
      {
        id: "c-1",
        sender: "Reporter",
        senderName: "James Peterson",
        text: "I also spoke to my neighbor across the street. She thinks she saw the same scooter parked there earlier around 1:00 PM.",
        timestamp: `${getRelativeDateString(1)}T15:10:00Z`,
        isPrivate: false,
      },
      {
        id: "c-2",
        sender: "Officer",
        senderName: "Officer Sarah Jenkins",
        text: "Thanks for the details, James. We are verifying neighbors' footage as well.",
        timestamp: `${getRelativeDateString(0)}T09:05:00Z`,
        isPrivate: false,
      }
    ],
  },
  {
    id: "CR-2026-802",
    category: CrimeCategory.VANDALISM,
    date: getRelativeDateString(2, 6),
    time: "23:15",
    description: "Red spray paint graffiti sprayed across the brick facade of Metro Library. Highly visible. Tag reads 'CYBER-2026'. First observed this morning around 8 AM.",
    personsInvolved: 2,
    weaponInvolved: false,
    location: {
      latitude: 40.7102,
      longitude: -74.0080,
      address: "Civic Plaza, Downtown (North)",
      landmark: "Metro Heights Public Library Front Gates",
      zone: "Downtown (North)",
    },
    evidence: [
      {
        id: "ev-2",
        name: "library_graffiti.jpg",
        type: "image",
        url: "#",
        size: "1.2 MB",
      }
    ],
    reporter: {
      isAnonymous: true,
      hasConsent: true,
    },
    status: ReportStatus.RESOLVED,
    assignedOfficerId: "off-1",
    internalNotes: "Library facilities notified. Council cleaning crew dispatched.",
    officerNotes: "Vandalism cleaned up. CCTV logs checked, but suspect was wearing fully masked gear. Incident logged for gang-activity analytics.",
    createdAt: `${getRelativeDateString(2)}T08:30:00Z`,
    updatedAt: `${getRelativeDateString(1)}T10:00:00Z`,
    timeline: [
      {
        status: ReportStatus.SUBMITTED,
        note: "Anonymous report filed",
        timestamp: `${getRelativeDateString(2)}T08:30:00Z`,
        updatedBy: "Anonymous Citizen",
      },
      {
        status: ReportStatus.INVESTIGATING,
        note: "Assigned to Supervisor Vance. Clean up ordered.",
        timestamp: `${getRelativeDateString(2)}T10:15:00Z`,
        updatedBy: "System",
      },
      {
        status: ReportStatus.RESOLVED,
        note: "Graffiti removed and incident recorded.",
        timestamp: `${getRelativeDateString(1)}T10:00:00Z`,
        updatedBy: "Sergeant Marcus Vance",
      }
    ],
    comments: [],
  },
  {
    id: "CR-2026-803",
    category: CrimeCategory.CYBERCRIME,
    date: getRelativeDateString(3, 1),
    time: "10:00",
    description: "Received a phishing email claiming to be from the Metro Municipal Taxes. They directed to a fake website requesting banking login. Phishing domain registered is heights-tax-portal.com.",
    personsInvolved: 0,
    weaponInvolved: false,
    location: {
      latitude: 40.7050,
      longitude: -74.0150,
      address: "Heights Cyber Cafe, Downtown (South)",
      zone: "Downtown (South)",
    },
    evidence: [
      {
        id: "ev-3",
        name: "email_screenshot.png",
        type: "image",
        url: "#",
        size: "820 KB",
      },
      {
        id: "ev-4",
        name: "email_headers.txt",
        type: "document",
        url: "#",
        size: "45 KB",
      }
    ],
    reporter: {
      isAnonymous: false,
      fullName: "Alex Rivera",
      phone: "555-987-6543",
      email: "arivera@tech.com",
      hasConsent: true,
    },
    status: ReportStatus.UNDER_REVIEW,
    assignedOfficerId: "off-4",
    internalNotes: "Phishing alert triggered with ISP. Domain registrar has been filed with take-down request.",
    officerNotes: "System is reviewing cybersecurity logs to map other targets.",
    createdAt: `${getRelativeDateString(3)}T11:15:00Z`,
    updatedAt: `${getRelativeDateString(2)}T14:00:00Z`,
    timeline: [
      {
        status: ReportStatus.SUBMITTED,
        note: "Report filed successfully",
        timestamp: `${getRelativeDateString(3)}T11:15:00Z`,
        updatedBy: "Alex Rivera",
      },
      {
        status: ReportStatus.UNDER_REVIEW,
        note: "Transferred to Cyber Crimes Division",
        timestamp: `${getRelativeDateString(2)}T14:00:00Z`,
        updatedBy: "Chief Evelyn Carter",
      }
    ],
    comments: [],
  },

  // DUPLICATE REPORT TRIGGER (A Group of Reports reported at same location, same time, by different citizens)
  // These will serve to demo the similar-report detection / deduplication queue
  {
    id: "CR-2026-804",
    category: CrimeCategory.ASSAULT,
    date: getRelativeDateString(0, 3), // 3 hours ago
    time: getRelativeTimeString(3),
    description: "Physical altercation between two motorists at the intersection of Oak Avenue and 5th Street. They block the intersection, shouting and pushing. One is holding a metallic rod.",
    personsInvolved: 2,
    weaponInvolved: true,
    weaponType: "Metallic Rod / Club",
    location: {
      latitude: 40.7150,
      longitude: -74.0040,
      address: "Oak Avenue & 5th Street, Downtown (North)",
      landmark: "Outside Corner Cafe",
      zone: "Downtown (North)",
    },
    evidence: [],
    reporter: {
      isAnonymous: false,
      fullName: "Deborah Smith",
      phone: "555-555-0123",
      email: "debbie@gmail.com",
      hasConsent: true,
    },
    status: ReportStatus.SUBMITTED,
    createdAt: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:00Z`,
    updatedAt: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:00Z`,
    timeline: [
      {
        status: ReportStatus.SUBMITTED,
        note: "Case logged",
        timestamp: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:00Z`,
        updatedBy: "Deborah Smith",
      }
    ],
    comments: [],
  },
  {
    id: "CR-2026-805", // Flagged as similar to 804 (same time, same intersection, same category)
    category: CrimeCategory.ASSAULT,
    date: getRelativeDateString(0, 3), // 3 hours ago (same)
    time: getRelativeTimeString(3),
    description: "Road rage brawl at Oak Ave. Two drivers are punching each other. One of them is holding a tire iron. It is blocking all traffic near Downtown Plaza.",
    personsInvolved: 2,
    weaponInvolved: true,
    weaponType: "Tire iron",
    location: {
      latitude: 40.7151,
      longitude: -74.0042, // very close proximity
      address: "Oak Ave and 5th Rd, Downtown (North)",
      landmark: "Downtown Plaza corner",
      zone: "Downtown (North)",
    },
    evidence: [],
    reporter: {
      isAnonymous: true,
      hasConsent: true,
    },
    status: ReportStatus.SUBMITTED,
    createdAt: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:05Z`,
    updatedAt: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:05Z`,
    timeline: [
      {
        status: ReportStatus.SUBMITTED,
        note: "Anonymous case logged",
        timestamp: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:05Z`,
        updatedBy: "Anonymous Citizen",
      }
    ],
    comments: [],
  },
  {
    id: "CR-2026-806", // Another report of the same event
    category: CrimeCategory.ASSAULT,
    date: getRelativeDateString(0, 3),
    time: getRelativeTimeString(3),
    description: "Two angry men fighting on the street next to a red sedan and yellow cab. Blocking the crosswalk on 5th Street.",
    personsInvolved: 2,
    weaponInvolved: false,
    location: {
      latitude: 40.7149,
      longitude: -74.0039, // very close proximity
      address: "5th Street crossing Oak Avenue",
      landmark: "Beside the yellow cab",
      zone: "Downtown (North)",
    },
    evidence: [],
    reporter: {
      isAnonymous: false,
      fullName: "David Beckham",
      phone: "555-555-9000",
      email: "david@manutd.com",
      hasConsent: true,
    },
    status: ReportStatus.SUBMITTED,
    createdAt: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:10Z`,
    updatedAt: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:10Z`,
    timeline: [
      {
        status: ReportStatus.SUBMITTED,
        note: "Case logged",
        timestamp: `${getRelativeDateString(0, 3)}T${getRelativeTimeString(3)}:10Z`,
        updatedBy: "David Beckham",
      }
    ],
    comments: [],
  }
];

// Initial Audit Logs
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-1",
    timestamp: "2026-07-05T14:45:00Z",
    userId: "off-1",
    userName: "Sergeant Marcus Vance",
    userRole: "Supervisor",
    action: "UPDATE_STATUS",
    details: "Changed status of CR-2026-802 from Investigating to Resolved.",
    caseId: "CR-2026-802",
  },
  {
    id: "aud-2",
    timestamp: "2026-07-06T09:00:00Z",
    userId: "off-2",
    userName: "Officer Sarah Jenkins",
    userRole: "Officer",
    action: "UPDATE_STATUS",
    details: "Changed status of CR-2026-801 from Under Review to Investigating and logged porch camera footage.",
    caseId: "CR-2026-801",
  },
  {
    id: "aud-3",
    timestamp: "2026-07-06T10:00:00Z",
    userId: "off-4",
    userName: "Chief Evelyn Carter",
    userRole: "Admin",
    action: "ASSIGN_OFFICER",
    details: "Assigned officer Sarah Jenkins to case CR-2026-801.",
    caseId: "CR-2026-801",
  }
];

// Initial System Settings
export const INITIAL_SETTINGS: SystemSettings = {
  duplicateRadiusMeters: 500,
  duplicateTimeWindowHours: 24,
  categories: Object.values(CrimeCategory),
  zones: ["Downtown (North)", "Downtown (South)", "Industrial East", "Residential West", "Suburban North"],
  notificationTemplates: {
    [ReportStatus.SUBMITTED]: "Dear Resident, your report (ID: {ID}) has been safely logged in our system. An officer in the {ZONE} division is review-processing it.",
    [ReportStatus.UNDER_REVIEW]: "Notice: Your report (ID: {ID}) is now under active review. An officer has been assigned to investigate.",
    [ReportStatus.INVESTIGATING]: "Active Investigation: Your case (ID: {ID}) is under formal field investigation in {ZONE}.",
    [ReportStatus.RESOLVED]: "Case Resolution: Report (ID: {ID}) is marked as RESOLVED. Notes: {NOTES}",
    [ReportStatus.REJECTED]: "Notification: Case (ID: {ID}) is closed and marked as Unfounded or Duplicate. Thank you.",
  }
};

// State Manager that handles localStorage
export class MockDatabase {
  private reports: Report[] = [];
  private users: User[] = [];
  private officers: Officer[] = [];
  private logs: AuditLog[] = [];
  private settings: SystemSettings = INITIAL_SETTINGS;
  private notifications: Notification[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const reports = localStorage.getItem("civic_shield_reports");
      const users = localStorage.getItem("civic_shield_users");
      const officers = localStorage.getItem("civic_shield_officers");
      const logs = localStorage.getItem("civic_shield_logs");
      const settings = localStorage.getItem("civic_shield_settings");
      const notifications = localStorage.getItem("civic_shield_notifications");

      if (reports) this.reports = JSON.parse(reports);
      else {
        this.reports = INITIAL_REPORTS;
        this.saveReports();
      }

      if (users) this.users = JSON.parse(users);
      else {
        this.users = INITIAL_USERS;
        this.saveUsers();
      }

      if (officers) this.officers = JSON.parse(officers);
      else {
        this.officers = INITIAL_OFFICERS;
        this.saveOfficers();
      }

      if (logs) this.logs = JSON.parse(logs);
      else {
        this.logs = INITIAL_AUDIT_LOGS;
        this.saveLogs();
      }

      if (settings) this.settings = JSON.parse(settings);
      else {
        this.settings = INITIAL_SETTINGS;
        this.saveSettings();
      }

      if (notifications) this.notifications = JSON.parse(notifications);
      else {
        // Build initial notifications
        this.notifications = [
          {
            id: "not-1",
            userId: "usr-1", // James Peterson
            title: "Case Status Updated",
            message: "Your reported case CR-2026-801 has moved to 'Investigating'.",
            caseId: "CR-2026-801",
            timestamp: new Date().toISOString(),
            isRead: false,
          },
          {
            id: "not-2",
            userId: "all-staff",
            title: "New Road Altercation Reported",
            message: "Assault / road altercation reported in Downtown (North) area.",
            caseId: "CR-2026-804",
            timestamp: new Date().toISOString(),
            isRead: false,
          }
        ];
        this.saveNotifications();
      }
    } catch (e) {
      console.error("Failed to load local database, resetting", e);
      this.reports = INITIAL_REPORTS;
      this.users = INITIAL_USERS;
      this.officers = INITIAL_OFFICERS;
      this.logs = INITIAL_AUDIT_LOGS;
      this.settings = INITIAL_SETTINGS;
      this.notifications = [];
    }
  }

  // Save commands
  private saveReports() { localStorage.setItem("civic_shield_reports", JSON.stringify(this.reports)); }
  private saveUsers() { localStorage.setItem("civic_shield_users", JSON.stringify(this.users)); }
  private saveOfficers() { localStorage.setItem("civic_shield_officers", JSON.stringify(this.officers)); }
  private saveLogs() { localStorage.setItem("civic_shield_logs", JSON.stringify(this.logs)); }
  private saveSettings() { localStorage.setItem("civic_shield_settings", JSON.stringify(this.settings)); }
  private saveNotifications() { localStorage.setItem("civic_shield_notifications", JSON.stringify(this.notifications)); }

  // CRUD API for Reports
  public getReports(): Report[] {
    return this.reports;
  }

  public getReport(id: string): Report | undefined {
    return this.reports.find(r => r.id === id);
  }

  public addReport(report: Report): Report {
    this.reports.unshift(report);
    this.saveReports();
    this.logAction("SYSTEM", "Anonymous", "Citizen", "CREATE_REPORT", `Filed new crime report ${report.id} under category ${report.category}.`, report.id);
    
    // Auto flag similar reports in system if any exist
    this.triggerDuplicateCheckAndNotify(report);
    
    return report;
  }

  public updateReportStatus(reportId: string, status: ReportStatus, officerId: string, officerName: string, note: string, internalNote?: string, publicNote?: string): Report | undefined {
    const r = this.getReport(reportId);
    if (r) {
      r.status = status;
      r.updatedAt = new Date().toISOString();
      if (internalNote !== undefined) r.internalNotes = internalNote;
      if (publicNote !== undefined) r.officerNotes = publicNote;
      
      r.timeline.push({
        status,
        note: note || `Status updated to ${status}`,
        timestamp: new Date().toISOString(),
        updatedBy: officerName,
      });

      this.saveReports();
      this.logAction(officerId, officerName, "Staff", "UPDATE_STATUS", `Changed status of ${reportId} to ${status}. Notes: ${note}`, reportId);

      // Create reporter notification
      if (!r.reporter.isAnonymous && r.reporter.email) {
        const user = this.users.find(u => u.email === r.reporter.email);
        if (user) {
          this.createNotification(
            user.id,
            "Case Status Updated",
            `Your report (ID: ${r.id}) status has changed to '${status}'.`,
            r.id
          );
        }
      }

      return r;
    }
    return undefined;
  }

  public assignOfficer(reportId: string, officerId: string, assignedByUserId: string, assignedByName: string): Report | undefined {
    const r = this.getReport(reportId);
    const officer = this.officers.find(o => o.id === officerId);
    if (r && officer) {
      const oldOfficerId = r.assignedOfficerId;
      r.assignedOfficerId = officerId;
      r.updatedAt = new Date().toISOString();
      
      r.timeline.push({
        status: r.status,
        note: `Case assigned to ${officer.name} (${officer.badgeNumber})`,
        timestamp: new Date().toISOString(),
        updatedBy: assignedByName,
      });

      // Recalculate active cases for officers
      this.recalculateOfficerCaseCounts();
      this.saveReports();
      
      this.logAction(
        assignedByUserId, 
        assignedByName, 
        "Staff", 
        "ASSIGN_OFFICER", 
        `Assigned ${officer.name} to report ${reportId}.`, 
        reportId
      );

      // Notify the assigned officer
      this.createNotification(
        officerId,
        "New Case Assigned",
        `You have been assigned to investigate report ${r.id} (${r.category}).`,
        r.id
      );

      return r;
    }
    return undefined;
  }

  public mergeReports(primaryId: string, secondaryIds: string[], officerId: string, officerName: string): boolean {
    const primary = this.getReport(primaryId);
    if (!primary) return false;

    if (!primary.corroboratingReportIds) {
      primary.corroboratingReportIds = [];
    }

    secondaryIds.forEach(id => {
      const secondary = this.getReport(id);
      if (secondary && id !== primaryId) {
        // Add to primary corroborating list
        if (!primary.corroboratingReportIds?.includes(id)) {
          primary.corroboratingReportIds?.push(id);
        }

        // Set secondary status to REJECTED/MERGED with timeline
        secondary.status = ReportStatus.REJECTED;
        secondary.officerNotes = `This report has been merged as a corroborating witness statement into primary case ${primaryId}.`;
        secondary.timeline.push({
          status: ReportStatus.REJECTED,
          note: `Report merged into primary Case ${primaryId} by ${officerName}`,
          timestamp: new Date().toISOString(),
          updatedBy: officerName,
        });

        // Copy over comments and logs if necessary
        primary.comments.push({
          id: `cmt-merged-${id}-${Date.now()}`,
          sender: "System",
          senderName: "Deduplication Engine",
          text: `[Merged Case Info from ${id}]: ${secondary.description}`,
          timestamp: new Date().toISOString(),
          isPrivate: true,
        });
      }
    });

    primary.updatedAt = new Date().toISOString();
    this.saveReports();
    this.logAction(officerId, officerName, "Staff", "MERGE_CASES", `Merged reports ${secondaryIds.join(", ")} into primary case ${primaryId}.`, primaryId);
    return true;
  }

  private recalculateOfficerCaseCounts() {
    this.officers.forEach(o => {
      o.activeCases = this.reports.filter(r => r.assignedOfficerId === o.id && r.status !== ReportStatus.RESOLVED && r.status !== ReportStatus.REJECTED).length;
    });
    this.saveOfficers();
  }

  // Duplicate Check Engine: Find similar reports
  public getSuspectedDuplicates(): { primary: Report; matches: Report[] }[] {
    // A simple offline detector: Groups of reports with same category, in same zone, filed within 24h
    const duplicatesGroup: { [key: string]: Report[] } = {};
    const unmergedReports = this.reports.filter(r => r.status === ReportStatus.SUBMITTED || r.status === ReportStatus.UNDER_REVIEW);

    unmergedReports.forEach(r => {
      // Find possible group key based on category + zone + date
      // Round coordinates to ~0.01 degrees (~1km) to group them
      const coordKey = `${Math.round(r.location.latitude * 100)}_${Math.round(r.location.longitude * 100)}`;
      const key = `${r.category}_${r.location.zone}_${r.date}`;
      if (!duplicatesGroup[key]) {
        duplicatesGroup[key] = [];
      }
      duplicatesGroup[key].push(r);
    });

    const results: { primary: Report; matches: Report[] }[] = [];
    Object.keys(duplicatesGroup).forEach(key => {
      const group = duplicatesGroup[key];
      if (group.length > 1) {
        // Use earliest report as primary, others as matches
        const sorted = [...group].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const primary = sorted[0];
        const matches = sorted.slice(1);
        results.push({ primary, matches });
      }
    });

    return results;
  }

  private triggerDuplicateCheckAndNotify(newReport: Report) {
    const proximityMatches = this.reports.filter(r => 
      r.id !== newReport.id &&
      r.status !== ReportStatus.REJECTED &&
      r.status !== ReportStatus.RESOLVED &&
      r.category === newReport.category &&
      r.location.zone === newReport.location.zone &&
      r.date === newReport.date
    );

    if (proximityMatches.length > 0) {
      // Notify staff about potential duplicates
      this.createNotification(
        "all-staff",
        "Similar Report Flagged",
        `New report ${newReport.id} is highly similar to existing case ${proximityMatches[0].id} in ${newReport.location.zone}. Review duplicates.`,
        newReport.id
      );
    }
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.settings;
  }

  public updateSettings(settings: SystemSettings): void {
    this.settings = settings;
    this.saveSettings();
  }

  // User auth simulation
  public getUsers(): User[] { return this.users; }
  public getOfficers(): Officer[] { return this.officers; }

  public registerUser(user: User): User {
    this.users.push(user);
    this.saveUsers();
    this.logAction(user.id, user.fullName, "Citizen", "USER_REGISTER", `User registered with email ${user.email}`);
    return user;
  }

  public addOfficer(officer: Officer): Officer {
    this.officers.push(officer);
    this.saveOfficers();
    this.logAction("ADMIN", "System Admin", "Admin", "ADD_OFFICER", `Added new officer account: ${officer.name} (${officer.badgeNumber})`);
    return officer;
  }

  public deleteOfficer(id: string) {
    this.officers = this.officers.filter(o => o.id !== id);
    this.saveOfficers();
    this.logAction("ADMIN", "System Admin", "Admin", "DELETE_OFFICER", `Deleted officer account with ID: ${id}`);
  }

  // Logging API
  public getLogs(): AuditLog[] {
    return this.logs;
  }

  public logAction(userId: string, userName: string, role: string, action: string, details: string, caseId?: string) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole: role,
      action,
      details,
      caseId,
    };
    this.logs.unshift(newLog);
    this.saveLogs();
  }

  // Notification API
  public getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId || n.userId === "all-staff");
  }

  public createNotification(userId: string, title: string, message: string, caseId?: string) {
    const newNotification: Notification = {
      id: `not-${Date.now()}`,
      userId,
      title,
      message,
      caseId,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    this.notifications.unshift(newNotification);
    this.saveNotifications();
  }

  public markNotificationsAsRead(userId: string) {
    this.notifications.forEach(n => {
      if (n.userId === userId || (userId === "all-staff" && n.userId === "all-staff")) {
        n.isRead = true;
      }
    });
    this.saveNotifications();
  }
}

export const dbInstance = new MockDatabase();
