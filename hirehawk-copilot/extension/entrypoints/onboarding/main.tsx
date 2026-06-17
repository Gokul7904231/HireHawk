import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import ReactDOM from "react-dom/client";
import { UploadCloud, FileText, X, CheckCircle, AlertTriangle, AlertCircle, Loader } from "lucide-react";
import { parseResume } from "../../lib/api-client";
import { saveProfile, ParsedProfile, ProfileMeta } from "../../lib/resume-storage";
import "./onboarding.css";

function OnboardingApp() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [parsingState, setParsingState] = useState<"idle" | "uploading" | "extracting" | "success" | "error">("idle");
  const [parsingError, setParsingError] = useState("");
  
  // Results view states
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(null);
  const [profileMeta, setProfileMeta] = useState<ProfileMeta | null>(null);
  const [editableName, setEditableName] = useState("");
  const [editableEmail, setEditableEmail] = useState("");
  const [editablePhone, setEditablePhone] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorText("");
    if (selectedFile.type !== "application/pdf") {
      setErrorText("Only PDF files are supported.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorText("Please upload a PDF under 5MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = () => {
    setFile(null);
    setErrorText("");
  };

  const handleParse = async () => {
    if (!file) return;

    setParsingState("uploading");
    setParsingError("");

    try {
      // Simulate/Trigger Uploading status progress change
      setTimeout(() => {
        setParsingState("extracting");
      }, 1000);

      const res = await parseResume(file);
      
      setParsingState("success");
      
      // Store parsed results
      setParsedProfile(res.parsed_profile);
      setProfileMeta({
        uploaded_at: new Date().toLocaleDateString(),
        filename: file.name,
        confidence: res.confidence,
        missing_fields: res.missing_fields
      });

      // Set editable form fields
      setEditableName(res.parsed_profile.name || "");
      setEditableEmail(res.parsed_profile.email || "");
      setEditablePhone(res.parsed_profile.phone || "");

    } catch (err: any) {
      setParsingState("error");
      setParsingError(err.message || "Failed to parse resume.");
    }
  };

  const handleSave = async () => {
    if (!parsedProfile || !profileMeta) return;

    const finalProfile: ParsedProfile = {
      ...parsedProfile,
      name: editableName,
      email: editableEmail || null,
      phone: editablePhone || null
    };

    try {
      await saveProfile(finalProfile, profileMeta);
      // Redirect to main popup dashboard
      window.location.href = "popup.html";
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Error saving candidate profile data.");
    }
  };

  const handleReupload = () => {
    setFile(null);
    setParsedProfile(null);
    setProfileMeta(null);
    setParsingState("idle");
    setErrorText("");
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Extract skills preview
  const getSkillsPreview = (): string[] => {
    if (!parsedProfile || !parsedProfile.skills) return [];
    const skillsObj = parsedProfile.skills;
    const flatSkills = [
      ...(skillsObj.languages || []),
      ...(skillsObj.frameworks || []),
      ...(skillsObj.cloud || []),
      ...(skillsObj.ml || [])
    ];
    return flatSkills.slice(0, 10);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Header */}
        <div className="onboarding-header">
          <div className="nh-monogram">NH</div>
          <h1 className="onboarding-title">NeuroHire Copilot</h1>
          <p className="onboarding-subtitle">
            {parsedProfile ? "Review your parsed candidate profile" : "Set up your candidate profile to get started"}
          </p>
        </div>

        {/* Dynamic Card Body */}
        {!parsedProfile ? (
          /* Step 1: Upload View */
          <div>
            <div
              className={`upload-zone ${isDragging ? "dragging" : ""} ${errorText ? "error-state" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                style={{ display: "none" }}
              />
              <UploadCloud className="upload-icon" />
              <p className="upload-text-main">Drop your resume PDF here</p>
              <p className="upload-text-sub">or click to browse</p>
            </div>
            
            {errorText && <p className="upload-error-text">{errorText}</p>}

            {/* Selected File Row */}
            {file && (
              <div className="file-preview">
                <span className="pdf-icon">PDF</span>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatBytes(file.size)}</span>
                </div>
                <button className="remove-file" onClick={removeSelectedFile} title="Remove file">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Parse CTA Button */}
            <button
              className="cta-button"
              disabled={!file || parsingState === "uploading" || parsingState === "extracting"}
              onClick={handleParse}
            >
              {(parsingState === "uploading" || parsingState === "extracting") && <Loader className="spinner-small" />}
              {parsingState === "uploading" && "Uploading to Azure..."}
              {parsingState === "extracting" && "Extracting with Gemini..."}
              {parsingState === "idle" && "Parse Resume"}
              {parsingState === "success" && "Success!"}
              {parsingState === "error" && "Retry Parse"}
            </button>

            {/* Parsing State Explanations */}
            {parsingState !== "idle" && (
              <div className="parsing-state-container">
                {parsingState === "uploading" && (
                  <div className="parsing-status-row">
                    <Loader size={14} className="spinner-small" />
                    <span>Sending to Azure AI Document Intelligence...</span>
                  </div>
                )}
                
                {parsingState === "extracting" && (
                  <div className="parsing-status-row">
                    <Loader size={14} className="spinner-small" />
                    <span>Extracting profile data with Gemini Flash...</span>
                  </div>
                )}

                {(parsingState === "uploading" || parsingState === "extracting") && (
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill"></div>
                  </div>
                )}

                {parsingState === "success" && (
                  <div className="parsing-status-row">
                    <CheckCircle className="status-icon-success" size={16} />
                    <span className="status-text-success">Profile parsed successfully!</span>
                  </div>
                )}

                {parsingState === "error" && (
                  <div className="parsing-status-row">
                    <AlertCircle className="status-icon-error" size={16} />
                    <span className="status-text-error">{parsingError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Results Preview & Edit View */
          <div className="results-preview-section">
            <div className="results-header">
              <h2 className="results-title">Extracted Profile</h2>
              <p className="results-subtitle">Edit any field before saving</p>
            </div>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={editableEmail}
                onChange={(e) => setEditableEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={editablePhone}
                onChange={(e) => setEditablePhone(e.target.value)}
              />
            </div>

            {/* Badges Count Row */}
            <div className="badge-count-row">
              <div className="badge-count">
                {parsedProfile.experience?.length || 0} roles detected
              </div>
              <div className="badge-count">
                {parsedProfile.projects?.length || 0} projects detected
              </div>
            </div>

            {/* Skills Chip List */}
            {getSkillsPreview().length > 0 && (
              <div className="skills-preview-container">
                <label className="form-label">Extracted Skills Preview</label>
                <div className="skills-chips-row">
                  {getSkillsPreview().map((skill, index) => (
                    <span key={index} className="skill-chip">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Amber Missing Fields Banner */}
            {profileMeta && profileMeta.missing_fields.length > 0 && (
              <div className="amber-banner">
                <AlertTriangle size={14} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />
                <span>
                  Some fields could not be extracted: {profileMeta.missing_fields.join(", ")}. 
                  You can add them in Candidate Settings.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="button-group-row">
              <button className="btn-ghost-grey" onClick={handleReupload}>
                Re-upload
              </button>
              <button className="btn-violet-filled" onClick={handleSave} disabled={!editableName}>
                Save & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OnboardingApp />
  </React.StrictMode>
);
