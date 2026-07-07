import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, 
  MapPin, 
  Clock, 
  Search, 
  Settings, 
  Bell, 
  LogOut, 
  CheckCircle, 
  ArrowRight, 
  User, 
  Phone, 
  Mail, 
  Trash2, 
  History, 
  MessageSquare, 
  Send,
  PlusCircle,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from "lucide-react";
import { Report, ReportStatus, Notification, User as UserType } from "../types";
import { dbInstance } from "../utils/mockData";

interface ReporterDashboardProps {
  currentUser: UserType;
  setView: (view: string, subView?: string) => void;
  onLogout: () => void;
  reportsList: Report[];
  onAddCommentToCase: (caseId: string, commentText: string, senderName: string) => void;
}

export default function ReporterDashboard({
  currentUser,
  setView,
  onLogout,
  reportsList,
  onAddCommentToCase
}: ReporterDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "notifications" | "settings">("dashboard");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  // Profile settings state
  const [profileName, setProfileName] = useState(currentUser.fullName);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || "");
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePassword, setProfilePassword] = useState("••••••••");
  
  // Notification toggle states
  const [emailNotify, setEmailNotify] = useState(true);
  const [smsNotify, setSmsNotify] = useState(false);
  
  const [profileSaved, setProfileSaved] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Witness details text
  const [cmtText, setCmtText] = useState("");

  // Filter reports that match this logged in citizen (by email or phone matching)
  const citizenReports = reportsList.filter(r => 
    !r.reporter.isAnonymous && 
    (r.reporter.email?.toLowerCase() === currentUser.email.toLowerCase() || 
     (currentUser.phone && r.reporter.phone === currentUser.phone))
  );

  // Read notifications
  const userNotifications = dbInstance.getNotifications(currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(false);
    
    // Simulate updating user record
    const allUsers = dbInstance.getUsers();
    const u = allUsers.find(usr => usr.id === currentUser.id);
    if (u) {
      u.fullName = profileName;
      u.phone = profilePhone;
      u.email = profileEmail;
      localStorage.setItem("civic_shield_users", JSON.stringify(allUsers));
    }
    
    dbInstance.logAction(currentUser.id, profileName, "Citizen", "UPDATE_PROFILE", "Citizen modified profile settings.");
    setProfileSaved(true);
    setFeedbackMsg("Your account settings have been saved successfully!");
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm("Are you sure you want to permanently delete your CivicShield account? This will log you out immediately and disconnect case emails.");
    if (confirm) {
      // Clean up from database
      const allUsers = dbInstance.getUsers().filter(usr => usr.id !== currentUser.id);
      localStorage.setItem("civic_shield_users", JSON.stringify(allUsers));
      dbInstance.logAction(currentUser.id, currentUser.fullName, "Citizen", "DELETE_ACCOUNT", "Citizen account deleted.");
      onLogout();
    }
  };

  const handleAddWitnessComment = (e: React.FormEvent, reportId: string) => {
    e.preventDefault();
    if (!cmtText.trim()) return;

    onAddCommentToCase(reportId, cmtText.trim(), currentUser.fullName);
    dbInstance.logAction(currentUser.id, currentUser.fullName, "Citizen", "ADD_COMMENT", `Added comment/witness details to case ${reportId}.`, reportId);
    
    setCmtText("");
  };

  const handleMarkNotificationsRead = () => {
    dbInstance.markNotificationsAsRead(currentUser.id);
  };

  const selectedReport = selectedReportId ? reportsList.find(r => r.id === selectedReportId) : null;

  // Form Status Color helper
  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case "Submitted": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Under Review": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Investigating": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Resolved/Closed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Side Navigation Panel */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow">
          <div className="space-y-1">
            <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest block">Citizen Account</span>
            <h3 className="font-black text-sm text-slate-100">{currentUser.fullName}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">{currentUser.email}</p>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-1 text-xs">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedReportId(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition cursor-pointer font-bold ${
                activeTab === "dashboard" && !selectedReportId 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                My Case Reports
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {citizenReports.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("notifications"); handleMarkNotificationsRead(); }}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition cursor-pointer font-bold ${
                activeTab === "notifications" 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("settings"); setSelectedReportId(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer font-bold ${
                activeTab === "settings" 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </button>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <button
              onClick={onLogout}
              className="w-full py-2 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-750 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out Portal
            </button>
          </div>
        </div>

        {/* Action Call Cards */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3.5 shadow-sm">
          <h4 className="font-extrabold text-xs text-indigo-900 uppercase tracking-wider">Need to Report a New Crime?</h4>
          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
            Quickly initialize a new 6-step wizard report. All your logged credentials will be pre-filled to verify identity automatically.
          </p>
          <button
            onClick={() => setView("report_crime")}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
          >
            <PlusCircle className="w-4 h-4" />
            File New Incident Log
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="md:col-span-3 space-y-6">
        {/* REPORT DETAIL VIEW */}
        {selectedReport ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            {/* Detail Navigation head */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <button
                onClick={() => setSelectedReportId(null)}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                ← Back to Dashboard List
              </button>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                Case Log Details
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-mono font-black text-slate-900 uppercase">
                    {selectedReport.id}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-3">
                  <span>Category: <strong className="text-slate-700">{selectedReport.category}</strong></span>
                  <span>Zone: <strong className="text-slate-700">{selectedReport.location.zone}</strong></span>
                </p>
              </div>

              <div className="text-right text-xs text-slate-500">
                <span className="block font-bold">Occurrence Time:</span>
                <span className="font-semibold">{selectedReport.date} at {selectedReport.time}</span>
              </div>
            </div>

            {/* Description card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-2">
              <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Narrative Statement Details</h4>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{selectedReport.description}</p>
            </div>

            {/* Spatial Location details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Location Coordinates</span>
                <p className="font-bold text-slate-800">{selectedReport.location.address}</p>
                {selectedReport.location.landmark && <p className="text-slate-500">Landmark: {selectedReport.location.landmark}</p>}
                <span className="text-[10px] text-slate-400 font-mono">GPS: {selectedReport.location.latitude.toFixed(4)}, {selectedReport.location.longitude.toFixed(4)}</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Incident Parameters</span>
                <p>Weapons: <strong className="text-slate-800">{selectedReport.weaponInvolved ? `Yes (${selectedReport.weaponType})` : "No"}</strong></p>
                <p>Suspects Involved: <strong className="text-slate-800">{selectedReport.personsInvolved || "None Logged"}</strong></p>
              </div>
            </div>

            {/* Attached media evidence files */}
            {selectedReport.evidence.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Logged Evidence Files</span>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.evidence.map((f) => (
                    <span key={f.id} className="inline-flex bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700">
                      📎 {f.name} ({f.size})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4.5 h-4.5 text-slate-400" />
                Administrative Case History
              </h4>
              <div className="space-y-3 pl-2 border-l border-slate-200">
                {selectedReport.timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-4 text-xs">
                    <span className="text-slate-400 font-medium shrink-0">{new Date(item.timestamp).toLocaleDateString()}</span>
                    <div className="font-medium">
                      <strong className="text-slate-800 font-semibold">{item.status}:</strong>{" "}
                      <span className="text-slate-600">{item.note}</span>
                      <span className="text-[10px] text-slate-400 font-normal"> — Update by {item.updatedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Officer Notes */}
            {selectedReport.officerNotes && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1.5">
                <h4 className="font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
                  Official Field Update Note
                </h4>
                <p className="text-xs text-indigo-950 font-semibold leading-relaxed">
                  {selectedReport.officerNotes}
                </p>
              </div>
            )}

            {/* Comments Message Log */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4.5 h-4.5 text-slate-400" />
                Case message history & Witness submissions
              </h4>

              {/* Chat list */}
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {selectedReport.comments.filter(c => !c.isPrivate).map((cmt) => (
                  <div 
                    key={cmt.id} 
                    className={`p-3 rounded-xl max-w-[80%] ${
                      cmt.sender === "Officer" 
                        ? "bg-indigo-50 border border-indigo-100 ml-auto text-right" 
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                      <span>{cmt.senderName}</span>
                      <span>{new Date(cmt.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed text-left">{cmt.text}</p>
                  </div>
                ))}

                {selectedReport.comments.filter(c => !c.isPrivate).length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2 font-medium">
                    No communications logged for this report yet.
                  </p>
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={(e) => handleAddWitnessComment(e, selectedReport.id)} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Provide supplementary suspect details, license plates, or ask a question..."
                  value={cmtText}
                  onChange={(e) => setCmtText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* GENERAL TABS PANELS */
          <div>
            {/* TAB 1: DASHBOARD CASE LIST */}
            {activeTab === "dashboard" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-slate-900">Your Filed Reports</h2>
                    <p className="text-xs text-slate-500 font-medium">Below are the non-anonymous cases registered under your email path.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {citizenReports.map((report) => (
                    <div 
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className="bg-slate-50 hover:bg-slate-100/60 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-black text-slate-950 uppercase">{report.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-800">{report.category}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-normal line-clamp-2 max-w-xl font-medium">
                          {report.description}
                        </p>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-3">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {report.location.zone}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {report.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}

                  {citizenReports.length === 0 && (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900">No Cases Recorded</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
                          You haven't submitted any detailed crime reports. To see cases logged here, make sure to submit without checking Anonymous mode.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: NOTIFICATIONS PANEL */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900">Alerts & System Notifications</h2>
                  <p className="text-xs text-slate-500 font-medium">Track live status movements and case response warnings dispatched to your feed.</p>
                </div>

                <div className="space-y-3">
                  {userNotifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        if (notif.caseId) {
                          setSelectedReportId(notif.caseId);
                        }
                      }}
                      className={`p-4 border rounded-2xl transition cursor-pointer flex gap-3.5 items-start ${
                        notif.isRead 
                          ? "bg-slate-50/50 border-slate-200/85" 
                          : "bg-indigo-50/30 border-indigo-200 text-indigo-950 font-bold shadow-xs"
                      }`}
                    >
                      <Bell className={`w-5 h-5 mt-0.5 shrink-0 ${notif.isRead ? "text-slate-400" : "text-indigo-600 animate-pulse"}`} />
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-4 font-bold text-slate-800">
                          <h4 className="font-bold">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-normal">{new Date(notif.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                        {notif.caseId && (
                          <span className="text-[10px] text-indigo-600 font-bold block mt-1 hover:underline">
                            Open associated case Ref: {notif.caseId} →
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {userNotifications.length === 0 && (
                    <p className="text-xs text-slate-400 py-12 text-center font-medium">
                      No status notifications logged in your citizens feed.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PROFILE SETTINGS */}
            {activeTab === "settings" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900">Account Profile Settings</h2>
                  <p className="text-xs text-slate-500 font-medium">Edit your personal citizen credentials and notification channels.</p>
                </div>

                {profileSaved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                    {feedbackMsg}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Contact Phone</label>
                      <input
                        type="tel"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Account Password</label>
                    <input
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Citizen Alert Dispatch Settings</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-700 block">Dispatch Email alerts</span>
                          <span className="text-[10px] text-slate-500 block font-semibold">Notify when case status shifts or officers comment.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailNotify(!emailNotify)}
                          className="text-slate-600"
                        >
                          {emailNotify ? <ToggleRight className="w-10 h-6 text-indigo-600" /> : <ToggleLeft className="w-10 h-6 text-slate-400" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-700 block">Dispatch Mobile SMS</span>
                          <span className="text-[10px] text-slate-500 block font-semibold">Send dispatch text updates directly to contact phone decimals.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSmsNotify(!smsNotify)}
                          className="text-slate-600"
                        >
                          {smsNotify ? <ToggleRight className="w-10 h-6 text-indigo-600" /> : <ToggleLeft className="w-10 h-6 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Delete Account Permanently
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Save Account details
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
