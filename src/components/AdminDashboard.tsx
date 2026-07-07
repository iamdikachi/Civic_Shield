import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Shield, 
  Map as MapIcon, 
  FileText, 
  Users, 
  Activity, 
  Settings, 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  UserCheck, 
  Merge, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileCheck2,
  Trash2,
  Lock,
  MessageSquare,
  Plus,
  Send,
  UserX,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Heading1
} from "lucide-react";
import { Report, ReportStatus, CrimeCategory, Officer, AuditLog, User, SystemSettings } from "../types";
import { dbInstance } from "../utils/mockData";
import InteractiveMap from "./InteractiveMap";
import { h1 } from "motion/react-m";

interface AdminDashboardProps {
  currentUser: any; // User or Staff
  onLogout: () => void;
  reportsList: Report[];
  setReportsList: React.Dispatch<React.SetStateAction<Report[]>>;
  logsList: AuditLog[];
  setLogsList: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  onUpdateCaseStatus: (caseId: string, status: ReportStatus, note: string, internalNote?: string, publicNote?: string) => void;
  onAssignOfficer: (caseId: string, officerId: string) => void;
  onMergeCases: (primaryId: string, secondaryIds: string[]) => void;
}

export default function AdminDashboard({
  currentUser,
  onLogout,
  reportsList,
  setReportsList,
  logsList,
  setLogsList,
  onUpdateCaseStatus,
  onAssignOfficer,
  onMergeCases
}: AdminDashboardProps) {
  // Staff Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "cases" | "duplicates" | "advanced-search" | "officers" | "logs" | "settings">("overview");
  
  // CASE SELECTION & DETAIL VIEW
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // FILTERS (GLOBAL FOR OVERVIEW AND CASE LIST)
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterZone, setFilterZone] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Map settings
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Duplicate sensitvity settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(dbInstance.getSettings());

  // Officer management states
  const [officersList, setOfficersList] = useState<Officer[]>(dbInstance.getOfficers());
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerRole, setNewOfficerRole] = useState<"Officer" | "Supervisor">("Officer");
  const [newOfficerZone, setNewOfficerZone] = useState("Downtown (North)");
  const [newOfficerBadge, setNewOfficerBadge] = useState("");
  const [newOfficerEmail, setNewOfficerEmail] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");

  // CASE DETAIL OFFICER ACTIONS FORM
  const [detailStatus, setDetailStatus] = useState<ReportStatus | "">("");
  const [detailTimelineNote, setDetailTimelineNote] = useState("");
  const [detailInternalNote, setDetailInternalNote] = useState("");
  const [detailPublicNote, setDetailPublicNote] = useState("");
  const [detailAssigneeId, setDetailAssigneeId] = useState("");
  const [caseCommentText, setCaseCommentText] = useState("");
  const [isCommentPrivate, setIsCommentPrivate] = useState(true);

  // ADVANCED SEARCH STATE
  const [advKeyword, setAdvKeyword] = useState("");
  const [advCaseId, setAdvCaseId] = useState("");
  const [advCategory, setAdvCategory] = useState("All");
  const [advStatus, setAdvStatus] = useState("All");
  const [advZone, setAdvZone] = useState("All");
  const [advWeapon, setAdvWeapon] = useState("All");
  const [advSearchResults, setAdvSearchResults] = useState<Report[]>(reportsList);
  const [advSearched, setAdvSearched] = useState(false);

  const isSupervisorOrAdmin = currentUser.role === "Supervisor" || currentUser.role === "Admin";

  // Filtered reports computed based on quick filters
  const filteredReports = useMemo(() => {
    return reportsList.filter(r => {
      const catMatch = filterCategory === "All" || r.category === filterCategory;
      const statusMatch = filterStatus === "All" || r.status === filterStatus;
      const zoneMatch = filterZone === "All" || r.location.zone === filterZone;
      
      const text = searchQuery.toLowerCase().trim();
      const textMatch = !text || 
        r.id.toLowerCase().includes(text) ||
        r.description.toLowerCase().includes(text) ||
        r.location.address.toLowerCase().includes(text) ||
        (r.reporter.fullName && r.reporter.fullName.toLowerCase().includes(text));

      return catMatch && statusMatch && zoneMatch && textMatch;
    });
  }, [reportsList, filterCategory, filterStatus, filterZone, searchQuery]);

  // Handle Case Update Status
  const handleCaseUpdateStatusSubmit = (e: React.FormEvent, caseId: string) => {
    e.preventDefault();
    if (!detailStatus) return;

    onUpdateCaseStatus(
      caseId,
      detailStatus as ReportStatus,
      detailTimelineNote || `Status updated to ${detailStatus}`,
      detailInternalNote,
      detailPublicNote
    );

    alert(`Case ${caseId} status updated to '${detailStatus}' successfully!`);
    
    // Clear fields
    setDetailTimelineNote("");
  };

  // Handle Case Assignee Change
  const handleCaseAssignSubmit = (e: React.FormEvent, caseId: string) => {
    e.preventDefault();
    if (!detailAssigneeId) return;

    onAssignOfficer(caseId, detailAssigneeId);
    alert(`Case successfully assigned to selected officer.`);
  };

  // Handle Officer Comment Submit
  const handleOfficerCommentSubmit = (e: React.FormEvent, report: Report) => {
    e.preventDefault();
    if (!caseCommentText.trim()) return;

    // Direct mutator since we store in mockDatabase
    const newComment = {
      id: `cmt-off-${Date.now()}`,
      sender: "Officer" as const,
      senderName: currentUser.fullName,
      text: caseCommentText.trim(),
      timestamp: new Date().toISOString(),
      isPrivate: isCommentPrivate
    };

    report.comments.unshift(newComment);
    dbInstance.logAction(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      "ADD_COMMENT",
      `Officer added ${isCommentPrivate ? "private" : "public"} comment on case ${report.id}`,
      report.id
    );

    // Update state to force re-render
    setReportsList([...dbInstance.getReports()]);
    setCaseCommentText("");
  };

  

  // Handle Add Officer
  const handleAddOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName || !newOfficerBadge || !newOfficerEmail) return;

    const newOfficer: Officer = {
      id: `off-${Date.now()}`,
      name: newOfficerName,
      badgeNumber: newOfficerBadge,
      role: newOfficerRole as "Officer" | "Supervisor" | "Admin",
      zone: newOfficerZone,
      activeCases: 0,
      email: newOfficerEmail,
      phone: newOfficerPhone || "555-019-9000",
    };

    const saved = dbInstance.addOfficer(newOfficer);
    setOfficersList([...officersList, saved]);

    // Add user credential for testing too
    dbInstance.registerUser({
      id: `usr-${Date.now()}`,
      email: newOfficerEmail,
      fullName: newOfficerName,
      role: newOfficerRole as "Officer" | "Supervisor" | "Admin",
      badgeNumber: newOfficerBadge,
      zone: newOfficerZone,
      createdAt: new Date().toISOString()
    });

    setNewOfficerName("");
    setNewOfficerBadge("");
    setNewOfficerEmail("");
    setNewOfficerPhone("");

    alert("New Officer logged and assigned to patrol sector safely.");
  };

  // Handle Delete Officer
  const handleDeleteOfficer = (id: string) => {
    if (window.confirm("Are you sure you want to remove this officer profile?")) {
      dbInstance.deleteOfficer(id);
      setOfficersList(officersList.filter(o => o.id !== id));
    }
  };

  // Handle Advanced Search
  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const results = reportsList.filter(r => {
      const keywordMatch = !advKeyword || 
        r.description.toLowerCase().includes(advKeyword.toLowerCase()) ||
        r.location.address.toLowerCase().includes(advKeyword.toLowerCase());
      
      const idMatch = !advCaseId || r.id.toLowerCase().includes(advCaseId.toLowerCase().trim());
      const catMatch = advCategory === "All" || r.category === advCategory;
      const statusMatch = advStatus === "All" || r.status === advStatus;
      const zoneMatch = advZone === "All" || r.location.zone === advZone;
      const weaponMatch = advWeapon === "All" || (advWeapon === "Yes" ? r.weaponInvolved : !r.weaponInvolved);

      return keywordMatch && idMatch && catMatch && statusMatch && zoneMatch && weaponMatch;
    });

    setAdvSearchResults(results);
    setAdvSearched(true);
  };

  // Handle Export CSV simulation
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Case ID,Category,Status,Date,Time,Zone,Address,Weapon Involved,Reporter Anonymity\n";
    
    filteredReports.forEach(r => {
      csvContent += `"${r.id}","${r.category}","${r.status}","${r.date}","${r.time}","${r.location.zone}","${r.location.address.replace(/"/g, '""')}","${r.weaponInvolved ? "Yes" : "No"}","${r.reporter.isAnonymous ? "Anonymous" : "Public"}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `metro_heights_crimes_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Sensitivity Settings save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dbInstance.updateSettings(systemSettings);
    dbInstance.logAction(currentUser.id, currentUser.fullName, currentUser.role, "UPDATE_SETTINGS", "Modified system duplicate detection values.");
    alert("Duplicate sensitivity controls and notification templates updated successfully.");
  };

  // COMPUTE ANALYTICS CHART DATA
  // Chart 1: Category breakdown
  const chartCategoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredReports.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredReports]);

  // Chart 2: Zone density
  const chartZoneData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredReports.forEach(r => {
      counts[r.location.zone] = (counts[r.location.zone] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [filteredReports]);

  // Chart 3: Trends (reports by date)
  const chartTrendData = useMemo(() => {
    const dates: { [key: string]: number } = {};
    // Grab past 7 days dates to pre-fill 0s
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      dates[str] = 0;
    }

    filteredReports.forEach(r => {
      if (dates[r.date] !== undefined) {
        dates[r.date]++;
      } else {
        dates[r.date] = 1;
      }
    });

    return Object.entries(dates)
      .map(([date, count]) => ({ date: date.slice(5), count })) // short dates like 07-06
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredReports]);

  // SYSTEM SUSPECTED DUPLICATES COMPUTATION
  const duplicateGroups = useMemo(() => {
    return dbInstance.getSuspectedDuplicates();
  }, [reportsList]);

  // Stats cards computations
  const totalInQueue = reportsList.length;
  const activeUnassigned = reportsList.filter(r => !r.assignedOfficerId && r.status === ReportStatus.SUBMITTED).length;
  const casesInvestigating = reportsList.filter(r => r.status === ReportStatus.INVESTIGATING).length;
  const casesResolved = reportsList.filter(r => r.status === ReportStatus.RESOLVED).length;

  // Selected case details subcomponents
  const selectedCase = selectedCaseId ? reportsList.find(c => c.id === selectedCaseId) : null;

  // Render Status Badge
  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "Submitted": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Under Review": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Investigating": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Resolved/Closed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Rejected (False/Unfounded)": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* COMMAND CENTER MASTER HEADER */}
      <header className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "16px 16px"
        }} />

        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/30">
            <Shield className="w-3.5 h-3.5" />
            Command Center Staff Session
          </div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            Metro heights Safety Management System
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
              {currentUser.role}
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-semibold">
            Logged in: <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.badgeNumber || "NO-BADGE"}) • Zone Sector: {currentUser.zone || "HQ Sector"}
          </p>
        </div>

        <div className="flex gap-2 shrink-0 z-10">
          <button
            onClick={() => { setSelectedCaseId(null); setActiveTab("overview"); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "overview" && !selectedCaseId ? "bg-indigo-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setSelectedCaseId(null); setActiveTab("cases"); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "cases" && !selectedCaseId ? "bg-indigo-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Cases
          </button>
          <button
            onClick={() => { setSelectedCaseId(null); setActiveTab("duplicates"); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "duplicates" && !selectedCaseId ? "bg-indigo-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Duplicates Review
            {duplicateGroups.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            )}
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-red-950/20 text-red-400 border border-red-950/30 hover:bg-red-900/40 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* QUICK STATS CARD ROW */}
      {!selectedCase && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reports Logged", val: totalInQueue, desc: "Incidents in database", color: "text-slate-900" },
            { label: "Unassigned / New", val: activeUnassigned, desc: "Requires staff assign", color: "text-blue-600 font-extrabold" },
            { label: "Active Investigations", val: casesInvestigating, desc: "Field detectives active", color: "text-indigo-600" },
            { label: "Cases Resolved/Closed", val: casesResolved, desc: "Resolution quota logged", color: "text-emerald-600" }
          ].map((card, idx) => (
            <div key={idx} className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">{card.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black ${card.color}`}>{card.val}</span>
                <span className="text-[10px] text-slate-500 font-medium">cases</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{card.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* TWO PANEL CONTENT: SELECT CASE DETAIL VS TAB DISPLAY */}
      {selectedCase ? (
        /* CASE DETAIL PAGE (OFFICER VIEW) */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
          {/* Header section with status triggers and assignees */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCaseId(null)}
                className="text-xs text-indigo-600 hover:underline font-bold mb-2 block cursor-pointer"
              >
                ← Back to List View
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-mono font-black text-slate-900 uppercase">
                  Case File: {selectedCase.id}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${getStatusBadge(selectedCase.status)}`}>
                  {selectedCase.status}
                </span>
                {selectedCase.corroboratingReportIds && selectedCase.corroboratingReportIds.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    👥 Corroborated by {selectedCase.corroboratingReportIds.length + 1} people
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Reported via: <strong className="text-slate-800">{selectedCase.reporter.isAnonymous ? "🔒 Anonymous Citizen" : `👤 ${selectedCase.reporter.fullName}`}</strong> • Zone Sector: {selectedCase.location.zone}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  const statusNote = prompt("Provide brief notes on resolution reason:");
                  if (statusNote) {
                    onUpdateCaseStatus(selectedCase.id, ReportStatus.RESOLVED, statusNote, "Administrative resolution complete.", statusNote);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                ✓ Resolve Case
              </button>
              <button
                onClick={() => {
                  const rejectNote = prompt("Provide reason for case rejection / archiving:");
                  if (rejectNote) {
                    onUpdateCaseStatus(selectedCase.id, ReportStatus.REJECTED, rejectNote, "Case archived or flagged unfounded.", rejectNote);
                  }
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                ⚠ Archive/Reject
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left panels: Descriptions, evidence, corroboration matching */}
            <div className="md:col-span-2 space-y-6">
              {/* Description and media details */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Citizen Statement</h3>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-150 rounded-xl p-4 font-medium">
                    {selectedCase.description}
                  </p>
                </div>

                {/* Case Parameters */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 text-xs font-medium text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Date & Time Occurred</span>
                    <span className="font-bold text-slate-800">{selectedCase.date} at {selectedCase.time}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Weapon Involved</span>
                    <span className="font-bold text-slate-800">{selectedCase.weaponInvolved ? `Yes (${selectedCase.weaponType})` : "No"}</span>
                  </div>
                </div>

                {/* Spatial Mapping visual aid */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Spatial Location coordinates</h3>
                  <InteractiveMap
                    readOnly={true}
                    activePin={{ latitude: selectedCase.location.latitude, longitude: selectedCase.location.longitude, address: selectedCase.location.address }}
                    heightClass="h-[220px]"
                  />
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1 font-medium text-slate-600">
                    <p className="font-bold text-slate-800">{selectedCase.location.address}</p>
                    {selectedCase.location.landmark && <p>Landmark: <span className="italic">{selectedCase.location.landmark}</span></p>}
                    <p className="font-mono text-[10px] text-slate-400">Coordinates: {selectedCase.location.latitude.toFixed(4)}, {selectedCase.location.longitude.toFixed(4)} ({selectedCase.location.zone})</p>
                  </div>
                </div>

                {/* Evidence section */}
                {selectedCase.evidence.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Corroborating Evidence Attachments</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCase.evidence.map((f) => (
                        <div key={f.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block truncate">{f.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">{f.type} — {f.size}</span>
                          </div>
                          <button className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-semibold text-[10px]">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corroborating merged cases detail */}
                {selectedCase.corroboratingReportIds && selectedCase.corroboratingReportIds.length > 0 && (
                  <div className="space-y-2 border-t border-slate-150 pt-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Merged Corroborating Reports ({selectedCase.corroboratingReportIds.length})</h3>
                    <div className="space-y-2">
                      {selectedCase.corroboratingReportIds.map(id => {
                        const mRep = reportsList.find(r => r.id === id);
                        if (!mRep) return null;
                        return (
                          <div key={id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs space-y-1.5 font-semibold text-slate-700">
                            <div className="flex justify-between items-center text-[10px] text-indigo-950 font-bold">
                              <span>Report ID: {mRep.id}</span>
                              <span>Filer: {mRep.reporter.isAnonymous ? "Anonymous" : mRep.reporter.fullName}</span>
                            </div>
                            <p className="font-medium text-slate-600 italic">"{mRep.description}"</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right panels: Assignment, status changes form, and internal/public comments logs */}
            <div className="space-y-6">
              
              {/* OFFICER ASSIGNMENT CONTROLS */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3.5">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Assign Officer / Patrol Unit</h4>
                
                {selectedCase.assignedOfficerId ? (
                  (() => {
                    const assigned = officersList.find(o => o.id === selectedCase.assignedOfficerId);
                    return (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <div>
                          <p className="text-slate-800 font-bold">{assigned?.name || "Unknown Patrol Unit"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{assigned?.badgeNumber}</p>
                        </div>
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold font-mono uppercase">
                          Sector: {assigned?.zone}
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] rounded font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    No officer assigned to this case file yet.
                  </div>
                )}

                <form onSubmit={(e) => handleCaseAssignSubmit(e, selectedCase.id)} className="space-y-2">
                  <select
                    required
                    value={detailAssigneeId}
                    onChange={(e) => setDetailAssigneeId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-bold"
                  >
                    <option value="">-- Choose Patrol Officer --</option>
                    {officersList.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.badgeNumber}) - Active cases: {o.activeCases}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Assign Officer Profile
                  </button>
                </form>
              </div>

              {/* ACTION: CHANGE STATUS & TIMELINE */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3.5">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Modify Case Status & Logs</h4>
                
                <form onSubmit={(e) => handleCaseUpdateStatusSubmit(e, selectedCase.id)} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">New Status</label>
                    <select
                      required
                      value={detailStatus}
                      onChange={(e) => setDetailStatus(e.target.value as ReportStatus)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-bold"
                    >
                      <option value="">-- Change Status --</option>
                      {Object.values(ReportStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Timeline note (Citizen Visible)</label>
                    <input
                      type="text"
                      placeholder="e.g. Officer dispatched to scene..."
                      value={detailTimelineNote}
                      onChange={(e) => setDetailTimelineNote(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Public Note (Reporter Dashboard Update)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Security logs cleaned, patrols reinforced on Maple St..."
                      value={detailPublicNote}
                      onChange={(e) => setDetailPublicNote(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Internal Staff Notes (Private / Locked)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Suspect operates in Area B gang group..."
                      value={detailInternalNote}
                      onChange={(e) => setDetailInternalNote(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Commit Status changes
                  </button>
                </form>
              </div>

              {/* MESSAGE PIPELINE */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3.5 shadow-xs">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Officer Communications Log</h4>
                
                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                  {selectedCase.comments.map((cmt) => (
                    <div 
                      key={cmt.id} 
                      className={`p-2.5 rounded-lg text-xs space-y-1 ${
                        cmt.sender === "Officer" 
                          ? "bg-slate-50 border border-slate-200" 
                          : "bg-indigo-50/60 border border-indigo-100"
                      }`}
                    >
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>{cmt.senderName} ({cmt.sender})</span>
                        {cmt.isPrivate && (
                          <span className="text-red-500 font-bold uppercase tracking-widest text-[8px] flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Staff Private
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{cmt.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={(e) => handleOfficerCommentSubmit(e, selectedCase)} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter message details..."
                    value={caseCommentText}
                    onChange={(e) => setCaseCommentText(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-hidden"
                  />
                  <div className="flex justify-between items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCommentPrivate}
                        onChange={(e) => setIsCommentPrivate(e.target.checked)}
                        className="accent-indigo-600"
                      />
                      Lock as Private (Staff-only)
                    </label>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-slate-900 text-white font-bold rounded text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Log Message
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* GENERAL TABS SCREENS */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Section Sub Tab heads */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-1.5 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            {[
              { id: "overview", label: "Overview & Analytics" },
              { id: "cases", label: "Case Management List" },
              { id: "duplicates", label: "Suspected Duplicates Queue" },
              { id: "advanced-search", label: "Advanced Search Panel" },
              { id: "officers", label: "Officer Sector Management", hide: !isSupervisorOrAdmin },
              { id: "logs", label: "System Audit Logs", hide: !isSupervisorOrAdmin },
              { id: "settings", label: "Settings & Sensitivity", hide: !isSupervisorOrAdmin }
            ].map(tab => {
              if (tab.hide) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                    activeTab === tab.id 
                      ? "bg-indigo-600 text-white shadow-xs" 
                      : "hover:bg-slate-200/50 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* TAB 1: OVERVIEW & ANALYTICS */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* QUICK FILTERS BAR */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs font-bold text-slate-700">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase">Filter Crime Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="All">All Categories</option>
                      {Object.values(CrimeCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase">Filter Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="All">All Statuses</option>
                      {Object.values(ReportStatus).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase">Filter Area Sector</label>
                    <select
                      value={filterZone}
                      onChange={(e) => setFilterZone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="All">All Zones</option>
                      {systemSettings.zones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase">Text Keyword</label>
                    <input
                      type="text"
                      placeholder="Search ID, desc, address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>

                {/* GRAPHICAL AID COMPASS MAP OVERVIEW & HEATMAP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1">
                        <MapIcon className="w-4 h-4 text-indigo-600" />
                        Incident Spatial mapping Overview
                      </span>
                      <button
                        onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                          heatmapEnabled 
                            ? "bg-red-150 border-red-300 text-red-700 font-extrabold" 
                            : "bg-slate-50 border-slate-300 text-slate-600"
                        }`}
                      >
                        {heatmapEnabled ? "🔥 Heatmap Layer Enabled" : "Layers: Normal Pins"}
                      </button>
                    </div>

                    <InteractiveMap
                      pins={filteredReports.map(r => ({
                        id: r.id,
                        latitude: r.location.latitude,
                        longitude: r.location.longitude,
                        category: r.category,
                        status: r.status,
                        address: r.location.address
                      }))}
                      heatmapMode={heatmapEnabled}
                      readOnly={true}
                      heightClass="h-[360px]"
                      onPinClick={(id) => setSelectedCaseId(id)}
                    />
                  </div>

                  {/* Trends summary block */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Sector Density Breakdown</h3>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 max-h-[380px] overflow-y-auto">
                      {chartZoneData.map((item, idx) => (
                        <div key={idx} className="space-y-1 text-xs font-bold text-slate-700">
                          <div className="flex justify-between">
                            <span>{item.name}</span>
                            <span>{item.count} cases</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full" 
                              style={{ width: `${(item.count / filteredReports.length) * 100 || 0}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {chartZoneData.length === 0 && (
                        <p className="text-slate-400 text-xs italic text-center py-12">No data matching active filters.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* REAL RECHARTS CHARTS FOR IN-DEPTH TREND ANALYSIS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  {/* Category Freq Bar Chart */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Crime Frequency by Category</h4>
                    <div className="h-64">
                      {chartCategoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartCategoryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No category data matching active filter states.</div>
                      )}
                    </div>
                  </div>

                  {/* Time Trend Line Chart */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Crime Log Trend (Past 7 Days)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CASE MANAGEMENT LIST */}
            {activeTab === "cases" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-slate-900">Cases Logs Database</h2>
                    <p className="text-xs text-slate-500 font-medium">Displaying {filteredReports.length} cases matching active navigation filters.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV Records
                    </button>
                  </div>
                </div>

                {/* Table list */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full border-collapse text-left text-xs text-slate-600 bg-white">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                      <tr>
                        <th className="p-4">Case Ref</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date Reported</th>
                        <th className="p-4">Sector</th>
                        <th className="p-4">Officer Assigned</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium">
                      {filteredReports.map((r) => {
                        const assigned = officersList.find(o => o.id === r.assignedOfficerId);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition">
                            <td className="p-4 font-mono font-black text-slate-900 uppercase">{r.id}</td>
                            <td className="p-4">{r.category}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getStatusBadge(r.status)}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-4">{r.date}</td>
                            <td className="p-4 text-slate-500">{r.location.zone}</td>
                            <td className="p-4">
                              {assigned ? (
                                <span className="font-semibold text-slate-800">{assigned.name}</span>
                              ) : (
                                <span className="text-amber-600 font-bold">⚠️ Unassigned</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedCaseId(r.id)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[10px] cursor-pointer"
                              >
                                View File →
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredReports.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                            No logged cases found matching active query filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
              
            {/* TAB 3: DEDUPLICATION / DUPLICATES QUEUE */}
            {activeTab === "duplicates" && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900">Suspected Duplicate Reports (Human-in-the-Loop Detections)</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    The intelligence system flags reports filed in close spatial proximity (same zone/coords) and identical crime categories within a 24-hour window. 
                    Authorized supervisors must review and merge corroborated filings into a single primary case.
                  </p>
                </div>

                <div className="space-y-6">
                  {duplicateGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="border border-indigo-200 bg-indigo-50/15 rounded-2xl p-5 space-y-4">
                      {/* Group Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-indigo-100 pb-3 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] bg-red-600 text-white font-bold uppercase px-2 py-0.5 rounded-full tracking-wider inline-block">
                            Duplicate Group Alert
                          </span>
                          <h4 className="font-bold text-xs text-indigo-950 uppercase">
                            Proximity match in {group.primary.location.zone} ({group.primary.category})
                          </h4>
                        </div>
                        
                        <button
                          onClick={() => {
                            const idsToMerge = group.matches.map(m => m.id);
                            onMergeCases(group.primary.id, idsToMerge);
                            alert(`Merged ${idsToMerge.length} reports successfully into primary case ${group.primary.id}!`);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Merge className="w-4 h-4" />
                          Confirm & Merge all as Corroborating Evidence
                        </button>
                      </div>

                      {/* Display Primary Vs matches comparison side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Primary Report (Earliest) */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-1.5">
                            <span>PRIMARY CASE (EARLIEST LOG)</span>
                            <span className="font-mono text-slate-900 font-black">{group.primary.id}</span>
                          </div>
                          <div className="text-xs font-medium space-y-1 text-slate-700">
                            <p>Filer: <strong className="text-slate-800">{group.primary.reporter.isAnonymous ? "Anonymous" : group.primary.reporter.fullName}</strong></p>
                            <p>Address: <strong className="text-slate-800">{group.primary.location.address}</strong></p>
                            <p className="text-slate-500 italic mt-1 bg-slate-50 p-2.5 border border-slate-150 rounded">"{group.primary.description}"</p>
                          </div>
                        </div>

                        {/* Matching cases */}
                        <div className="space-y-3">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">SUSPECTED CORROBORATING WITNESS COPIES ({group.matches.length})</span>
                          {group.matches.map((match) => (
                            <div key={match.id} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-1">
                                <span>MATCH FILING</span>
                                <span className="font-mono text-slate-900 font-black">{match.id}</span>
                              </div>
                              <p className="text-xs font-medium text-slate-700">Filer: {match.reporter.isAnonymous ? "Anonymous" : match.reporter.fullName} • Address: {match.location.address}</p>
                              <p className="text-xs text-slate-500 font-medium italic">"{match.description}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {duplicateGroups.length === 0 && (
                    <div className="text-center py-12 space-y-2">
                      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Deduplication Queue Empty</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
                        Excellent! No unmerged suspected duplicate or road altercation clusters detected at this time.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ADVANCED SEARCH & RETRIEVAL PANEL */}
            {activeTab === "advanced-search" && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900">Advanced Filter Search & Spatial Lookup</h2>
                  <p className="text-xs text-slate-500 font-medium">Query specific fields including weapons, case IDs, dates, and sector variables to generate PDF/CSV reports.</p>
                </div>

                <form onSubmit={handleAdvancedSearch} className="bg-slate-50 p-5 rounded-2xl border border-slate-150 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Description Keyword</label>
                    <input
                      type="text"
                      placeholder="e.g. gray hoodie, plate, scooter..."
                      value={advKeyword}
                      onChange={(e) => setAdvKeyword(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Case Reference ID</label>
                    <input
                      type="text"
                      placeholder="e.g. CR-2026-801"
                      value={advCaseId}
                      onChange={(e) => setAdvCaseId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Incident Category</label>
                    <select
                      value={advCategory}
                      onChange={(e) => setAdvCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="All">All Categories</option>
                      {Object.values(CrimeCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Case Status</label>
                    <select
                      value={advStatus}
                      onChange={(e) => setAdvStatus(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="All">All Statuses</option>
                      {Object.values(ReportStatus).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Patrol Sector Zone</label>
                    <select
                      value={advZone}
                      onChange={(e) => setAdvZone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="All">All Zones</option>
                      {systemSettings.zones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block">Weapon Involved?</label>
                    <select
                      value={advWeapon}
                      onChange={(e) => setAdvWeapon(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="All">Either</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 pt-2 text-right">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Execute Advanced Queries
                    </button>
                  </div>
                </form>

                {/* Advanced Search results */}
                {advSearched && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest block">Query results: Found {advSearchResults.length} cases</h3>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs bg-white text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                          <tr>
                            <th className="p-3">Case ID</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Zone</th>
                            <th className="p-3">Address</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-semibold">
                          {advSearchResults.map(res => (
                            <tr key={res.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-900 uppercase">{res.id}</td>
                              <td className="p-3">{res.category}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getStatusBadge(res.status)}`}>
                                  {res.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">{res.location.zone}</td>
                              <td className="p-3 text-slate-500 max-w-xs truncate">{res.location.address}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setSelectedCaseId(res.id)}
                                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px]"
                                >
                                  View File
                                </button>
                              </td>
                            </tr>
                          ))}

                          {advSearchResults.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400 italic">No matching records found. Try widening parameters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: OFFICER PATROL SECTOR MANAGEMENT */}
            {activeTab === "officers" && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900">Officer Sector Assignments & Profiles</h2>
                  <p className="text-xs text-slate-500 font-medium">Create staff logins, assign division roles (Officer, Supervisor, Admin) and set patrol zones.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Register/Add staff profile */}
                  <div className="md:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Register Sector Officer</h3>
                    
                    <form onSubmit={handleAddOfficerSubmit} className="space-y-3.5 text-xs font-bold text-slate-700">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Officer Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Inspector John Miller"
                          value={newOfficerName}
                          onChange={(e) => setNewOfficerName(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Badge Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. BADGE-9081"
                          value={newOfficerBadge}
                          onChange={(e) => setNewOfficerBadge(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Division Role</label>
                        <select
                          value={newOfficerRole}
                          onChange={(e) => setNewOfficerRole(e.target.value as any)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        >
                          <option value="Officer">Patrol Officer</option>
                          <option value="Supervisor">Supervisor</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Patrol Sector Zone</label>
                        <select
                          value={newOfficerZone}
                          onChange={(e) => setNewOfficerZone(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        >
                          {systemSettings.zones.map(z => (
                            <option key={z} value={z}>{z}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Government Email</label>
                        <input
                          type="email"
                          required
                          placeholder="j.miller@police.metroheights.gov"
                          value={newOfficerEmail}
                          onChange={(e) => setNewOfficerEmail(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Contact Telephone</label>
                        <input
                          type="tel"
                          placeholder="555-019-9081"
                          value={newOfficerPhone}
                          onChange={(e) => setNewOfficerPhone(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Register Officer Login
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Sector Staff directory */}
                  <div className="md:col-span-2 space-y-3">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Sector Staff Directory ({officersList.length})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {officersList.map((o) => (
                        <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-xs">
                          <div className="space-y-1.5 text-xs font-medium text-slate-600">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">{o.name}</h4>
                                <span className="font-mono text-[10px] text-slate-400 uppercase block">{o.badgeNumber}</span>
                              </div>
                              <span className="text-[9px] bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded font-extrabold border border-indigo-200 font-mono uppercase">
                                {o.role}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <p>Patrol Sector: <strong className="text-slate-800">{o.zone}</strong></p>
                              <p className="truncate">Email: {o.email}</p>
                              <p>Phone: {o.phone}</p>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500 text-[11px]">
                              Active cases: <strong className="text-indigo-600 font-bold">{o.activeCases}</strong>
                            </span>
                            <button
                              onClick={() => handleDeleteOfficer(o.id)}
                              className="text-red-600 hover:text-red-700 text-xs font-bold"
                            >
                              Revoke Badge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SYSTEM AUDIT LOGS */}
            {activeTab === "logs" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900">System Logs & Integrity Trail</h2>
                  <p className="text-xs text-slate-500 font-medium">Frictionless logs recording every status transition, officer assignments, settings shift, and merge triggers for accountability.</p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs bg-white text-slate-600 border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                      <tr>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">User Action</th>
                        <th className="p-4">Staff Member</th>
                        <th className="p-4">Action details</th>
                        <th className="p-4 text-right">Target Case</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-semibold text-[11px]">
                      {logsList.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-4 font-bold text-slate-800 font-mono">{log.action}</td>
                          <td className="p-4">
                            <span>{log.userName}</span>
                            <span className="text-[10px] text-slate-400 block font-normal font-mono">{log.userRole}</span>
                          </td>
                          <td className="p-4 text-slate-500 max-w-sm leading-relaxed">{log.details}</td>
                          <td className="p-4 text-right font-mono font-bold text-indigo-600">
                            {log.caseId ? (
                              <button onClick={() => setSelectedCaseId(log.caseId!)} className="hover:underline font-mono uppercase">
                                {log.caseId}
                              </button>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 7: SETTINGS & DEDUP CONFIG */}
            {activeTab === "settings" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900">Administrative Settings & Detection Sliders</h2>
                  <p className="text-xs text-slate-500 font-medium">Control the automated duplicate report trigger thresholds, add categories, and modify citizens SMS alert templates.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl text-xs font-bold text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Deduplication Spatial Radius (Meters)</label>
                      <input
                        type="number"
                        required
                        value={systemSettings.duplicateRadiusMeters}
                        onChange={(e) => setSystemSettings({ ...systemSettings, duplicateRadiusMeters: parseInt(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                      />
                      <span className="text-[10px] text-slate-400 font-medium font-semibold block">Maximum spatial coordinates deviation to cluster cases together.</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Deduplication Time Window (Hours)</label>
                      <input
                        type="number"
                        required
                        value={systemSettings.duplicateTimeWindowHours}
                        onChange={(e) => setSystemSettings({ ...systemSettings, duplicateTimeWindowHours: parseInt(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                      />
                      <span className="text-[10px] text-slate-400 font-medium font-semibold block">Max date-time filing gap allowed to link witness reports.</span>
                    </div>
                  </div>

                  {/* Notification templates */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Citizens Status Update Dispatch Templates</h3>
                    
                    <div className="space-y-3">
                      {Object.values(ReportStatus).map(st => (
                        <div key={st} className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-mono block uppercase">Status: {st}</label>
                          <textarea
                            rows={2}
                            required
                            value={systemSettings.notificationTemplates[st] || ""}
                            onChange={(e) => {
                              const newTemplates = { ...systemSettings.notificationTemplates, [st]: e.target.value };
                              setSystemSettings({ ...systemSettings, notificationTemplates: newTemplates });
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 text-right">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer"
                    >
                      Save System Configurations
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
