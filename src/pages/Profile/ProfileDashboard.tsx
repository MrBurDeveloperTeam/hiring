import { useEffect, useMemo, useState, useRef } from 'react';
import ConversationList from '../Messages/ConversationList';
import ChatWindow from '../Messages/ChatWindow';


import { Link, useNavigate } from 'react-router-dom';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Tabs } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { TagPill } from '../../components/TagPill';
import { Button } from '../../components/ui/button';
import { JobCard } from '../../components/JobCard';
import { JobStage, Resume } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { getSavedJobs, unsaveJob } from '../../lib/api/jobs';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { UploadCloud, ScanText, MessageCircle, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { getApplications } from '../../lib/api/applications';
import { extractTextFromPDF } from '../../lib/utils/pdf';
import { parseResumeWithGemini } from '../../lib/services/resume';
import EducationSection from '../../components/profile/EducationSection';
import WorkExperienceSection from '../../components/profile/WorkExperienceSection';
import { Education, WorkExperience } from '../../lib/types';
import { addEducation } from '../../lib/api/education';
import { addWorkExperience } from '../../lib/api/work_experience';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import SeekerPublicProfileEmbed from '../../components/profile/SeekerPublicProfileEmbed';

const sidebarLinks = [
  { to: '/seekers/dashboard', label: 'Dashboard' },
  { to: '/jobs', label: 'Browse jobs' },
  { to: '/jobs/job-1', label: 'Saved jobs' }
];

const exposures = ['4-hand dentistry', 'Sterilization', 'Intraoral scanning', 'Implant chairside', 'Pediatric'];
const applicationStatuses: (JobStage | 'All')[] = ['All', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

const defaultProfileFields = {
  fullName: '',
  email: '',
  school: '',
  graduation: '',
  seekerType: 'student',
  avatarUrl: '', // Add this
};

import { Modal } from '../../components/ui/modal';
import { Toast } from '../../components/ui/toast';

export default function ProfileDashboard() {
  const { user, signOut } = useAuth();
  const { unreadTotal, openChat } = useChat();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleConfirmSignOut = async () => {
    console.log('ProfileDashboard: handleConfirmSignOut clicked');
    try {
      await signOut();
      console.log('ProfileDashboard: signOut finished, navigating to /');
      navigate('/');
    } catch (e) {
      console.error('ProfileDashboard: signOut failed', e);
    }
  };

  // Real Data State
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [latestResume, setLatestResume] = useState<Resume | null>(null);
  const [profileFields, setProfileFields] = useState(defaultProfileFields);
  const [selectedExposures, setSelectedExposures] = useState<string[]>([]);
  const [scannedEducation, setScannedEducation] = useState<Education[]>([]);
  const [scannedExperience, setScannedExperience] = useState<WorkExperience[]>([]);
  const [dataVersion, setDataVersion] = useState(0);

  // Modals & Upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Resume Scanner State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempAnalyzeFile, setTempAnalyzeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastContent, setToastContent] = useState({ title: '', description: '' });

  // Avatar Upload State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];
      setAvatarUploading(true);

      const initials = (profileFields.fullName || profileFields.email || '?').charAt(0).toUpperCase();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      // Upload image to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user?.id);

      if (updateError) {
        throw updateError;
      }

      setToastContent({
        title: 'Success',
        description: 'Profile picture updated successfully'
      });
      setShowToast(true);

      // Update local state by forcing a reload or manually updating a profile context if it existed separately
      // For now, reloading data or relying on AuthContext to refresh would be ideal, 
      // but since AuthContext user object might not deep refresh immediately for custom fields,
      // we might need to trigger a re-fetch or just let the user see it on refresh.
      // Ideally, updateFields or similar.
      // We will trigger a reload of profile data if possible, but simplest is just:
      window.location.reload();

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setToastContent({
        title: 'Error',
        description: error.message || 'Failed to upload profile picture'
      });
      setShowToast(true);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Applications & Saved Jobs (We'll keep these mostly empty/basic for now unless we have real data populated)
  const [applications, setApplications] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);

  // Prevents infinite re-fetching on window focus
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('ProfileDashboard: No user, stopping loading');
      setLoading(false);
      lastFetchedUserId.current = null; // Reset on logout
      return;
    }

    // Skip if we already fetched for this user
    if (lastFetchedUserId.current === user.id) {
      console.log('ProfileDashboard: Skipping fetch, user already loaded', user.id);
      return;
    }

    console.log('ProfileDashboard: User present, fetching data', user.id);
    lastFetchedUserId.current = user.id; // Mark as fetched

    async function fetchData() {
      if (!user?.id) return;

      setLoading(true);
      console.log('ProfileDashboard: fetchData started');
      try {
        // 1. Fetch Profile Data (profiles + seeker_profiles)
        console.log('ProfileDashboard: Fetching profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, avatar_url, seeker_profiles(school_name, expected_graduation_date, clinical_exposures, seeker_type)')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          console.log('ProfileDashboard: Profile fetched');
          // Cast to any to safely handle the joined data structure
          const seekerData = Array.isArray(profileData.seeker_profiles) ? profileData.seeker_profiles[0] : profileData.seeker_profiles;

          setProfileFields({
            fullName: profileData.name || '',
            email: user.email || '', // Email from auth user, not profile table usually (unless stored there too)
            school: seekerData?.school_name || '',
            graduation: seekerData?.expected_graduation_date || '',
            seekerType: seekerData?.seeker_type || 'student',
            avatarUrl: profileData.avatar_url || '', // Add this
          });
          setSelectedExposures(seekerData?.clinical_exposures || []);
        }

        // 2. Fetch Resumes (seeker_documents)
        // Order by created_at DESC to get latest
        console.log('ProfileDashboard: Fetching documents...');
        const { data: docs, error: docsError } = await supabase
          .from('seeker_documents')
          .select('id, title, created_at, storage_path')
          .eq('user_id', user.id)
          .eq('doc_type', 'resume')
          .order('created_at', { ascending: false });

        if (docsError) {
          console.error('Error fetching documents:', docsError);
        } else if (docs) {
          console.log('ProfileDashboard: Documents fetched', docs.length);
          // Map to Resume type
          const mappedResumes: Resume[] = docs.map(d => ({
            id: d.id,
            name: d.title,
            uploadedAt: d.created_at,
            category: 'Resume',
            url: d.storage_path // Or construct full URL if needed
          }));
          setResumes(mappedResumes);
          setResumes(mappedResumes);
          setLatestResume(mappedResumes[0] || null);
        }

        // 3. Fetch Applications
        console.log('ProfileDashboard: Fetching applications...');
        const apps = await getApplications({ seeker_user_id: user.id });
        console.log('ProfileDashboard: Applications fetched', apps.length);
        setApplications(apps);

        // 4. Fetch Saved Jobs
        console.log('ProfileDashboard: Fetching saved jobs...');
        const saved = await getSavedJobs(user.id);
        console.log('ProfileDashboard: Saved jobs fetched', saved.length);
        setSavedJobs(saved);

      } catch (err) {
        console.error('Unexpected error fetching dashboard data:', err);
      } finally {
        console.log('ProfileDashboard: fetchData finished, setting loading false');
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.id]);

  const handleFieldChange = (field: keyof typeof defaultProfileFields, value: string) => {
    setProfileFields((prev) => ({ ...prev, [field]: value }));
  };

  const toggleExposure = (item: string) => {
    setSelectedExposures((prev) =>
      prev.includes(item) ? prev.filter((entry) => entry !== item) : [...prev, item]
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Update 'profiles' table (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: profileFields.fullName })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update 'seeker_profiles' table
      // Use upsert to create the row if it doesn't exist
      const { error: seekerError } = await supabase
        .from('seeker_profiles')
        .upsert({
          user_id: user.id,
          school_name: profileFields.school,
          expected_graduation_date: profileFields.graduation ? `${profileFields.graduation}-01` : null, // Convert YYYY-MM to YYYY-MM-DD
          clinical_exposures: selectedExposures,
          seeker_type: profileFields.seekerType as Database['public']['Enums']['seeker_type']
        });

      // Note: upsert requires the primary key (user_id) to be present to determine update vs insert.
      // We included user_id above.

      if (seekerError) throw seekerError;

      alert('Profile saved successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!uploadFile || !user) return;

    setUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id} -${Date.now()}.${fileExt} `;
      const filePath = `${fileName} `;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // 2. Create DB Record
      const { error: dbError } = await supabase
        .from('seeker_documents')
        .insert({
          user_id: user.id,
          title: uploadFileName || uploadFile.name,
          doc_type: 'resume',
          storage_path: filePath,
          is_default: true // Mark as default/latest
        });

      if (dbError) throw dbError;

      // 3. Refresh List
      const newResume: Resume = {
        id: 'temp-id', // will be refreshed on reload/fetch
        name: uploadFileName || uploadFile.name,
        uploadedAt: new Date().toISOString(),
        category: 'Resume',
        url: filePath
      };

      setResumes([newResume, ...resumes]); // Add to top
      setLatestResume(newResume);

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadFileName('');

    } catch (err) {
      console.error('Error uploading resume:', err);
      alert('Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleResumeAnalysis = async (key: string, file: File) => { // Accept file directly
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // 1. Extract Text
      const text = await extractTextFromPDF(file);

      if (!text.trim()) {
        throw new Error('Could not extract any text from this PDF. Please try a different file.');
      }

      // 2. Parse with LLM
      const start = Date.now();
      const extractedData = await parseResumeWithGemini(text, key);
      const duration = Date.now() - start;

      // 3. Auto-fill fields
      setProfileFields(prev => ({
        ...prev,
        fullName: extractedData.fullName || prev.fullName,
        email: extractedData.email || prev.email,
        // Map other fields as best as possible
        school: extractedData.school || prev.school,
        seekerType: (extractedData.experienceYears || 0) > 2 ? 'professional' : 'student',
      }));

      // Map Education and Save to DB
      if (extractedData.education && extractedData.education.length > 0) {
        for (const edu of extractedData.education) {
          await addEducation(user.id, {
            institutionName: edu.institutionName,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: edu.startDate,
            endDate: edu.endDate,
            isCurrent: edu.isCurrent ?? false,
            description: edu.description
          });
        }
      }

      // Map Work Experience and Save to DB
      if (extractedData.workExperience && extractedData.workExperience.length > 0) {
        for (const exp of extractedData.workExperience) {
          await addWorkExperience(user.id, {
            companyName: exp.companyName,
            jobTitle: exp.jobTitle,
            location: exp.location || '',
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent ?? false,
            description: exp.description
          });
        }
      }

      // Force refresh of sections
      setDataVersion(prev => prev + 1);

      // Add skills to clinical exposures if they match
      if (extractedData.skills && extractedData.skills.length > 0) {
        // Simple fuzzy match or direct match against our fixed list "exposures"
        const newExposures = [...selectedExposures];

        extractedData.skills.forEach(skill => {
          const key = skill.toLowerCase();
          // Check if this skill roughly matches one of our exposure options
          const match = exposures.find(e => e.toLowerCase().includes(key) || key.includes(e.toLowerCase()));
          if (match && !newExposures.includes(match)) {
            newExposures.push(match);
          }
        });
        setSelectedExposures(newExposures);
      }

      setToastContent({
        title: 'Resume analyzed successfully!',
        description: `Found: ${extractedData.fullName || 'Name'}, ${extractedData.school || 'School'}. Mapped ${extractedData.skills?.length || 0} skills.`
      });
      setShowToast(true);

      setShowApiKeyModal(false);
      setTempAnalyzeFile(null);

    } catch (err) {
      console.error('Analysis failed:', err);
      const msg = err instanceof Error ? err.message : String(err);

      setToastContent({
        title: 'Analysis Failed',
        description: msg.includes('400')
          ? 'Invalid API Key or Resume format.'
          : msg
      });
      setShowToast(true);
      // alert('Failed to analyze resume. Please try again.'); // Using toast instead
    } finally {
      setIsAnalyzing(false);
    }
  };

  const initiateAnalysis = (file: File) => {
    setTempAnalyzeFile(file);
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (envApiKey) {
      handleResumeAnalysis(envApiKey, file);
    } else if (apiKey) {
      handleResumeAnalysis(apiKey, file);
    } else {
      setShowApiKeyModal(true);
    }
  };

  const [applicationFilter, setApplicationFilter] = useState<JobStage | 'All'>('All');

  const filteredApplications = useMemo(() => {
    if (applicationFilter === 'All') return applications;
    return applications.filter((application) => application.status === applicationFilter);
  }, [applicationFilter, applications]);

  if (loading && !profileFields.email) {
    return (
      <DashboardShell sidebarLinks={sidebarLinks} title="Seekers Dashboard" subtitle="Loading..." hideNavigation>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading profile data...</p>
        </div>
        <Modal
          open={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          title="Enter Google Gemini API Key"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              To use the Resume Scanner, please provide a free Google Gemini API Key.
              You can get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand underline">Google AI Studio</a>.
            </p>
            <Input
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowApiKeyModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!apiKey || !tempAnalyzeFile}
                onClick={() => tempAnalyzeFile && handleResumeAnalysis(apiKey, tempAnalyzeFile)}
              >
                Analyze Resume
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      sidebarLinks={sidebarLinks}
      title="Seekers Dashboard"
      subtitle="Manage your dental profile, resumes, and saved jobs."
      hideNavigation
    >
      {/* <Breadcrumbs items={[{ label: 'Seeker Home', to: '/seekers' }, { label: 'Seekers Dashboard' }]} /> */}
      <Tabs
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'applications', label: 'Applications' },
          { id: 'saved', label: 'Saved jobs' },
          {
            id: 'chat',
            label: (
              <span className="flex items-center gap-2">
                Chat
                {unreadTotal > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadTotal}
                  </span>
                )}
              </span>
            )
          }
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'profile' && user && (
        <SeekerPublicProfileEmbed userId={user.id} />
      )}

      {
        activeTab === 'applications' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
              <div className="flex items-center gap-2">
                <label htmlFor="application-filter" className="text-xs font-semibold text-gray-500">
                  Status
                </label>
                <select
                  id="application-filter"
                  value={applicationFilter}
                  onChange={(event) => setApplicationFilter(event.target.value as JobStage | 'All')}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700"
                >
                  {applicationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3">
              {filteredApplications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No applications found.</p>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-gray-100 bg-white p-6 transition hover:border-brand/40 hover:shadow-md cursor-pointer group"
                    onClick={() => navigate(`/jobs/${app.jobId}`)}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{app.jobTitle}</h4>
                          <p className="text-brand font-medium bg-brand/5 px-2 py-0.5 rounded-md w-fit">{app.clinicName}</p>
                          <p className="text-sm text-gray-500 mt-1">{app.location}</p>
                        </div>
                        <Badge variant={
                          app.status === 'Applied' ? 'default' :
                            app.status === 'Shortlisted' ? 'info' :
                              app.status === 'Interview' ? 'warning' :
                                app.status === 'Offer' ? 'success' :
                                  'default'
                        }>
                          {app.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Applied {formatDate(app.appliedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/jobs/${app.jobId}`);
                            }}
                          >
                            Details
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<MessageCircle className="h-4 w-4" />}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (user) {
                                /* We pass the organization ID (employer ID) to openChat */
                                await openChat(app.orgId, user.id, app.jobId);
                                setActiveTab('chat');
                              }
                            }}
                          >
                            Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      }



      {
        activeTab === 'saved' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Saved jobs</h3>
            <div className="mt-3 grid gap-3">
              {savedJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No saved jobs yet.</p>
              ) : (
                savedJobs.map((job) => {
                  const isApplied = applications.some(app => app.jobId === job.id);
                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={(j) => navigate(`/jobs/${j.id}`)}
                      isSaved={true}
                      hasApplied={isApplied}
                      onToggleSave={async (j) => {
                        if (window.confirm('Remove from saved jobs?')) {
                          await unsaveJob(user!.id, j.id);
                          setSavedJobs(prev => prev.filter(p => p.id !== j.id));
                        }
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        )
      }

      {
        activeTab === 'chat' && (
          <div className="h-[calc(100vh-250px)] min-h-[500px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-12">
              <div className="h-full overflow-hidden border-r border-gray-200 md:col-span-4 lg:col-span-3">
                <ConversationList />
              </div>
              <div className="h-full overflow-hidden md:col-span-8 lg:col-span-9">
                <ChatWindow />
              </div>
            </div>
          </div>
        )
      }

      {
        showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upload resume</h3>
                <button
                  className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFileName('');
                    setUploadFile(null);
                  }}
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Upload your resume (.pdf, .docx). The new file will replace your current latest resume.
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand">
                <span className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-brand" />
                  <span>{uploadFileName || 'Choose resume file'}</span>
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      setUploadFileName(file.name);
                    }
                  }}
                />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowUploadModal(false);
                  setUploadFileName('');
                  setUploadFile(null);
                }}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleResumeUpload} disabled={!uploadFile || uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      <Modal
        open={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Sign Out Assessment"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-gray-600">Are you sure you want to sign out of your account?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowSignOutConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSignOut}
              className="bg-red-600 hover:bg-red-700 border-red-600 from-red-600 to-red-700"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="Enter Google Gemini API Key"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            To use the Resume Scanner, please provide a free Google Gemini API Key.
            You can get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand underline">Google AI Studio</a>.
          </p>
          <Input
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowApiKeyModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!apiKey || !tempAnalyzeFile}
              onClick={() => tempAnalyzeFile && handleResumeAnalysis(apiKey, tempAnalyzeFile)}
            >
              Analyze Resume
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        open={showToast}
        onClose={() => setShowToast(false)}
        title={toastContent.title}
        description={toastContent.description}
        variant="success"
      />
    </DashboardShell >
  );
}
