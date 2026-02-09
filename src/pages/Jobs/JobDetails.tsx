import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { Badge } from '../../components/ui/badge';
import { TagPill } from '../../components/TagPill';
import { Button } from '../../components/ui/button';
import { ApplyModal } from '../../components/ApplyModal';
import { Building2, MapPin, Share2, ShieldCheck, Sparkles, Star, Wallet, Check } from 'lucide-react';
import { Job } from '../../lib/types';
import { timeAgo } from '../../lib/utils';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { getJobById, getJobBySlug, getJobs, saveJob, unsaveJob, getSavedJobs } from '../../lib/api/jobs';
import { getUserDocuments } from '../../lib/api/profiles';

import { getApplications } from '../../lib/api/applications';
import { getJobIdFromSlug } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../../components/ui/toast';

import { ShareModal } from '../../components/ShareModal';

export default function JobDetails() {
  const { slug } = useParams<{ slug: string }>();
  const id = slug ? getJobIdFromSlug(slug) : undefined;
  const { user, userRole, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function loadJob() {
      if (!slug) return;
      try {
        setLoading(true);

        // Determine if we should fetch by ID or Slug
        // If it looks like a UUID or ends with UUID, try ID first (legacy support)
        const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
        const isUuid = !!uuidMatch;
        const lookupId = uuidMatch ? uuidMatch[1] : undefined;

        let jobData: Job | null = null;

        if (isUuid && lookupId) {
          jobData = await getJobById(lookupId);
        } else {
          jobData = await getJobBySlug(slug);
        }

        // If we found a job, use its ID for related queries
        const realId = jobData?.id;

        // Fetch saved status and application status in parallel if job found
        const [savedJobs, applications] = await Promise.all([
          user && userRole === 'seeker' ? getSavedJobs(user.id) : Promise.resolve([]),
          user && userRole === 'seeker' && realId ? getApplications({ seeker_user_id: user.id, job_id: realId }) : Promise.resolve([])
        ]);

        setJob(jobData);

        if (jobData) {
          // Check if saved
          if (savedJobs.some(s => s.id === id)) {
            setIsSaved(true);
          } else {
            setIsSaved(false);
          }

          // Check if already applied
          if (applications.length > 0) {
            setHasApplied(true);
          } else {
            setHasApplied(false);
          }

          // Load similar jobs (same specialty tags)
          const { data: allJobs } = await getJobs({ status: 'published', limit: 20 });
          const similar = allJobs
            .filter((j) => j.id !== jobData.id && j.specialtyTags.some((tag) => jobData.specialtyTags.includes(tag)))
            .slice(0, 3);
          setSimilarJobs(similar);
        }
      } catch (error) {
        console.error('Error loading job:', error);
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id, user?.id, userRole]);

  useEffect(() => {
    async function loadResumes() {
      try {
        if (user && userRole === 'seeker') {
          const docs = await getUserDocuments(user.id);
          setResumes(docs);
        }
      } catch (error) {
        console.error('Error loading resumes:', error);
      }
    }
    loadResumes();
  }, [user?.id, userRole]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [id]);

  const handleToggleSave = async () => {
    if (!job) return;
    if (!user || userRole !== 'seeker') {
      openAuthModal('login', window.location.pathname);
      return;
    }

    const newSavedState = !isSaved;
    setIsSaved(newSavedState); // Optimistic

    try {
      if (newSavedState) {
        await saveJob(user.id, job.id);
        setToastMessage('Job saved successfully');
        setToastOpen(true);
      } else {
        await unsaveJob(user.id, job.id);
        setToastMessage('Job removed from saved');
        setToastOpen(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setIsSaved(!newSavedState); // Revert
      setToastMessage('Failed to update saved status');
      setToastOpen(true);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
          <p className="text-lg font-semibold text-gray-900">Loading job...</p>
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
          <p className="text-lg font-semibold text-gray-900">Job not found</p>
          <p className="text-sm text-gray-600">This posting is unavailable. Browse other roles instead.</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/jobs')}>
            Back to jobs
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell padded background="muted">
      <div className="mb-3 flex items-center justify-between">
        {/* <Breadcrumbs items={[{ label: 'Home', to: '/seekers' }, { label: 'Jobs', to: '/jobs' }, { label: job.roleType }]} /> */}
        <Link to="/jobs" className="text-xs font-semibold text-brand hover:text-brand-hover">
          Back to jobs
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{job.roleType}</h1>
                <Link
                  to={`/organizations/${encodeURIComponent(job.clinicName)}`}
                  className="mt-2 text-lg font-medium text-brand bg-brand/5 px-2 py-0.5 rounded-md w-fit hover:bg-brand/10 transition-colors block"
                >
                  {job.clinicName}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-brand" />
                    {job.employmentType}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-brand" />
                    {job.city}, {job.country}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Star className="h-4 w-4" />
                    {job.experienceLevel}
                  </span>
                  <span className="text-xs text-gray-500">Posted {timeAgo(job.postedAt)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="default">{job.salaryRange}</Badge>
                <div className="flex gap-2">
                  {job.newGradWelcome && <Badge variant="info">New grad welcome</Badge>}
                  {job.trainingProvided && <Badge variant="success">Training provided</Badge>}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-700">{job.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.specialtyTags.map((tag) => (
                <TagPill key={tag} label={tag} />
              ))}
            </div>

            <div className="mt-5 grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">Requirements</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {job.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-brand" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Benefits</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {job.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-brand" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Similar jobs</h3>
            <div className="grid gap-3">
              {similarJobs.map((similar) => (
                <Link
                  key={similar.id}
                  to={`/jobs/${similar.id}`}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{similar.roleType}</p>
                      <p className="text-xs text-gray-600">
                        {similar.clinicName} - {similar.city}
                      </p>
                    </div>
                    <Badge variant="outline">{similar.salaryRange}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {similar.specialtyTags.slice(0, 3).map((tag) => (
                      <TagPill key={tag} label={tag} />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-gray-900">Ready to apply?</p>
            <p className="text-sm text-gray-600">Submit your resume with screening answers.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant={hasApplied ? "outline" : "primary"}
                rightIcon={hasApplied ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                disabled={hasApplied}
                onClick={() => {
                  if (hasApplied) return;

                  if (!user || userRole !== 'seeker') {
                    if (id) {
                      openAuthModal('login', `/jobs/${id}`);
                    } else {
                      openAuthModal('login', '/jobs');
                    }
                    return;
                  }

                  setShowApply(true);
                }}
              >
                {hasApplied ? 'Applied' : 'Quick apply'}
              </Button>
              <Button
                variant={isSaved ? "primary" : "outline"}
                onClick={handleToggleSave}
              >
                {isSaved ? 'Saved' : 'Save job'}
              </Button>
              <Button
                variant="ghost"
                icon={<Share2 className="h-4 w-4" />}
                onClick={() => setShareModalOpen(true)}
              >
                Share
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">About the clinic</p>
            <p className="mt-2 text-sm text-gray-700">
              {job.clinicName} is a multi-chair practice focused on digital workflows and patient experience. They value
              calm, organized chairside support and offer structured onboarding for new hires.
            </p>
          </div>
        </div>
      </div>

      <ApplyModal
        open={showApply}
        job={job as Job}
        onClose={() => setShowApply(false)}
        resumes={resumes}
        onSuccess={() => setHasApplied(true)}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        url={window.location.href}
        title={`${job.roleType} at ${job.clinicName}`}
      />

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastMessage.includes('successfully') ? 'Success' : toastMessage.includes('removed') ? 'Success' : 'Error'}
        description={toastMessage}
        variant={toastMessage.includes('successfully') || toastMessage.includes('removed') ? 'success' : 'error'}
      />
    </AppShell>
  );
}
