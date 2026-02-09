import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { resumes } from '../../lib/mockData';
import { JobCard } from '../../components/JobCard';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { TagPill } from '../../components/TagPill';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { ApplyModal } from '../../components/ApplyModal';
import { useState, useEffect } from 'react';
import { Job } from '../../lib/types';
import { getJobs } from '../../lib/api/jobs';
import { getApplications } from '../../lib/api/applications';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Building2, MapPin, Users } from 'lucide-react';
import { getSavedJobs, saveJob, unsaveJob, hideJob, unhideJob, getHiddenJobIds } from '../../lib/api/jobs';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../../components/ui/toast';

const steps = [
  { title: 'Create your profile', desc: 'Highlight clinical exposure, rotations, and preferred specialties.' },
  { title: 'Quick apply', desc: 'Reuse your resume and answer dental-specific screening prompts.' },
  { title: 'Track updates', desc: 'See every step, from applied to interview scheduling.' }
];

const highlights = [
  'Internships & attachments',
  'New grad welcome tags',
  'Clinical exposure checklist',
  'Mock resume vault'
];

const categories = ['Ortho', 'Endo', 'Perio', 'Implant', 'GP', 'Reception'];

const testimonials = [
  { name: 'Amira Rahman', role: 'Dental Student', quote: 'Quick apply saved me so much time. Clinics replied faster.' },
  { name: 'Darren Lim', role: 'Dental Assistant', quote: 'Filters are built for dental roles, no generic noise.' }
];

const heroStats = [
  { label: 'Live roles', value: '84' },
  { label: 'Avg. reply time', value: '36 hrs' },
  { label: 'Clinics hiring now', value: '120+' }
];

export default function SeekersLanding() {
  const [hotJobs, setHotJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, userRole, openAuthModal } = useAuth();

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [hiddenJobIds, setHiddenJobIds] = useState<Set<string>>(new Set());
  const [undoableJobIds, setUndoableJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleToggleSave = async (job: Job) => {
    if (!user || userRole !== 'seeker') {
      openAuthModal('login', window.location.pathname);
      return;
    }

    const isSaved = savedJobIds.has(job.id);
    // Optimistic update
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(job.id);
      else next.add(job.id);
      return next;
    });

    try {
      if (isSaved) {
        await unsaveJob(user.id, job.id);
        setToastMessage('Job removed from saved');
        setToastOpen(true);
      } else {
        await saveJob(user.id, job.id);
        setToastMessage('Job saved successfully');
        setToastOpen(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      // Revert on error
      setSavedJobIds(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(job.id);
        else next.delete(job.id);
        return next;
      });
      setToastMessage('Failed to update saved status');
      setToastOpen(true);
    }
  };

  const handleHideJob = async (job: Job) => {
    if (!user || userRole !== 'seeker') {
      openAuthModal('login', window.location.pathname);
      return;
    }

    // Optimistic update: Add to both hidden and undoable
    setHiddenJobIds(prev => new Set(prev).add(job.id));
    setUndoableJobIds(prev => new Set(prev).add(job.id));

    try {
      await hideJob(user.id, job.id);
    } catch (error) {
      console.error('Error hiding job:', error);
      // Revert
      setHiddenJobIds(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
      setUndoableJobIds(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
      setToastMessage('Failed to hide job');
      setToastOpen(true);
    }
  };

  const handleUndoHide = async (job: Job) => {
    // Optimistic revert
    setHiddenJobIds(prev => {
      const next = new Set(prev);
      next.delete(job.id);
      return next;
    });
    setUndoableJobIds(prev => {
      const next = new Set(prev);
      next.delete(job.id);
      return next;
    });

    try {
      await unhideJob(user.id, job.id);
    } catch (error) {
      console.error('Error undoing hide:', error);
      // Revert the revert if failed (re-hide)
      setHiddenJobIds(prev => new Set(prev).add(job.id));
      setUndoableJobIds(prev => new Set(prev).add(job.id));
      setToastMessage('Failed to undo hide');
      setToastOpen(true);
    }
  };

  useEffect(() => {
    async function loadSavedJobsData() {
      if (user && userRole === 'seeker') {
        try {
          const [saved, hidden, applications] = await Promise.all([
            getSavedJobs(user.id),
            getHiddenJobIds(user.id),
            getApplications({ seeker_user_id: user.id })
          ]);
          setSavedJobIds(new Set(saved.map(j => j.id)));
          setHiddenJobIds(new Set(hidden));
          setAppliedJobIds(new Set(applications.map(a => a.jobId)));
        } catch (error) {
          console.error('Error loading user job data:', error);
        }
      } else {
        setSavedJobIds(new Set());
        setHiddenJobIds(new Set());
        setAppliedJobIds(new Set());
      }
    }
    loadSavedJobsData();
  }, [user, userRole]);

  useEffect(() => {
    async function fetchHotRoles() {
      try {
        setLoading(true);
        // 1. Get app counts
        const { data: apps } = await supabase.from('applications').select('job_id');
        const counts: Record<string, number> = {};
        apps?.forEach((a) => {
          counts[a.job_id] = (counts[a.job_id] || 0) + 1;
        });

        // 2. Get all published jobs
        const { data: allJobs } = await getJobs({ status: 'published', limit: 100 });

        // 3. Sort by popularity (app count)
        const sorted = allJobs.sort((a, b) => {
          const countA = counts[a.id] || 0;
          const countB = counts[b.id] || 0;
          return countB - countA;
        });

        // 4. Take top 3
        setHotJobs(sorted.slice(0, 3));
      } catch (err) {
        console.error('Error loading hot roles', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHotRoles();
  }, []);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [showApply, setShowApply] = useState(false);

  return (
    <AppShell background="muted">
      <section className="section relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand/10 via-white to-sky-50 p-6 shadow-sm md:p-10">
        <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
              Job Seeker Hub
            </p>
            <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
              Find dental roles with a clearer, faster path to offers.
            </h1>
            <p className="text-xl text-gray-600">
              Built for dental students, assistants, and coordinators. Discover roles, apply quickly, and stay in control of
              every application.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="xl" onClick={() => navigate('/jobs')} className='hover:text-white'>
                Browse Jobs
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/seekers/dashboard')}>
                Create Profile
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {highlights.map((item) => (
                <TagPill key={item} label={item} />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <Card className="p-6">
              <p className="text-base font-semibold text-gray-900">Featured openings</p>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-xs text-gray-500">Loading...</p>
                ) : hotJobs.length === 0 ? (
                  <p className="text-xs text-gray-500">No active jobs yet.</p>
                ) : (
                  hotJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div>
                        <p className="text-base font-semibold text-gray-900">{job.roleType}</p>
                        <p className="text-sm text-gray-500">{job.clinicName}</p>
                      </div>
                      <span className="text-sm font-semibold text-brand">{job.city}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-semibold text-gray-900">Resume vault</p>
              <p className="mt-2 text-sm text-gray-600">
                Store multiple versions and reuse them for chairside, admin, or internship roles.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand">
                <Sparkles className="h-4 w-4" />
                Smart match recommendations
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="section mt-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-brand">Featured Jobs</p>
            <h2 className="text-3xl font-bold text-gray-900">Hot roles this week</h2>
          </div>
          <Link to="/jobs" className="text-base font-semibold text-brand">
            View all <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading hot roles...</div>
          ) : hotJobs.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No jobs found. Be the first to apply!
            </div>
          ) : (
            hotJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={setSelectedJob}
                isSaved={savedJobIds.has(job.id)}
                onToggleSave={handleToggleSave}
                onHide={handleHideJob}
                isHidden={hiddenJobIds.has(job.id)}
                onUndo={() => handleUndoHide(job)}
                hasApplied={appliedJobIds.has(job.id)}
              />
            ))
          )}
        </div>
        <div className="flex justify-center">
          <Button variant="primary" asChild className='hover:text-white'>
            <Link to="/jobs">View more</Link>
          </Button>
        </div>
      </section>

      <section className="section grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.title} className="mt-8 p-6">
            <p className="text-sm font-semibold text-brand">Step {index + 1}</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{step.title}</p>
            <p className="text-base text-gray-600">{step.desc}</p>
          </Card>
        ))}
      </section>

      <section className="section mt-10 rounded-3xl bg-white/90 p-6 shadow-sm md:p-10">
        <div className="grid gap-6 md:grid-cols-[1.1fr,0.9fr]">
          <div>
            <h3 className="text-3xl font-semibold text-gray-900">Student-friendly features</h3>
            <p className="mt-2 text-base text-gray-600">
              Built for dental hiring workflows, so you only see roles that match your rotations and availability.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <Card className="p-6">
            <p className="text-sm font-semibold text-brand">Quick Apply</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">Apply in minutes, not hours.</p>
            <p className="text-sm text-gray-600">
              Upload a resume, answer screening questions, and track updates in a single feed.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              rightIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => setShowApply(true)}
            >
              Try Quick Apply
            </Button>
          </Card>
        </div>
      </section>

      <section className="section mt-10">
        <h3 className="text-2xl font-semibold text-gray-900">Popular categories</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <TagPill key={cat} label={cat} highlighted />
          ))}
        </div>
      </section>

      <section className="section grid gap-4 md:grid-cols-2">
        {testimonials.map((t) => (
          <Card key={t.name} className="mt-8 p-6">
            <p className="text-sm text-gray-700">"{t.quote}"</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">{t.name}</p>
            <p className="text-xs text-gray-500">{t.role}</p>
          </Card>
        ))}
        <Card className="p-6">
          <p className="text-sm font-semibold text-brand">Ready this week</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">Fresh roles added daily.</p>
          <p className="text-sm text-gray-600">New clinics and internship placements are updated every morning.</p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="/jobs">Explore new roles</Link>
            </Button>
          </div>
        </Card>
      </section>
      <ApplyModal
        open={!!selectedJob || showApply}
        job={selectedJob}
        onClose={() => {
          setSelectedJob(undefined);
          setShowApply(false);
        }}
        resumes={resumes}
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
