import React, { useState } from "react";
import { 
  ShieldAlert, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Search, 
  MessageSquare, 
  ArrowRight, 
  Lock, 
  UserPlus, 
  Mail, 
  Phone, 
  User, 
  Eye, 
  EyeOff, 
  HelpCircle,
  FileSpreadsheet,
  FileCheck2,
  AlertTriangle,
  History,
  Send
} from "lucide-react";
import { dbInstance } from "../utils/mockData";
import { ReportStatus, CrimeCategory, Report } from "../types";

interface PublicPagesProps {
  currentSubView: string;
  setView: (view: string, subView?: string) => void;
  onLoginSuccess: (user: any) => void;
  reportsList: Report[];
  onAddCommentToCase: (caseId: string, commentText: string, senderName: string) => void;
}

export default function PublicPages({
  currentSubView,
  setView,
  onLoginSuccess,
  reportsList,
  onAddCommentToCase
}: PublicPagesProps) {
  // Tracking state
  const [trackCaseId, setTrackCaseId] = useState("");
  const [trackContact, setTrackContact] = useState("");
  const [trackedReport, setTrackedReport] = useState<Report | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regConsent, setRegConsent] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Active auth tab state ("login" | "register")
  const [activeAuthTab, setActiveAuthTab] = useState<"login" | "register">(
    currentSubView === "register" ? "register" : "login"
  );

  React.useEffect(() => {
    if (currentSubView === "register") {
      setActiveAuthTab("register");
    } else if (currentSubView === "login") {
      setActiveAuthTab("login");
    }
  }, [currentSubView]);

  // Compute live statistics for statistics widget
  const totalReports = reportsList.length;
  const resolvedReports = reportsList.filter(r => r.status === ReportStatus.RESOLVED).length;
  const underReviewReports = reportsList.filter(r => r.status === ReportStatus.UNDER_REVIEW || r.status === ReportStatus.INVESTIGATING).length;
  
  const categoryStats = reportsList.reduce((acc: { [key: string]: number }, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.keys(categoryStats).length > 0 
    ? Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0][0]
    : "None";

  // Handle Tracking Search
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");
    setTrackedReport(null);

    if (!trackCaseId.trim()) {
      setTrackingError("Please enter a valid Case Reference ID.");
      return;
    }

    const report = dbInstance.getReport(trackCaseId.trim());
    if (!report) {
      setTrackingError("No incident report found with this Reference ID. Please check and try again.");
      return;
    }

    // Verify contact email or phone matches if case is not anonymous
    if (!report.reporter.isAnonymous) {
      const emailMatch = report.reporter.email?.toLowerCase() === trackContact.trim().toLowerCase();
      const phoneMatch = report.reporter.phone?.replace(/\D/g, '') === trackContact.trim().replace(/\D/g, '');
      
      if (trackContact.trim() && !emailMatch && !phoneMatch) {
        setTrackingError("Verification failed. The contact email/phone does not match the reporter's records.");
        return;
      }
    }

    setTrackedReport(report);
  };

  // Handle Citizen Add Comment to Tracked Case
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !trackedReport) return;

    onAddCommentToCase(
      trackedReport.id,
      newCommentText,
      trackedReport.reporter.isAnonymous ? "Anonymous Citizen" : (trackedReport.reporter.fullName || "Reporter")
    );
    
    // Refresh tracked report
    const updated = dbInstance.getReport(trackedReport.id);
    if (updated) setTrackedReport(updated);

    setNewCommentText("");
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please fill in all credentials.");
      return;
    }

    // Check custom staff login emails
    const registeredUsers = dbInstance.getUsers();
    const user = registeredUsers.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    
    if (user) {
      // Demo password check - allow any for ease of testing or 'password'
      onLoginSuccess(user);
    } else {
      // Fallback check against officers
      const officers = dbInstance.getOfficers();
      const officer = officers.find(o => o.email.toLowerCase() === loginEmail.trim().toLowerCase());
      if (officer) {
        // Build staff session user
        onLoginSuccess({
          id: officer.id,
          email: officer.email,
          fullName: officer.name,
          role: officer.role, // Officer, Supervisor, Admin
          badgeNumber: officer.badgeNumber,
          zone: officer.zone
        });
      } else {
        setLoginError("Invalid email or password. Feel free to use citizen@civic.com, officer@police.gov, or admin@police.gov to test!");
      }
    }
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      setRegError("Please fill in all fields.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }

    if (!regConsent) {
      setRegError("You must agree to the Terms of Use & Privacy Consent.");
      return;
    }

    // Check if email already exists
    const users = dbInstance.getUsers();
    if (users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setRegError("An account with this email already exists.");
      return;
    }

    const newUser = dbInstance.registerUser({
      id: `usr-${Date.now()}`,
      fullName: regName,
      email: regEmail,
      phone: regPhone,
      role: "Citizen",
      createdAt: new Date().toISOString()
    });

    setRegSuccess("Registration completed successfully! You can now log in below.");
    // Auto populate login fields
    setLoginEmail(regEmail);
    // Reset fields
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegConsent(false);
    
    // Switch to login tab smoothly
    setTimeout(() => {
      setActiveAuthTab("login");
      const el = document.getElementById("login-tab-head");
      if (el) el.click();
    }, 1500);
  };

  // Handle Contact Submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitted(true);
    // Log as system action for audit logs
    dbInstance.logAction("GUEST", contactName, "Guest", "CONTACT_FORM_SUBMIT", `Guest sent contact inquiry: ${contactMessage.slice(0, 60)}...`);
  };

  // Render Status Timeline Steps
  const renderStatusProgress = (status: ReportStatus) => {
    const statuses = [
      { name: ReportStatus.SUBMITTED, label: "Submitted", desc: "Report received" },
      { name: ReportStatus.UNDER_REVIEW, label: "Under Review", desc: "Verifying details" },
      { name: ReportStatus.INVESTIGATING, label: "Investigating", desc: "Active investigation" },
      { name: ReportStatus.RESOLVED, label: "Resolved", desc: "Case closed" }
    ];

    let activeIndex = 0;
    if (status === ReportStatus.UNDER_REVIEW) activeIndex = 1;
    if (status === ReportStatus.INVESTIGATING) activeIndex = 2;
    if (status === ReportStatus.RESOLVED) activeIndex = 3;
    if (status === ReportStatus.REJECTED) activeIndex = -1; // special handling

    if (status === ReportStatus.REJECTED) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Report Marked as Rejected or Duplicate</h4>
            <p className="text-xs text-red-700 mt-0.5">
              This case reference has been closed by administrative officers. It may have been flagged as a duplicate report or determined to be false/unfounded.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 md:gap-0 my-6">
        {/* Progress Line */}
        <div className="absolute top-[18px] left-4 md:left-[10%] right-[10%] h-0.5 bg-slate-200 hidden md:block" />
        <div 
          className="absolute top-[18px] left-[10%] h-0.5 bg-indigo-600 transition-all duration-500 hidden md:block"
          style={{ width: `${(activeIndex / 3) * 80}%` }}
        />

        {statuses.map((step, idx) => {
          const isCompleted = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.name} className="flex md:flex-col items-center gap-3 md:gap-2 z-10 w-full md:w-[25%] text-left md:text-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all ${
                  isCompleted 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : "bg-white border-slate-300 text-slate-400"
                } ${isCurrent ? "ring-4 ring-indigo-100" : ""}`}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-500">{step.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col">
      {/* SECTION 1: Landing / Home Page */}
      {currentSubView === "landing" && (
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl px-6 py-12 md:py-16 md:px-12 shadow-xl flex flex-col md:flex-row items-center gap-8 border border-slate-800">
            {/* Background grids */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle, #4f46e5 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px"
            }} />
            
            <div className="space-y-6 max-w-2xl z-10">
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/30 font-semibold tracking-wide">
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                METRO METROPOLITAN DIVISION
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Secure & Trusted <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400">
                  Crime Reporting Portal
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
                Empowering citizens with instant online incident loggers, exact spatial localization, 
                and dynamic case tracking. Build community trust, stay anonymous if you choose, 
                and support public safety.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => setView("report_crime")}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                  id="cta-report-crime-btn"
                >
                  <FileCheck2 className="w-5 h-5" />
                  Report a Crime Now
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("public", "track_report")}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-200 flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Track Existing Case
                </button>
              </div>
            </div>

            {/* Quick Stats Summary widget on Hero */}
            <div className="w-full md:w-80 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm z-10 space-y-4">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                Live Division Data
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Filed Reports</span>
                  <span className="text-xl font-extrabold text-white">{totalReports}</span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Resolved</span>
                  <span className="text-xl font-extrabold text-emerald-400">{resolvedReports}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Under Review/Investigating:</span>
                  <span className="font-bold text-amber-400">{underReviewReports}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Most Frequent:</span>
                  <span className="font-bold text-indigo-300">{topCategory}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Notice Banner */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Emergency Alert: Immediate Danger Warning</h4>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                This digital system is designed solely for standard logging, evidence records, and administrative tracking of reports. 
                It is <strong className="font-bold underline">not monitored in real-time</strong>. If you are experiencing a crime in progress, 
                witnessing a crime in action, or are in immediate physical danger, <strong className="font-bold">please call 911 (or your local police emergency hotline)</strong> immediately.
              </p>
            </div>
          </div>

          {/* How It Works (Visual Explainer) */}
          <section className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">How the Platform Works</h2>
              <p className="text-sm text-slate-500 font-medium">
                Submit details in 4 simple steps to record evidence and support our investigation team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  icon: <FileText className="w-6 h-6 text-indigo-600" />,
                  title: "Log Incident Data",
                  desc: "Select the incident category, describe what happened, and note the date/time of occurrence."
                },
                {
                  step: "02",
                  icon: <MapPin className="w-6 h-6 text-emerald-600" />,
                  title: "Mark Location Pin",
                  desc: "Use our interactive grid map to drop a coordinate pin indicating exactly where the crime occurred."
                },
                {
                  step: "03",
                  icon: <ShieldAlert className="w-6 h-6 text-amber-600" />,
                  title: "Add Evidence Details",
                  desc: "Securely upload porch recordings, screenshot files, document logs, or scene photos."
                },
                {
                  step: "04",
                  icon: <CheckCircle className="w-6 h-6 text-sky-600" />,
                  title: "Receive Tracking ID",
                  desc: "Generate an encrypted Case reference number to check investigations and submit updates."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 relative hover:shadow-md transition duration-300">
                  <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 font-mono select-none">
                    {item.step}
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl w-fit border border-slate-100 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* About Quick Cards */}
          <section className="bg-slate-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200">
            <div className="space-y-2 max-w-xl">
              <h3 className="text-lg font-bold text-slate-900">Your Data Security & Confidentiality</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Your report information is completely safe with us. Citizens can choose to submit logs anonymously. 
                Any details submitted are fully encrypted, protected under security regulations, and directly routed 
                to verified precinct officers.
              </p>
            </div>
            <button
              onClick={() => setView("public", "about")}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs shrink-0 transition shadow-xs cursor-pointer"
            >
              Read Data Privacy Policy
            </button>
          </section>
        </div>
      )}

      {/* SECTION 2: About Page */}
      {currentSubView === "about" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">About CivicShield Crime Portal</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            CivicShield is the primary civilian incident reporting software operated by the Metro heights Public Safety Division. 
            This portal was initiated to support transparency, visual-spatial analytics, and to provide citizens with a seamless 
            pipeline to submit records without requiring physical precinct visits.
          </p>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Who Operates this System?</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              This system is maintained by the Metro safety staff, localized officers, and supervisors of Metro Heights. 
              The server logs are securely audited to maintain procedural integrity and prevent database corruption or unauthorized data lookups.
            </p>

            <h3 className="font-bold text-slate-900 text-base">How is Citizen Data Handled?</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              CivicShield offers direct support for full anonymity. If a reporter ticks "Report Anonymously", 
              their physical name, contact phone, or emails are completely omitted from the database record. 
              Only spatial parameters (location pins), incident category, time, description, and logs are saved. 
              This ensures citizens can help flag crime activity in their neighborhoods without fear of retaliation.
            </p>
          </div>
          
          <button
            onClick={() => setView("public", "landing")}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* SECTION 3: Login / Register Page */}
      {(currentSubView === "login" || currentSubView === "register") && (
        <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg">
          {/* Form Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => {
                setLoginError("");
                setActiveAuthTab("login");
              }}
              id="login-tab-head"
              className={`w-1/2 py-4 font-bold text-sm transition cursor-pointer text-center ${
                activeAuthTab === "login"
                  ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold"
                  : "text-slate-400 hover:text-slate-600 font-semibold"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setRegError("");
                setActiveAuthTab("register");
              }}
              id="register-tab-head"
              className={`w-1/2 py-4 font-bold text-sm transition cursor-pointer text-center ${
                activeAuthTab === "register"
                  ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold"
                  : "text-slate-400 hover:text-slate-600 font-semibold"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* LOGIN FORM */}
            <div id="login-tab" className={`${activeAuthTab === "login" ? "" : "hidden"} space-y-6`}>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Welcome to CivicShield</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Log in to track your reported cases, file reports easily, and update your profile settings.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Email Address / Username</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. citizen@civic.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 block">Password</label>
                    <button
                      type="button"
                      onClick={() => setView("public", "forgot_password")}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-xs transition cursor-pointer"
                >
                  Sign In
                </button>
              </form>

              {/* Citizen Test logins helpers */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Demo Login Credentials</span>
                <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>Citizen: <strong className="font-semibold text-indigo-600">citizen@civic.com</strong></span>
                    <span>pw: any</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Officer: <strong className="font-semibold text-indigo-600">officer@police.gov</strong></span>
                    <span>pw: any</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin/Chief: <strong className="font-semibold text-indigo-600">admin@police.gov</strong></span>
                    <span>pw: any</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <button
                  onClick={() => setView("report_crime")}
                  className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Continue as Guest / Anonymous Reporter
                </button>
              </div>
            </div>

            {/* REGISTER FORM */}
            <div id="register-tab" className={`${activeAuthTab === "register" ? "" : "hidden"} space-y-6`}>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Create Citizen Account</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Registration is optional. Having an account allows you to securely track all report updates and submit logs with pre-filled detail updates.
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">
                  {regSuccess}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="johndoe@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="555-123-4567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="regConsent"
                    checked={regConsent}
                    onChange={(e) => setRegConsent(e.target.checked)}
                    className="mt-1 accent-indigo-600"
                  />
                  <label htmlFor="regConsent" className="text-[11px] text-slate-500 leading-normal font-semibold">
                    I agree to the CivicShield terms. I certify that all logged crime info I provide represents true events and understand false reporting carries full legal liabilities.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-xs transition cursor-pointer"
                >
                  Register Account
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Forgot Password Page */}
      {currentSubView === "forgot_password" && (
        <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold text-slate-900">Forgot Your Password?</h3>
            <p className="text-xs text-slate-500 font-medium">
              Enter your registered email address and we'll dispatch a secure recovery token to restore your credential access.
            </p>
          </div>

          {forgotSubmitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl font-semibold leading-relaxed">
                Password recovery dispatch sent! Please check your email inbox for instructions. (Note: Since this is a sandboxed local demo, you can go ahead and reset it directly below).
              </div>
              
              {/* Reset Password Form demo */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50">
                <h4 className="font-bold text-xs text-slate-700">Set New Password</h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-2 bg-white border border-slate-200 rounded text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-2 bg-white border border-slate-200 rounded text-xs" />
                </div>
                <button
                  onClick={() => {
                    setView("public", "login");
                    alert("Demo Password Reset successfully! You can now log in with your updated password.");
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setForgotSubmitted(true); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. citizen@civic.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Send Recovery Instructions
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => setView("public", "login")}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: Track Report Page */}
      {currentSubView === "track_report" && (
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900">Track an Incident Report</h2>
              <p className="text-xs text-slate-500 font-semibold">
                Submit your generated Case reference code (e.g. CR-2026-801) and reporter contact details to look up investigation progress and officer comments.
              </p>
            </div>

            {trackingError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
                {trackingError}
              </div>
            )}

            <form onSubmit={handleTrackSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-slate-700 block">Case Reference ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CR-2026-801"
                  value={trackCaseId}
                  onChange={(e) => setTrackCaseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-hidden focus:border-indigo-600"
                />
              </div>
              
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Contact Email/Phone <span className="text-slate-400 font-medium">(Optional check)</span>
                </label>
                <input
                  type="text"
                  placeholder="johndoe@example.com"
                  value={trackContact}
                  onChange={(e) => setTrackContact(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Search Database
                </button>
              </div>
            </form>
          </div>

          {/* TRACKED CASE DISPLAY */}
          {trackedReport && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
              {/* Title Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-black text-slate-900 uppercase">
                      {trackedReport.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      trackedReport.status === ReportStatus.RESOLVED 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}>
                      {trackedReport.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold flex items-center gap-4 flex-wrap">
                    <span>Category: <strong className="text-slate-800 font-semibold">{trackedReport.category}</strong></span>
                    <span>Reported On: <strong className="text-slate-800 font-semibold">{new Date(trackedReport.createdAt).toLocaleDateString()}</strong></span>
                    <span>Zone: <strong className="text-slate-800 font-semibold">{trackedReport.location.zone}</strong></span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Latest Update</span>
                  <span className="text-xs text-slate-700 font-bold">
                    {new Date(trackedReport.updatedAt).toLocaleDateString()} at {new Date(trackedReport.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Description & Location details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-150 font-medium">
                      {trackedReport.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Incident Time</span>
                      <span className="text-xs text-slate-700 font-bold">{trackedReport.date} at {trackedReport.time}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono">Weapon Involved</span>
                      <span className="text-xs text-slate-700 font-bold">
                        {trackedReport.weaponInvolved ? `Yes (${trackedReport.weaponType})` : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Location details</h3>
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2 text-xs">
                      <p className="font-semibold text-slate-700">{trackedReport.location.address}</p>
                      {trackedReport.location.landmark && (
                        <p className="text-slate-500">
                          Landmark: <span className="italic">{trackedReport.location.landmark}</span>
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-slate-400">
                        Coordinates: {trackedReport.location.latitude.toFixed(4)}, {trackedReport.location.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline Progress Bar */}
              <div className="border-t border-b border-slate-100 py-6">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  Investigation Status Timeline
                </h3>
                {renderStatusProgress(trackedReport.status)}

                {/* Vertical timeline notes history */}
                <div className="space-y-3 mt-4">
                  {trackedReport.timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-xs pl-2 border-l border-slate-200">
                      <span className="text-slate-400 shrink-0 font-medium">{new Date(item.timestamp).toLocaleDateString()}</span>
                      <div className="font-medium">
                        <strong className="text-slate-800 font-semibold">{item.status}: </strong>
                        <span className="text-slate-600">{item.note}</span>
                        <span className="text-[10px] text-slate-400 font-normal"> — Updated by {item.updatedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public Officer Notes */}
              {trackedReport.officerNotes && (
                <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-indigo-700" />
                    Official Officer Notes
                  </h4>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {trackedReport.officerNotes}
                  </p>
                </div>
              )}

              {/* Comments pipeline (Interaction) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  Case Message Log / Witness Updates
                </h3>

                {/* Comment list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {trackedReport.comments.filter(c => !c.isPrivate).map((cmt) => (
                    <div 
                      key={cmt.id} 
                      className={`p-3 rounded-xl max-w-[80%] ${
                        cmt.sender === "Officer" 
                          ? "bg-indigo-50 border border-indigo-100 ml-auto" 
                          : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                        <span>{cmt.senderName} ({cmt.sender})</span>
                        <span>{new Date(cmt.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{cmt.text}</p>
                    </div>
                  ))}

                  {trackedReport.comments.filter(c => !c.isPrivate).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4 font-medium">
                      No communications logged. Submit information below if you have more evidence.
                    </p>
                  )}
                </div>

                {/* Add more info form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Provide additional witness statements, plate details, or questions..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
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
          )}
        </div>
      )}

      {/* SECTION 6: Contact / Support Page */}
      {currentSubView === "contact" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900">Contact Administrative Support</h2>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              If you have suggestions, technical questions regarding data files, or require physical precinct lookup help, submit our ticket form.
            </p>

            {contactSubmitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold leading-relaxed">
                Thank you! Your inquiry has been safely logged in our admin support tickets. A technical analyst will reach out via the provided email.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Jones"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="david@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Message Details</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your general inquiry or suggestions..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Submit Inquiry Ticket
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Emergency Hotlines</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                If in physical danger, immediately call emergency numbers instead of logging online.
              </p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                  <span className="text-red-700">Police Emergency</span>
                  <span className="font-bold text-slate-900">911</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                  <span className="text-slate-600">Non-Emergency Line</span>
                  <span className="font-bold text-slate-900">311</span>
                </div>
                <div className="flex justify-between items-center py-1.5 font-semibold">
                  <span className="text-slate-600">Cyber Crime Desk</span>
                  <span className="font-bold text-slate-900">555-019-9900</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {[
                  { q: "Is anonymous reporting safe?", a: "Yes, your contact cookies or browser details are omitted." },
                  { q: "Can I log media files?", a: "Step 4 of reporting allows uploads up to 10MB." },
                  { q: "How long does a review take?", a: "Officers usually assign cases within 24 hours." }
                ].map((faq, idx) => (
                  <div key={idx} className="space-y-1 text-xs font-medium">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      {faq.q}
                    </h4>
                    <p className="text-slate-500 pl-4">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Privacy Policy Page */}
      {currentSubView === "privacy" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900">Data Privacy Policy</h2>
          <div className="text-xs text-slate-600 space-y-4 leading-relaxed font-medium">
            <p>
              This policy describes how files, location nodes, coordinates, and logs submitted to CivicShield are handled.
            </p>
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">1. Spatial Information Policy</h3>
            <p>
              Your dropped pin latitude and longitude details are utilized exclusively to calculate local crime hotspots 
              for patrol assignments. They are not shared with commercial mapping companies or advertising databases.
            </p>
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">2. Uploaded Media Protection</h3>
            <p>
               porche camera video clips, image evidence, and logs files uploaded via the Evidence tab are saved in secure 
              local storage filesystems and only accessible by authorized Staff Login badges.
            </p>
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">3. Anonymity Constraints</h3>
            <p>
              If a report is submitted anonymously, we omit name strings, phone decimals, and email paths entirely. No system audit trail log is created tying the report back to your physical device.
            </p>
          </div>
          <button onClick={() => setView("public", "landing")} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer">
            Back to Home
          </button>
        </div>
      )}

      {/* SECTION 8: Terms of Use Page */}
      {currentSubView === "terms" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900">Terms of Use & Code Liabilities</h2>
          <div className="text-xs text-slate-600 space-y-4 leading-relaxed font-medium">
            <p>
              By accessing CivicShield, you declare that all information provided is accurate to the best of your understanding.
            </p>
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">1. False Reporting Penalties</h3>
            <p>
              Filing malicious, fabricated, or mock crime reports on this system is a severe violation of public safety rules 
              and constitutes an indictable offense. Law enforcement reserves the right to identify the IP parameters of false filings 
              to execute full prosecutions.
            </p>
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">2. System Downtime Limitations</h3>
            <p>
              CivicShield represents a digital portal and does not constitute a substitute for instant field police intervention. 
              The Metro Heights division holds no liability for damage resulting from reliance on the platform during emergency events.
            </p>
          </div>
          <button onClick={() => setView("public", "landing")} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer">
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
