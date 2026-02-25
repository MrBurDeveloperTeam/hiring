import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Stepper } from '../../components/Stepper';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Toast } from '../../components/ui/toast';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getJobBySlug, createJob, updateJob } from '../../lib/api/jobs';
import { getJobIdFromSlug } from '../../lib/utils';
import { ScreeningQuestion } from '../../lib/types';
import { Plus, X, ShieldAlert } from 'lucide-react';

import { getUsersOrganizations } from '../../lib/api/organizations';
import { useEmployerPoints } from '../../contexts/EmployerPointsContext';
import { countries } from '../../lib/constants';

function mapEmploymentTypeToDb(type: string): 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship' {
  const map: Record<string, string> = {
    'Full-time': 'full_time',
    'Part-time': 'part_time',
    'Locum': 'contract', // Assuming Locum maps to contract or temporary based on DB enum. Let's check DB types if possible.
    // Checking types.ts or previous context: DB enum is full_time, part_time, internship, contract, temporary.
    // So Locum -> contract is reasonable fallback or temporary.
    'Contract': 'contract',
    'Internship': 'internship',
    'Temporary': 'temporary'
  };
  return (map[type] || 'full_time') as any;
}

const sidebarLinks = [
  { to: '/employer/dashboard', label: 'Overview' },
  { to: '/employer/post-job', label: 'Post job' },
  { to: '/employer/applicants', label: 'Applicants' },
  { to: '/employer/organization', label: 'Organization Profile' }
];

const steps = [
  { id: 'basics', title: 'Job Basics', description: 'Role, location, employment' },
  { id: 'dental', title: 'Dental Requirements', description: 'Specialties & exposures' },
  { id: 'comp', title: 'Compensation & Schedule', description: 'Salary & shifts' },
  { id: 'questions', title: 'Screening Questions', description: 'Add custom questions' },
  { id: 'review', title: 'Review & Publish', description: 'Confirm details' }
];

export default function PostJob() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgVerifiedStatus, setOrgVerifiedStatus] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const { points, deductPoints, addPoints } = useEmployerPoints();
  const { slug } = useParams<{ slug: string }>();
  const isEditMode = !!slug;

  const [form, setForm] = useState({
    roleType: 'Dental Assistant',
    clinicName: '',
    city: '',
    country: 'Malaysia',
    specialtyTags: '4-hand dentistry, Sterilization',
    experienceLevel: 'Junior',
    newGradWelcome: true,
    trainingProvided: true,
    salaryMin: '2800',
    salaryMax: '3500',
    schedule: '5-day week, rotating weekends',
    benefits: 'Medical coverage, CPD allowance, Annual bonus',
    requirements: '',
    preferredExperience: '',
    employmentType: 'Full-time'
  });

  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);

  useEffect(() => {
    if (!user) return;
    async function fetchOrg() {
      const orgs = await getUsersOrganizations(user!.id);

      if (!orgs || orgs.length === 0) {
        // No organization found, redirect to dashboard which handles onboarding
        navigate('/employer/dashboard');
        return;
      }

      // Try to find active org from local storage, otherwise use first one
      const storedOrgId = localStorage.getItem('activeOrgId');
      const activeOrg = orgs.find(o => o.id === storedOrgId) || orgs[0];

      if (activeOrg) {
        setOrgVerifiedStatus(activeOrg.verified_status || 'unverified');
        if (!isEditMode) {
          setOrgId(activeOrg.id);
          setForm(f => ({
            ...f,
            clinicName: activeOrg.org_name,
            city: activeOrg.city || '',
            country: activeOrg.country || 'Malaysia'
          }));
        }
      }
      setLoadingOrg(false);
    }
    fetchOrg();
  }, [user?.id, navigate, isEditMode]);

  // Load existing data if edit mode
  useEffect(() => {
    if (!slug) return;

    async function loadJob() {
      // Resolve ID first (legacy or slug)
      // Actually we can just fetch by slug using getJobBySlug
      try {
        const job = await getJobBySlug(slug);
        if (job) {
          setOrgId(job.orgId);
          setForm({
            roleType: job.roleType,
            clinicName: job.clinicName,
            city: job.city,
            country: job.country,
            specialtyTags: job.specialtyTags.join(', '),
            experienceLevel: job.experienceLevel,
            newGradWelcome: job.newGradWelcome,
            trainingProvided: job.trainingProvided,
            salaryMin: job.salaryRange.replace(/[^0-9-]/g, '').split('-')[0] || '',
            salaryMax: job.salaryRange.replace(/[^0-9-]/g, '').split('-')[1] || '',
            schedule: '', // Schedule isn't a direct field in Job type returned by API, might serve from description
            benefits: job.benefits.join(', '),
            requirements: job.requirements.join('\n'), // Since we store as array
            preferredExperience: '', // Also not explicit in Job type
            employmentType: job.employmentType || 'Full-time'
          });

          if (job.screening_questions) {
            setScreeningQuestions(job.screening_questions);
          }

          // TODO: Need to parse description back into requirements/schedule/preferred if possible
          // For now, simple load.

          // If we really want to support full edit, we should probably fetch raw row or improve Job type.
          // But let's do best effort mapping.

          // Extract schedule from description if possible?
          // job.description format: `Requirements:\n...\n\nPreferred Experience:\n...\n\nSchedule:\n...`

          const desc = job.description;
          // Naive parsing
          const reqMatch = desc.match(/Requirements:\n([\s\S]*?)\n\nPreferred Experience:/);
          const expMatch = desc.match(/Preferred Experience:\n([\s\S]*?)\n\nSchedule:/);
          const schedMatch = desc.match(/Schedule:\n([\s\S]*)/);

          if (reqMatch) setForm(f => ({ ...f, requirements: reqMatch[1] }));
          if (expMatch) setForm(f => ({ ...f, preferredExperience: expMatch[1] }));
          if (schedMatch) setForm(f => ({ ...f, schedule: schedMatch[1] }));
        }
      } catch (err) {
        console.error("Error loading job for edit", err);
      }
    }
    loadJob();
  }, [slug]);

  const next = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setActiveStep((s) => Math.max(s - 1, 0));

  const addQuestion = () => {
    setScreeningQuestions([
      ...screeningQuestions,
      {
        id: crypto.randomUUID(),
        question: '',
        type: 'text',
        required: true,
        options: []
      }
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<ScreeningQuestion>) => {
    setScreeningQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setScreeningQuestions(prev => prev.filter(q => q.id !== id));
  };


  const insertJob = async (status: 'published' | 'draft') => {
    if (!orgId) {
      alert("Organization profile missing. Please contact support.");
      return;
    }

    // Check points
    const JOB_COST = 20;
    // Only check points if creating new published job
    if (!isEditMode && status === 'published' && points < JOB_COST) {
      alert(`Insufficient credits. You need ${JOB_COST} credits to post a job. Current balance: ${points}`);
      return;
    }


    setIsSubmitting(true);

    // Deduct points optimistically or hold them
    // Deduct points optimistically or hold them (ONLY for new published jobs)
    if (!isEditMode && status === 'published') {
      const info = deductPoints(JOB_COST);
      if (!info) {
        // Should have been caught by check above, but double check
        alert("Insufficient credits.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Parse salary range roughly
      // Parse salary strings to numbers
      const minSal = parseInt(form.salaryMin.replace(/\D/g, ''), 10) || 0;
      const maxSal = parseInt(form.salaryMax.replace(/\D/g, ''), 10) || 0;

      // Map role type to closest enum or 'other'.
      // For simplicity, we downcast to any or 'other' if needed, but DB likely strictly checks.
      // Provide a best-effort map or simplistic lower case match.
      const roleTypeMap: Record<string, string> = {
        'Dental Assistant': 'dental_assistant',
        'Dentist (GP)': 'dentist_gp',
        'Dentist (Specialist)': 'dentist_specialist',
        'Dental Nurse': 'dental_nurse',
        'Dental Hygienist': 'dental_hygienist',
        'Receptionist': 'receptionist',
        'Clinic Manager': 'clinic_manager',
        'Lab Technician': 'lab_technician'
      };
      // Default to 'other' if not found.
      const dbRoleType = roleTypeMap[form.roleType] || 'other';

      const payload = {
        org_id: orgId,
        title: form.roleType, // Using role as title for now
        role_type: dbRoleType as any,
        employment_type: mapEmploymentTypeToDb(form.employmentType),
        experience_level: form.experienceLevel.toLowerCase() as any,
        // special tags split by comma
        specialty_tags: form.specialtyTags.split(',').map(s => s.trim()).filter(Boolean),
        description: `Requirements:\n${form.requirements}\n\nPreferred Experience:\n${form.preferredExperience}\n\nSchedule:\n${form.schedule}`,
        salary_min: minSal,
        salary_max: maxSal,
        currency: 'MYR', // Default
        benefits: { list: form.benefits.split(',').map(s => s.trim()) },
        dental_requirements: {}, // Default empty
        new_grad_welcome: form.newGradWelcome,
        training_provided: form.trainingProvided,
        status: status,
        city: form.city,
        country: form.country,
        updated_at: new Date().toISOString(),
        screening_questions: screeningQuestions // Add screening questions
      };

      let error = null;
      let jobResult: any = null;

      if (isEditMode && slug) {
        try {
          const jobId = getJobIdFromSlug(slug);
          jobResult = await updateJob(jobId, payload);
        } catch (e: any) {
          error = e;
        }
      } else {
        // Create New - use first 8 chars of a generated UUID for consistent slug format
        const roleSlug = form.roleType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        // Generate a UUID-like ID prefix for the slug
        const tempId = crypto.randomUUID().substring(0, 8);
        const newSlug = `${roleSlug}-${tempId}`;

        try {
          jobResult = await createJob({
            ...payload,
            slug: newSlug
          });
        } catch (e: any) {
          error = e;
        }
      }

      if (error) {
        console.error(error);
        alert(`Error ${status === 'published' ? 'publishing' : 'saving'}: ` + (error.message || error));
        // Refund if specific error and was published AND it was a new job
        if (!isEditMode && status === 'published') addPoints(JOB_COST);
      } else {
        setShowToast(true);
        setTimeout(() => navigate('/employer/dashboard'), 1500);
      }

    } catch (err) {
      console.error(err);
      alert("Unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      sidebarLinks={sidebarLinks}
      title={isEditMode ? "Edit Job" : "Post a Job"}
      subtitle={isEditMode ? "Update your job posting details." : "Fill in the details to find your next great hire."}
      hideNavigation
    >
      {/* <Breadcrumbs items={[{ label: 'Employer Home', to: '/employers' }, { label: 'Post Job' }]} /> */}

      {/* Block job posting if org is not verified */}
      {loadingOrg ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        </div>
      ) : orgVerifiedStatus && orgVerifiedStatus !== 'verified' ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center shadow-sm">
          <ShieldAlert className="h-14 w-14 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Verified</h2>
          <p className="text-gray-600 mb-1 max-w-md">
            Your organization must be verified by an admin before you can post job listings.
          </p>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            Current status: <span className="font-medium capitalize">{orgVerifiedStatus}</span>
          </p>
          <Button variant="primary" onClick={() => navigate('/employer/organization')}>
            Go to Organization Profile
          </Button>
        </div>
      ) : (
        <>
          <Stepper steps={steps} activeStep={activeStep} />

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            {activeStep === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Role title"
                  value={form.roleType}
                  onChange={(e) => setForm({ ...form, roleType: e.target.value })}
                  disabled={isEditMode}
                >
                  <option>Dental Assistant</option>
                  <option>Dentist (GP)</option>
                  <option>Dentist (Specialist)</option>
                  <option>Dental Nurse</option>
                  <option>Dental Hygienist</option>
                  <option>Receptionist</option>
                  <option>Clinic Manager</option>
                  <option>Lab Technician</option>
                </Select>
                <Input
                  label="Clinic name"
                  value={form.clinicName}
                  onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                />
                <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Select
                  label="Country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Select
                  label="Experience level"
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                >
                  <option>Entry</option>
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                </Select>
                <Select
                  label="Employment type"
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Locum</option>
                  <option>Contract</option>
                </Select>
                <Checkbox
                  label="New grad welcome"
                  checked={form.newGradWelcome}
                  onChange={(e) => setForm({ ...form, newGradWelcome: e.target.checked })}
                />
                <Checkbox
                  label="Training provided"
                  checked={form.trainingProvided}
                  onChange={(e) => setForm({ ...form, trainingProvided: e.target.checked })}
                />
              </div>
            )}

            {activeStep === 1 && (
              <div className="grid gap-4">
                <Textarea
                  label="Specialty tags"
                  value={form.specialtyTags}
                  onChange={(e) => setForm({ ...form, specialtyTags: e.target.value })}
                  hint="Comma-separated tags e.g. Intraoral scanning, Sterilization, Implants"
                />
                <Textarea
                  label="Key requirements"
                  placeholder="Rubber dam, sterilization, chairside charting..."
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                />
                <Textarea
                  label="Preferred experience"
                  placeholder="1+ year in chairside support..."
                  value={form.preferredExperience}
                  onChange={(e) => setForm({ ...form, preferredExperience: e.target.value })}
                />
              </div>
            )}

            {activeStep === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Salary Min (MYR)"
                    type="number"
                    value={form.salaryMin}
                    onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                  />
                  <Input
                    label="Salary Max (MYR)"
                    type="number"
                    value={form.salaryMax}
                    onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                  />
                </div>
                <Input
                  label="Schedule"
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                />
                <Textarea
                  className="md:col-span-2"
                  label="Benefits"
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                />
              </div>
            )}

            {/* Screening Questions Step */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Screening Questions</h3>
                    <p className="text-sm text-gray-500">Ask candidates specific questions when they apply.</p>
                  </div>
                  <Button onClick={addQuestion} size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {screeningQuestions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">No screening questions added yet.</p>
                      <Button onClick={addQuestion} variant="ghost" className="text-brand">Add your first question</Button>
                    </div>
                  ) : (
                    screeningQuestions.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative group">
                        <button
                          onClick={() => removeQuestion(q.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="space-y-3">
                          <Input
                            label={`Question ${idx + 1}`}
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                            placeholder="e.g. Do you have a valid APC?"
                          />

                          <div className="flex gap-4">
                            <div className="w-1/3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Response Type</label>
                              <select
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                value={q.type}
                                onChange={(e) => updateQuestion(q.id, { type: e.target.value as any })}
                              >
                                <option value="text">Free Text</option>
                                <option value="yes_no">Yes / No</option>
                                {/* <option value="multiple_choice">Multiple Choice</option> */}
                              </select>
                            </div>
                            <div className="flex items-center pt-6">
                              <Checkbox
                                label="Required"
                                checked={q.required}
                                onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-3 text-sm text-gray-700">
                <p className="text-lg font-semibold text-gray-900">Review</p>
                <div className="mb-4 rounded-lg bg-brand/5 border border-brand/10 p-4">
                  <p className="text-brand font-medium">Job Expiration Notice</p>
                  <p className="text-brand/80">Once published, this job listing will be active for 30 days. After 30 days, it will automatically expire and be hidden from search results.</p>
                </div>
                <p>
                  <strong>Role:</strong> {form.roleType}
                </p>
                <p>
                  <strong>Clinic:</strong> {form.clinicName} - {form.city}, {form.country}
                </p>
                <p>
                  <strong>Specialties:</strong> {form.specialtyTags}
                </p>
                <p>
                  <strong>Salary:</strong> RM {form.salaryMin} - RM {form.salaryMax}
                </p>
                <p>
                  <strong>Benefits:</strong> {form.benefits}
                </p>
                {screeningQuestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <strong>Screening Questions:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {screeningQuestions.map(q => (
                        <li key={q.id}>{q.question} <span className="text-gray-400 text-xs">({q.type})</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button variant="outline" onClick={prev} disabled={activeStep === 0}>
                  Back
                </Button>
                {activeStep < steps.length - 1 && (
                  <Button variant="primary" onClick={next}>
                    Next
                  </Button>
                )}
                {activeStep === steps.length - 1 && (
                  <Button variant="primary" onClick={() => insertJob('published')} disabled={isSubmitting}>
                    {isSubmitting ? 'Publishing...' : isEditMode ? 'Save Changes' : 'Publish (-20 credits)'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Toast
            open={showToast}
            onClose={() => setShowToast(false)}
            title={isEditMode ? "Job updated" : "Job published"}
            description={isEditMode ? "Your changes have been saved." : "Redirecting to dashboard..."}
          />
        </>
      )}
    </DashboardShell>
  );
}
