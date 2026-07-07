import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, 
  MapPin, 
  FileText, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Info,
  Check,
  Clipboard,
  Search
} from "lucide-react";
import InteractiveMap from "./InteractiveMap";
import { CrimeCategory, Report, ReportStatus, EvidenceFile, LocationData } from "../types";
import { dbInstance } from "../utils/mockData";

interface ReportFormProps {
  currentUser: any;
  setView: (view: string, subView?: string) => void;
  onReportCreated: (report: Report) => void;
}

export default function ReportForm({
  currentUser,
  setView,
  onReportCreated
}: ReportFormProps) {
  const [step, setStep] = useState(1);

  // Form Fields State
  // Step 1: Crime Category
  const [category, setCategory] = useState<CrimeCategory | "">("");
  const [otherCategoryDetails, setOtherCategoryDetails] = useState("");

  // Step 2: Incident Details
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [personsInvolved, setPersonsInvolved] = useState<number | undefined>(undefined);
  const [weaponInvolved, setWeaponInvolved] = useState<boolean>(false);
  const [weaponType, setWeaponType] = useState("");

  // Step 3: Location Graphical Aid
  const [latitude, setLatitude] = useState(40.7150);
  const [longitude, setLongitude] = useState(-74.0080);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [zone, setZone] = useState("Downtown (North)");

  // Step 4: Evidence files
  const [evidenceList, setEvidenceList] = useState<EvidenceFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Step 5: Reporter Info
  const [isAnonymous, setIsAnonymous] = useState(currentUser ? false : true);
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [hasConsent, setHasConsent] = useState(false);

  // Submission Status
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Help calculate zone from lat/lng
  const getZoneFromCoords = (lat: number, lng: number): string => {
    if (lat > 40.7200) {
      if (lng < -74.0050) return "Suburban North";
      return "Downtown (North)";
    } else {
      if (lng < -74.0100) return "Residential West";
      if (lng > -73.9980) return "Industrial East";
      return "Downtown (South)";
    }
  };

  // Step 3 Map Pin Drop handler
  const handleMapPinDrop = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setZone(getZoneFromCoords(lat, lng));
  };

  // Mock Evidence Upload Simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    addSimulatedFiles(files);
  };

  const addSimulatedFiles = (files: File[]) => {
    const newEvs: EvidenceFile[] = files.map(f => {
      const type = f.type.startsWith("image/") 
        ? "image" 
        : f.type.startsWith("video/") 
          ? "video" 
          : f.type.startsWith("audio/") 
            ? "audio" 
            : "document";
      
      return {
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: f.name,
        type,
        url: "#",
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`
      };
    });
    setEvidenceList([...evidenceList, ...newEvs]);
  };

  const removeEvidence = (id: string) => {
    setEvidenceList(evidenceList.filter(e => e.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files) as File[];
      addSimulatedFiles(files);
    }
  };

  // Validator helpers for wizard steps
  const canGoNext = () => {
    if (step === 1) return category !== "";
    if (step === 2) return date !== "" && time !== "" && description.trim().length > 10;
    if (step === 3) return address.trim() !== "";
    if (step === 5) {
      if (!hasConsent) return false;
      if (!isAnonymous) {
        return fullName.trim() !== "" && phone.trim() !== "" && email.trim() !== "";
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (canGoNext()) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Handle Submit Report to Database
  const handleSubmitReport = () => {
    const caseRef = `CR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newReport: Report = {
      id: caseRef,
      category: category as CrimeCategory,
      otherCategoryDetails: category === CrimeCategory.OTHER ? otherCategoryDetails : undefined,
      date,
      time,
      description,
      personsInvolved,
      weaponInvolved,
      weaponType: weaponInvolved ? weaponType : undefined,
      location: {
        latitude,
        longitude,
        address,
        landmark,
        zone
      },
      evidence: evidenceList,
      reporter: {
        isAnonymous,
        fullName: isAnonymous ? undefined : fullName,
        phone: isAnonymous ? undefined : phone,
        email: isAnonymous ? undefined : email,
        hasConsent
      },
      status: ReportStatus.SUBMITTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: ReportStatus.SUBMITTED,
          note: isAnonymous ? "Anonymous crime report logged safely into system." : `Crime report logged safely by citizen ${fullName}.`,
          timestamp: new Date().toISOString(),
          updatedBy: isAnonymous ? "Anonymous" : fullName
        }
      ],
      comments: []
    };

    const saved = dbInstance.addReport(newReport);
    setSubmittedReport(saved);
    onReportCreated(saved);
  };

  const copyToClipboard = () => {
    if (!submittedReport) return;
    navigator.clipboard.writeText(submittedReport.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Render Category Select Cards
  const categoriesList = Object.values(CrimeCategory);

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* SUCCESS CONFIRMATION SCREEN */}
      {submittedReport ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-12 shadow-xl text-center space-y-8"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <Check className="w-10 h-10 text-emerald-600 stroke-[3]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Report Submitted Successfully!</h1>
            <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">
              Thank you. Your incident details and visual evidence logs have been securely filed into Metro Heights digital records database. 
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto space-y-4 shadow-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Your Case Reference ID</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-2xl font-mono font-black text-indigo-900 select-all uppercase">
                  {submittedReport.id}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-3 text-left text-xs text-slate-500 space-y-1 font-medium">
              <div className="flex justify-between">
                <span>Incident Type:</span>
                <span className="font-semibold text-slate-700">{submittedReport.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Occurrence Zone:</span>
                <span className="font-semibold text-slate-700">{submittedReport.location.zone}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Mode:</span>
                <span className={`font-semibold ${submittedReport.reporter.isAnonymous ? "text-amber-600" : "text-slate-700"}`}>
                  {submittedReport.reporter.isAnonymous ? "🔒 Anonymous Filing" : "👤 Detailed reporter"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-4 rounded-xl max-w-xl mx-auto leading-relaxed text-left font-semibold">
            <Info className="w-4.5 h-4.5 text-amber-600 float-left mr-2.5 mt-0.5" />
            <p>
              Please copy and print or screenshot your Case Reference ID. Having this ID is the <strong className="underline">only method</strong> to track investigation notes, respond to officer inquiries, or add more evidence logs if you submitted anonymously.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              onClick={() => setView("public", "landing")}
              className="px-6 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Return to Homepage
            </button>
            <button
              onClick={() => {
                // Pre-fill track page inputs
                setView("public", "track_report");
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Track This Case Status
            </button>
          </div>
        </motion.div>
      ) : (
        /* MULTI-STEP REPORTING WIZARD */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg">
          {/* Form Header with steps progress indicator */}
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                Incident Incident Logger wizard
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Please complete all fields carefully to log secure witness records.
              </p>
            </div>
            
            {/* Step badges */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div 
                  key={idx} 
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                    idx === step 
                      ? "bg-indigo-600 text-white" 
                      : idx < step 
                        ? "bg-emerald-600 text-white" 
                        : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {idx < step ? "✓" : idx}
                </div>
              ))}
            </div>
          </div>

          {/* Steps Description Bar */}
          <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 text-xs font-bold text-slate-600 flex justify-between items-center">
            <span>
              {step === 1 && "Step 1: Choose Crime Category"}
              {step === 2 && "Step 2: Enter Occurrence Details"}
              {step === 3 && "Step 3: Pinpoint Spatial Location (Interactive Map)"}
              {step === 4 && "Step 4: Attach Porch Camera Video & Files"}
              {step === 5 && "Step 5: Reporter Contact Security details"}
              {step === 6 && "Step 6: Review Draft and Submit Record"}
            </span>
            <span className="font-mono text-[10px] text-slate-400">Step {step}/6</span>
          </div>

          {/* Form Content steps */}
          <div className="p-6 md:p-8 min-h-[380px] flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* STEP 1: CATEGORY */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm">Select Category of Crime</h3>
                    <p className="text-xs text-slate-500 font-medium">Choose the closest matching option for the incident you witnessed or experienced.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-4 border rounded-xl text-left transition relative cursor-pointer ${
                          category === cat 
                            ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-xs" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60 font-semibold"
                        }`}
                      >
                        {category === cat && (
                          <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[9px]">
                            ✓
                          </span>
                        )}
                        <span className="text-xs">{cat}</span>
                      </button>
                    ))}
                  </div>

                  {category === CrimeCategory.OTHER && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1.5 pt-2"
                    >
                      <label className="text-xs font-bold text-slate-700">Please Specify Other Category Details</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Identity masquerading, illegal noise pollution, trespassing etc."
                        value={otherCategoryDetails}
                        onChange={(e) => setOtherCategoryDetails(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600 font-medium"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* STEP 2: INCIDENT DETAILS */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Date of Incident</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Time of Incident</label>
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Incident Description</label>
                    <textarea
                      required
                      rows={5}
                      minLength={10}
                      placeholder="Please provide a comprehensive narrative of the crime. Note the approximate ages, clothing indicators, vehicle plate digits, and path of escape of suspect(s) involved..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600 font-medium leading-relaxed"
                    />
                    <div className="text-[10px] text-slate-400 font-medium text-right flex justify-between">
                      <span>Provide as much detail as possible.</span>
                      <span>{description.length} characters (Min 10)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Number of Suspects/Persons Involved (Optional)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 2"
                        value={personsInvolved || ""}
                        onChange={(e) => setPersonsInvolved(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-700 block">Was a Weapon Involved?</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            checked={weaponInvolved === true}
                            onChange={() => setWeaponInvolved(true)}
                            className="accent-indigo-600"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            checked={weaponInvolved === false}
                            onChange={() => { setWeaponInvolved(false); setWeaponType(""); }}
                            className="accent-indigo-600"
                          />
                          No
                        </label>
                      </div>

                      {weaponInvolved && (
                        <motion.input
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          type="text"
                          placeholder="Specify type of weapon (e.g. hand gun, metal rod)"
                          value={weaponType}
                          onChange={(e) => setWeaponType(e.target.value)}
                          className="w-full px-4 py-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LOCATION MAP GRAPHICAL AID */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm">Incident Spatial Location</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Drop a red pin at the exact intersection, building corner, or block where the crime occurred. 
                    </p>
                  </div>

                  <InteractiveMap
                    onPinDrop={handleMapPinDrop}
                    activePin={{ latitude, longitude, address }}
                    heightClass="h-[320px]"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Occurrence Address (Auto-filled / Backup editable)</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Click on the map above to auto-fill address"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Nearby Landmarks / Detail directions</label>
                      <input
                        type="text"
                        placeholder="e.g. behind the blue brick storage building"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: EVIDENCE FILES UPLOAD */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm">Upload Corroborating Evidence Files</h3>
                    <p className="text-xs text-slate-500 font-medium">Attach scene imagery, porch camera footage, cyber threat logs files, or document PDFs.</p>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      isDragging 
                        ? "border-indigo-500 bg-indigo-50/50" 
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="ev-files"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="ev-files" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-10 h-10 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700 block">Drag & Drop Evidence files here</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">or click to browse your disk folders</span>
                    </label>
                  </div>

                  {/* Upload list preview */}
                  {evidenceList.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Attached Files ({evidenceList.length})</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        {evidenceList.map((file) => (
                          <div key={file.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{file.type} — {file.size}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEvidence(file.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-indigo-900 font-semibold leading-relaxed">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Notice: File format supports common .JPG, .PNG images, .MP4 video, .MP3/WAV audio, or plain .TXT/.PDF documents. Individual file ceiling is 10MB.
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 5: REPORTER CONTACT SECURITY */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-xs">Security Anonymity Mode Toggle</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">Do you want to shield your physical identity from case logs?</p>
                    </div>

                    <div className="flex gap-2 bg-slate-200 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isAnonymous 
                            ? "bg-indigo-600 text-white shadow-xs" 
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Anonymous Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          !isAnonymous 
                            ? "bg-indigo-600 text-white shadow-xs" 
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Provide Details
                      </button>
                    </div>
                  </div>

                  {isAnonymous ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-4 rounded-xl space-y-2 font-semibold"
                    >
                      <h4 className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                        Anonymity Safe Mode Active
                      </h4>
                      <p className="leading-relaxed">
                        No name records, telephone credentials, or emails will be saved to this case. 
                        Your IP logging is safely decoupled. 
                        Note: You must rely entirely on saving the generated Case Reference ID string at the final screen to check status updates. Officers cannot recover your code or query your identity if you lose it!
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 rounded-2xl p-5 space-y-1.5 sm:space-y-0"
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Reporter Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Contact Telephone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            required
                            placeholder="555-123-4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Contact Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            placeholder="johndoe@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Consents and verification warning block */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="form-consent"
                        checked={hasConsent}
                        onChange={(e) => setHasConsent(e.target.checked)}
                        className="mt-1 accent-indigo-600"
                      />
                      <label htmlFor="form-consent" className="text-xs text-slate-600 font-semibold leading-normal cursor-pointer select-none">
                        I certify that all statements logged here represent honest, true information regarding an active event. I agree that Metro Heights can utilize these details to map patrols and review crimes, and understand that malicious false filings carry indictable prosecution liabilities.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: DRAFT REVIEW */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm">Review Your Incident Statement Draft</h3>
                    <p className="text-xs text-slate-500 font-medium">Verify all coordinates, times, and text descriptions before finalizing submission.</p>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-150 text-xs">
                    {/* Category / Date/Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 p-4 bg-slate-50/50 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Incident Type</span>
                        <span className="text-xs font-bold text-slate-800">{category}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Occurrence Time</span>
                        <span className="text-xs font-bold text-slate-800">{date} at {time}</span>
                      </div>
                    </div>

                    {/* Description narrative */}
                    <div className="p-4 bg-white">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Incident Narrative Statement</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-150">
                        {description}
                      </p>
                    </div>

                    {/* Proximity / Weapons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 p-4 bg-slate-50/50 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Persons Involved / Suspects</span>
                        <span className="text-xs font-bold text-slate-800">{personsInvolved || "Unspecified"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Weapons Involved</span>
                        <span className="text-xs font-bold text-slate-800">{weaponInvolved ? `Yes (${weaponType})` : "No"}</span>
                      </div>
                    </div>

                    {/* Address spatial */}
                    <div className="p-4 bg-white">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Spatial Location & Zone</span>
                      <p className="font-bold text-slate-800">{address}</p>
                      {landmark && <p className="text-slate-500 text-[11px] mt-0.5">Nearby Landmark: <span className="italic">{landmark}</span></p>}
                      <span className="text-[10px] text-slate-400 font-mono">Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)} ({zone})</span>
                    </div>

                    {/* Evidence media */}
                    <div className="p-4 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Uploaded Evidence Media</span>
                      {evidenceList.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {evidenceList.map((file) => (
                            <span key={file.id} className="inline-block bg-white border border-slate-200 rounded px-2.5 py-1 font-bold text-[10px] text-slate-700">
                              📎 {file.name} ({file.size})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-medium">No corroborating media attached.</span>
                      )}
                    </div>

                    {/* Reporter credentials info */}
                    <div className="p-4 bg-white">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Filing Identity Shield</span>
                      {isAnonymous ? (
                        <span className="font-bold text-amber-600 block">🔒 Anonymous Safe Filing Mode — No Contact credentials stored.</span>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 font-medium">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Name:</span>
                            <span className="font-bold text-slate-800">{fullName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Phone:</span>
                            <span className="font-bold text-slate-800">{phone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Email:</span>
                            <span className="font-bold text-slate-800">{email}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation Buttons footer */}
            <div className="border-t border-slate-150 pt-4 mt-8 flex justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setView("public", "landing")}
                  className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {step < 6 ? (
                <button
                  type="button"
                  disabled={!canGoNext()}
                  onClick={handleNext}
                  className={`px-6 py-2.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    canGoNext() 
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/10 cursor-pointer animate-pulse"
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  Finalize & Submit Case
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
