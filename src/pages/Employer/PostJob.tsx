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
import { getJobBySlug } from '../../lib/api/jobs';
import { getJobIdFromSlug } from '../../lib/utils';

import { getUsersOrganizations } from '../../lib/api/organizations';
import { useEmployerPoints } from '../../contexts/EmployerPointsContext';

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
  { id: 'review', title: 'Review & Publish', description: 'Confirm details' }
];

export default function PostJob() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState<string | null>(null);
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

      if (activeOrg && !isEditMode) {
        setOrgId(activeOrg.id);
        setForm(f => ({
          ...f,
          clinicName: activeOrg.org_name,
          city: activeOrg.city || '',
          country: activeOrg.country || 'Malaysia'
        }));
      }
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
        updated_at: new Date().toISOString()
      };

      let error;

      if (isEditMode && slug) {
        // Update existing
        // We need the ID. Slug might be enough if unique, but let's confirm.
        // Since we trust slug is unique or we can parse ID from it.
        // Let's resolve ID first ideally.
        // BUT if we just use slug logic:
        // If slug is clean, we can query by slug. If slug has ID, we extract ID.

        const jobId = getJobIdFromSlug(slug);

        if (jobId.match(/^[0-9a-f]{8}-/)) {
          // Update by UUID
          const { org_id, ...updatePayload } = payload;
          const { error: updateError, data: updateData } = await supabase.from('jobs').update(updatePayload).eq('id', jobId).select();
          error = updateError;
          if (!error && (!updateData || updateData.length === 0)) {
            error = { message: "Update failed: Job not found or permission denied." } as any;
          }
        } else {
          // Update by slug column
          const { org_id, ...updatePayload } = payload;
          const { error: updateError, data: updateData } = await supabase.from('jobs').update(updatePayload).eq('slug', slug).select();
          error = updateError;
          if (!error && (!updateData || updateData.length === 0)) {
            error = { message: "Update failed: Job not found or permission denied." } as any;
          }
        }
      } else {
        // Create New - use first 8 chars of a generated UUID for consistent slug format
        const roleSlug = form.roleType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        // Generate a UUID-like ID prefix for the slug (will be replaced with actual ID after insert)
        const tempId = crypto.randomUUID().substring(0, 8);
        const newSlug = `${roleSlug}-${tempId}`;

        const { error: insertError } = await supabase.from('jobs').insert({
          ...payload,
          slug: newSlug
        });
        error = insertError;
      }

      if (error) {
        console.error(error);
        alert(`Error ${status === 'published' ? 'publishing' : 'saving'}: ` + error.message);
        // Refund if specific error and was published
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
              <option>Malaysia</option>
              <option>Singapore</option>
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
                value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
              />
              <Input
                label="Salary Max (MYR)"
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

        {activeStep === 3 && (
          <div className="space-y-3 text-sm text-gray-700">
            <p className="text-lg font-semibold text-gray-900">Review</p>
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
    </DashboardShell>
  );
}
