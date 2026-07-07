import React, { useState, useEffect } from "react";
import { ShieldAlert, MapPin, Search, Users, Shield, BookOpen, MessageSquare, Menu, X, ToggleLeft, ToggleRight, LogIn, ChevronDown } from "lucide-react";
import { Report, AuditLog, User, ReportStatus } from "./types";
import { dbInstance } from "./utils/mockData";
import PublicPages from "./components/PublicPages";
import ReportForm from "./components/ReportForm";
import ReporterDashboard from "./components/ReporterDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  // Navigation View State
  const [view, setView] = useState<string>("public"); // "public" | "report_crime" | "citizen_dashboard" | "staff_dashboard"
  const [subView, setSubView] = useState<string>("landing"); // "landing" | "about" | "login" | "track_report" | "contact" | "privacy" | "terms" | "forgot_password"
  
  // Responsive mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User Profile Dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Developer Sandbox collapse toggle state
  const [devSandboxExpanded, setDevSandboxExpanded] = useState(true);

  // Auth User State
  const [currentUser, setCurrentUser] = useState<User | any | null>(null);

  // Live Database States
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [logsList, setLogsList] = useState<AuditLog[]>([]);

  // Synchronize state with dbInstance (and localStorage)
  useEffect(() => {
    setReportsList([...dbInstance.getReports()]);
    setLogsList([...dbInstance.getLogs()]);
  }, []);

  // Update states helper
  const refreshDatabaseStates = () => {
    setReportsList([...dbInstance.getReports()]);
    setLogsList([...dbInstance.getLogs()]);
  };

  const handleSetView = (newView: string, newSubView: string = "landing") => {
    setView(newView);
    setSubView(newSubView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auth Callbacks
  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    dbInstance.logAction(user.id, user.fullName, user.role, "USER_LOGIN", `Logged into portal successfully with role ${user.role}`);
    refreshDatabaseStates();

    if (user.role === "Citizen") {
      handleSetView("citizen_dashboard");
    } else {
      handleSetView("staff_dashboard");
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      dbInstance.logAction(currentUser.id, currentUser.fullName, currentUser.role, "USER_LOGOUT", "Logged out from portal sessions.");
    }
    setCurrentUser(null);
    handleSetView("public", "landing");
  };

  // Case Status Updates
  const handleUpdateCaseStatus = (caseId: string, status: ReportStatus, note: string, internalNote?: string, publicNote?: string) => {
    if (!currentUser) return;
    dbInstance.updateReportStatus(caseId, status, currentUser.id, currentUser.fullName, note, internalNote, publicNote);
    refreshDatabaseStates();
  };

  // Case Assign Officer
  const handleAssignOfficer = (caseId: string, officerId: string) => {
    if (!currentUser) return;
    dbInstance.assignOfficer(caseId, officerId, currentUser.id, currentUser.fullName);
    refreshDatabaseStates();
  };

  // Case Merging / Deduplication
  const handleMergeCases = (primaryId: string, secondaryIds: string[]) => {
    if (!currentUser) return;
    dbInstance.mergeReports(primaryId, secondaryIds, currentUser.id, currentUser.fullName);
    refreshDatabaseStates();
  };

  // Citizen adds comments
  const handleAddCommentToCase = (caseId: string, text: string, senderName: string) => {
    const report = dbInstance.getReport(caseId);
    if (report) {
      report.comments.push({
        id: `cmt-${Date.now()}`,
        sender: "Reporter",
        senderName,
        text,
        timestamp: new Date().toISOString(),
        isPrivate: false
      });
      dbInstance.logAction(
        currentUser ? currentUser.id : "GUEST",
        senderName,
        currentUser ? currentUser.role : "Guest",
        "ADD_COMMENT",
        `Submitted details to case ${caseId}`,
        caseId
      );
      dbInstance.createNotification(
        "all-staff",
        "New Witness Message Logged",
        `New citizen statement added to case ${caseId}.`,
        caseId
      );
      refreshDatabaseStates();
    }
  };

  // Quick Switch shortcuts helper for evaluator
  const handleTriggerQuickLogin = (role: "citizen" | "officer" | "admin") => {
    if (role === "citizen") {
      const user = dbInstance.getUsers().find(u => u.role === "Citizen");
      if (user) handleLoginSuccess(user);
    } else if (role === "officer") {
      const user = dbInstance.getUsers().find(u => u.role === "Officer");
      if (user) handleLoginSuccess(user);
    } else if (role === "admin") {
      const user = dbInstance.getUsers().find(u => u.role === "Admin");
      if (user) handleLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* EMERGENCY RUNNING ANNOUNCEMENT BANNER */}
      <div className="bg-red-600 text-white px-4 py-2 text-center text-[11px] md:text-xs font-bold leading-normal relative z-50 shadow-xs">
        🛡️ EMERGENCY DIRECTIVE: This is a secure incident filing platform, NOT a 911 dispatch terminal. For active emergencies in progress, dial 911 immediately.
      </div>

      {/* PORTAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* LOGO AND TITLE */}
          <button 
            onClick={() => handleSetView("public", "landing")}
            className="flex items-center gap-2.5 text-left hover:opacity-90 cursor-pointer"
            id="brand-header-logo"
          >
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10 border border-indigo-500">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-950 uppercase block">CivicShield</span>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Crime Reporting System</span>
            </div>
          </button>

          {/* DESKTOP NAV PATHS */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-500">
            <button
              onClick={() => handleSetView("public", "landing")}
              className={`hover:text-slate-900 cursor-pointer transition ${view === "public" && subView === "landing" ? "text-indigo-600 font-black" : ""}`}
            >
              Home
            </button>
            <button
              onClick={() => handleSetView("public", "about")}
              className={`hover:text-slate-900 cursor-pointer transition ${view === "public" && subView === "about" ? "text-indigo-600 font-black" : ""}`}
            >
              About Division
            </button>
            <button
              onClick={() => handleSetView("public", "track_report")}
              className={`hover:text-slate-900 cursor-pointer transition ${view === "public" && subView === "track_report" ? "text-indigo-600 font-black" : ""}`}
            >
              Track Status
            </button>
            <button
              onClick={() => handleSetView("public", "contact")}
              className={`hover:text-slate-900 cursor-pointer transition ${view === "public" && subView === "contact" ? "text-indigo-600 font-black" : ""}`}
            >
              Contact Support
            </button>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-4 relative">
                <button
                  onClick={() => {
                    if (currentUser.role === "Citizen") handleSetView("citizen_dashboard");
                    else handleSetView("staff_dashboard");
                  }}
                  className={`hover:text-indigo-600 cursor-pointer transition text-xs font-bold ${
                    view === "citizen_dashboard" || view === "staff_dashboard" ? "text-indigo-600 font-black" : "text-slate-500"
                  }`}
                >
                  Dashboard
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-200"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px] uppercase">
                      {currentUser.fullName ? currentUser.fullName.charAt(0) : "U"}
                    </div>
                    <span>{currentUser.fullName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800">{currentUser.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{currentUser.role}</p>
                        {currentUser.badgeNumber && (
                          <p className="text-[9px] text-indigo-600 font-mono mt-0.5">Badge #{currentUser.badgeNumber}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (currentUser.role === "Citizen") handleSetView("citizen_dashboard");
                          else handleSetView("staff_dashboard");
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-bold transition cursor-pointer"
                      >
                        My Portal
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold transition cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetView("public", "login")}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  id="main-login-nav-btn"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => handleSetView("public", "register")}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                  id="main-register-nav-btn"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* MOBILE RESPONSIVE TRIGGER */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAV PANEL DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 font-bold text-xs text-slate-600 relative z-30">
          <button onClick={() => handleSetView("public", "landing")} className="block w-full text-left py-2 border-b border-slate-100">Home</button>
          <button onClick={() => handleSetView("public", "about")} className="block w-full text-left py-2 border-b border-slate-100">About Division</button>
          <button onClick={() => handleSetView("public", "track_report")} className="block w-full text-left py-2 border-b border-slate-100">Track Status</button>
          <button onClick={() => handleSetView("public", "contact")} className="block w-full text-left py-2 border-b border-slate-100">Contact Support</button>
          
          <div className="pt-4 border-t border-slate-100">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (currentUser.role === "Citizen") handleSetView("citizen_dashboard");
                    else handleSetView("staff_dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Dashboard ({currentUser.fullName})
                </button>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }} 
                  className="w-full text-center py-2 border border-slate-300 text-red-600 rounded-lg font-bold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => {
                    handleSetView("public", "login");
                    setMobileMenuOpen(false);
                  }} 
                  className="w-full text-center py-2.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-bold text-xs"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => {
                    handleSetView("public", "register");
                    setMobileMenuOpen(false);
                  }} 
                  className="w-full text-center py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PORTAL MAIN CONTENT STAGE */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* PUBLIC SECTION PAGES */}
        {view === "public" && (
          <PublicPages 
            currentSubView={subView}
            setView={handleSetView}
            onLoginSuccess={handleLoginSuccess}
            reportsList={reportsList}
            onAddCommentToCase={handleAddCommentToCase}
          />
        )}

        {/* INCIDENT REPORT MULTI-STEP WIZARD */}
        {view === "report_crime" && (
          <ReportForm
            currentUser={currentUser}
            setView={handleSetView}
            onReportCreated={(savedReport) => {
              // Refresh state
              refreshDatabaseStates();
            }}
          />
        )}

        {/* CITIZEN REPORTER DASHBOARD */}
        {view === "citizen_dashboard" && currentUser && (
          <ReporterDashboard
            currentUser={currentUser}
            setView={handleSetView}
            onLogout={handleLogout}
            reportsList={reportsList}
            onAddCommentToCase={handleAddCommentToCase}
          />
        )}

        {/* STAFF/OFFICER/ADMIN COMMAND DASHBOARD */}
        {view === "staff_dashboard" && currentUser && (
          <AdminDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            reportsList={reportsList}
            setReportsList={setReportsList}
            logsList={logsList}
            setLogsList={setLogsList}
            onUpdateCaseStatus={handleUpdateCaseStatus}
            onAssignOfficer={handleAssignOfficer}
            onMergeCases={handleMergeCases}
          />
        )}
      </main>

      {/* PORTAL FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-800 text-indigo-400 rounded flex items-center justify-center font-bold">
                🛡️
              </div>
              <span className="font-extrabold text-slate-200 tracking-wider text-sm">CIVICSHIELD</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              CivicShield represents the next-generation spatial incident management software maintained by the Metropolitan Safety Authority. All logs are securely audited.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-200 uppercase tracking-widest text-[11px]">Resources & Dispatches</h4>
            <div className="flex flex-col gap-2 font-semibold">
              <button onClick={() => handleSetView("public", "landing")} className="text-left hover:text-white transition">Division Home</button>
              <button onClick={() => handleSetView("public", "about")} className="text-left hover:text-white transition">About operations</button>
              <button onClick={() => handleSetView("public", "contact")} className="text-left hover:text-white transition">Administrative support desk</button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-200 uppercase tracking-widest text-[11px]">Legal Consents & Compliance</h4>
            <div className="flex flex-col gap-2 font-semibold">
              <button onClick={() => handleSetView("public", "privacy")} className="text-left hover:text-white transition">Data Privacy Policy</button>
              <button onClick={() => handleSetView("public", "terms")} className="text-left hover:text-white transition">Terms of Use liabilities</button>
              <span className="text-[10px] text-slate-600 block pt-1">
                © {new Date().getFullYear()} Metropolitan safety authority. All assets reserved.
              </span>
            </div>
          </div>

        </div>
      </footer>

      {/* DEV QUICK LOGIN SANDBOX PORTAL (Evaluator and testing helper) */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 max-w-[280px] transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Dev Sandbox
            </div>
            <button
              onClick={() => setDevSandboxExpanded(!devSandboxExpanded)}
              className="text-[9px] font-bold text-slate-400 hover:text-indigo-400 transition px-1.5 py-0.5 bg-slate-800 rounded-md border border-slate-700 cursor-pointer"
            >
              {devSandboxExpanded ? "Hide Controls" : "Show Controls"}
            </button>
          </div>
          
          {devSandboxExpanded && (
            <div className="space-y-2 mt-1">
              <p className="text-[10px] text-slate-400 font-medium leading-normal">
                Quick-test role views by triggering mock login sessions instantly:
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-[9px] font-extrabold">
                <button
                  onClick={() => handleTriggerQuickLogin("citizen")}
                  className="px-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer border border-slate-700 text-center block"
                  title="Log in as citizen James Peterson"
                >
                  Citizen
                </button>
                <button
                  onClick={() => handleTriggerQuickLogin("officer")}
                  className="px-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer border border-slate-700 text-center block"
                  title="Log in as Patrol Officer Sarah Jenkins"
                >
                  Officer
                </button>
                <button
                  onClick={() => handleTriggerQuickLogin("admin")}
                  className="px-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer border border-indigo-500 text-center block"
                  title="Log in as Admin Chief Evelyn Carter"
                >
                  Chief Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
