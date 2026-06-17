import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Profile, Project, Experience } from '../types';

// Inline TagInput helper component for tags and skills
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags = [], onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const val = inputValue.trim().replace(/,$/, '');
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleBlur = () => {
    addTag();
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant min-h-[38px] items-center">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary transition-all hover:bg-primary/20"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="text-primary hover:text-white transition-colors focus:outline-none text-[8px]"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-xs text-on-surface focus:outline-none border-none p-0 placeholder-on-surface-variant/40"
        />
      </div>
    </div>
  );
};

interface ProfileFormProps {
  initialData: Profile;
  onSave: (data: Profile) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  onFormChange?: (jsonStr: string) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving,
  onFormChange
}) => {
  const [profile, setProfile] = useState<Profile>(() => {
    const data = JSON.parse(JSON.stringify(initialData || {}));
    return {
      name: data.name || '',
      email: data.email || '',
      github: data.github || '',
      portfolio: data.portfolio || '',
      top_projects: data.top_projects || [],
      top_skills: data.top_skills || [],
      experience_summary: data.experience_summary || '',
      experience: data.experience || []
    };
  });

  const [showRawJson, setShowRawJson] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Silently rebuild the JSON in the background and propagate up on form change
  useEffect(() => {
    if (onFormChange) {
      onFormChange(JSON.stringify(profile, null, 2));
    }
  }, [profile, onFormChange]);

  const handleBasicChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Projects logic
  const handleProjectChange = (idx: number, field: keyof Project, value: any) => {
    setProfile(prev => {
      const updated = [...(prev.top_projects || [])];
      updated[idx] = {
        ...updated[idx],
        [field]: value
      };
      return { ...prev, top_projects: updated };
    });
  };

  const addProject = () => {
    setProfile(prev => ({
      ...prev,
      top_projects: [
        ...(prev.top_projects || []),
        { name: '', description: '', live_url: '', tags: [] }
      ]
    }));
  };

  const removeProject = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      top_projects: (prev.top_projects || []).filter((_, i) => i !== idx)
    }));
  };

  // Experience logic
  const handleExperienceChange = (idx: number, field: keyof Experience, value: any) => {
    setProfile(prev => {
      const updated = [...(prev.experience || [])];
      updated[idx] = {
        ...updated[idx],
        [field]: value
      };
      return { ...prev, experience: updated };
    });
  };

  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        { company: '', role: '', description: '', period: '' }
      ]
    }));
  };

  const removeExperience = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      experience: (prev.experience || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setValidationError("Candidate Name is a required field.");
      return;
    }
    if (!profile.email.trim()) {
      setValidationError("Candidate Email is a required field.");
      return;
    }
    setValidationError(null);
    onSave(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-error/30 bg-error-container/10 text-xs text-error">
          <AlertCircle size={16} />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* SECTION 1: Basic Info */}
      <div className="space-y-4">
        <h4 className="text-xs font-headline font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-2">
          Section 1: Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">Name *</label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={(e) => handleBasicChange('name', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="e.g. Gokul Balagopal"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">Email *</label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => handleBasicChange('email', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="e.g. gokul@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">GitHub URL</label>
            <input
              type="text"
              value={profile.github}
              onChange={(e) => handleBasicChange('github', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="e.g. https://github.com/Gokul7904231"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">Portfolio URL</label>
            <input
              type="text"
              value={profile.portfolio}
              onChange={(e) => handleBasicChange('portfolio', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="e.g. https://gokul-portfolio.vercel.app"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Top Projects */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <h4 className="text-xs font-headline font-bold text-primary uppercase tracking-wider">
            Section 2: Top Projects
          </h4>
          <button
            type="button"
            onClick={addProject}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-white transition-colors"
          >
            <Plus size={12} />
            Add Project
          </button>
        </div>

        {(!profile.top_projects || profile.top_projects.length === 0) ? (
          <p className="text-xs text-on-surface-variant italic font-medium py-2">No projects added yet.</p>
        ) : (
          <div className="space-y-4">
            {profile.top_projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest/50 space-y-3 relative group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-primary">Project #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeProject(idx)}
                    className="p-1 rounded-btn text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                    title="Remove Project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase">Project Name</label>
                    <input
                      type="text"
                      required
                      value={proj.name}
                      onChange={(e) => handleProjectChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. Sentixcare"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase">Live URL</label>
                    <input
                      type="text"
                      value={proj.live_url || ''}
                      onChange={(e) => handleProjectChange(idx, 'live_url', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. https://huggingface.co/..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-on-surface-variant uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-relaxed"
                    placeholder="Provide a brief description of what this project accomplishes..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-on-surface-variant uppercase">Tags</label>
                  <TagInput
                    tags={proj.tags || []}
                    onChange={(newTags) => handleProjectChange(idx, 'tags', newTags)}
                    placeholder="Type a tag and press Enter or comma..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Skills, Experience Summary, and Experience Entries */}
      <div className="space-y-6">
        <h4 className="text-xs font-headline font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-2">
          Section 3: Skills & Professional Experience
        </h4>

        {/* Top Skills Tag Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase">Top Technical Skills</label>
          <TagInput
            tags={profile.top_skills || []}
            onChange={(newSkills) => setProfile(prev => ({ ...prev, top_skills: newSkills }))}
            placeholder="Type a skill (e.g. Python, React) and press Enter..."
          />
        </div>

        {/* Experience Summary */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase">Professional Experience Summary</label>
          <textarea
            rows={2}
            value={profile.experience_summary}
            onChange={(e) => handleBasicChange('experience_summary', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-relaxed"
            placeholder="e.g. AI/ML Intern at Infosys, Full Stack Intern at Zidio, specialized in agentic workflows..."
          />
        </div>

        {/* Dynamic Experience Records */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">Detailed Experience Entries</label>
            <button
              type="button"
              onClick={addExperience}
              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-white transition-colors"
            >
              <Plus size={12} />
              Add Experience
            </button>
          </div>

          {(!profile.experience || profile.experience.length === 0) ? (
            <p className="text-xs text-on-surface-variant italic font-medium py-2">No detailed experiences added yet.</p>
          ) : (
            <div className="space-y-4">
              {profile.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest/50 space-y-3 relative group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-primary">Experience #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="p-1 rounded-btn text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      title="Remove Experience"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-on-surface-variant uppercase">Company Name</label>
                      <input
                        type="text"
                        required
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="e.g. Infosys"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-on-surface-variant uppercase">Job Title / Role</label>
                      <input
                        type="text"
                        required
                        value={exp.role}
                        onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="e.g. AI/ML Developer Intern"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-on-surface-variant uppercase">Employment Period</label>
                      <input
                        type="text"
                        value={exp.period || ''}
                        onChange={(e) => handleExperienceChange(idx, 'period', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="e.g. Jan 2026 - Present"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase">Job Description</label>
                    <textarea
                      rows={2}
                      value={exp.description || ''}
                      onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-relaxed"
                      placeholder="e.g. Developed and optimized corporate retrieval models..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-all"
        >
          {showRawJson ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{showRawJson ? 'Hide Raw JSON' : 'View Raw JSON'}</span>
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-btn border border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-container disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shadow-primary/20"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Raw JSON read-only display */}
      {showRawJson && (
        <div className="mt-4 p-4 rounded-lg bg-surface-container-lowest border border-outline-variant overflow-x-auto shadow-inner animate-slide-in">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-outline-variant/30">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant font-mono">Generated profile.json</span>
            <span className="text-[10px] text-emerald-400 font-semibold font-mono">Read-Only Preview</span>
          </div>
          <pre className="text-xs text-on-surface leading-relaxed font-mono whitespace-pre max-h-[300px] overflow-y-auto custom-scrollbar">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}
    </form>
  );
};
