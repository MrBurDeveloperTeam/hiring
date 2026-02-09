import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { Job, Resume } from '../../lib/types';
import { JobCard } from '../../components/JobCard';
import { JobFilters, JobFilterState } from '../../components/JobFilters';
import { Pagination } from '../../components/Pagination';
import { ApplyModal } from '../../components/ApplyModal';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { getJobs, saveJob, unsaveJob, getSavedJobs, hideJob, unhideJob, getHiddenJobIds, deleteJob } from '../../lib/api/jobs';
import { getUserDocuments } from '../../lib/api/profiles';
import { getApplications } from '../../lib/api/applications';
import { getUsersOrganizations } from '../../lib/api/organizations';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../../components/ui/toast';

const defaultFilters: JobFilterState = {
  keyword: '',
  location: '',
  specialty: '',
  employmentType: '',
  shiftType: '',
  newGrad: false,
  training: false,
  internship: false,
  experienceLevel: '',
  salaryMin: 0
};

export default function JobsList() {
  const { user, userRole, openAuthModal } = useAuth();
  const [filters, setFilters] = useState<JobFilterState>(defaultFilters);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 6;

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [hiddenJobIds, setHiddenJobIds] = useState<Set<string>>(new Set());
  const [undoableJobIds, setUndoableJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userOrgIds, setUserOrgIds] = useState<Set<string>>(new Set());

  const handleApplyClick = (job: Job) => {
    if (!user || userRole !== 'seeker') {
      openAuthModal('login', '/jobs');
    } else {
      setSelectedJob(job);
    }
  };

  const handleToggleSave = async (job: Job) => {
    if (!user || userRole !== 'seeker') {
      openAuthModal('login', '/jobs');
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
      openAuthModal('login', '/jobs');
      return;
    }

    // Optimistic update: Add to both hidden and undoable
    setHiddenJobIds(prev => new Set(prev).add(job.id));
    setUndoableJobIds(prev => new Set(prev).add(job.id));

    try {
      await hideJob(user.id, job.id);
      // No toast needed as the UI updates in-place
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

  const handleDeleteJob = async (job: Job) => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;

    try {
      await deleteJob(job.id);
      setJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
      setToastMessage('Job deleted successfully');
      setToastOpen(true);
    } catch (error) {
      console.error('Error deleting job:', error);
      setToastMessage('Failed to delete job');
      setToastOpen(true);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const apiCalls: Promise<any>[] = [
          getJobs({
            status: 'published',
            page,
            limit: pageSize,
            ...filters
          })
        ];

        if (user && userRole === 'seeker') {
          apiCalls.push(getSavedJobs(user.id));
          apiCalls.push(getHiddenJobIds(user.id));
          apiCalls.push(getUserDocuments(user.id));
          apiCalls.push(getApplications({ seeker_user_id: user.id }));
        }

        if (user && userRole === 'employer') {
          apiCalls.push(getUsersOrganizations(user.id));
        }

        const results = await Promise.all(apiCalls);
        const { data: jobsData, count } = results[0];
        setJobs(jobsData);
        // Calculate total pages based on count
        // Note: we can store totalCount state if needed, but for now we just need totalPages
        // Since totalPages is derived, we need a state for it if it comes from server
        // Let's add setTotalPages state

        if (userRole === 'seeker') {
          if (results[1]) setSavedJobIds(new Set(results[1].map((j: any) => j.id)));
          if (results[2]) setHiddenJobIds(new Set(results[2]));
          if (results[3]) setResumes(results[3]);
          if (results[4]) setAppliedJobIds(new Set(results[4].map((a: any) => a.jobId)));
        }

        if (userRole === 'employer') {
          // If seeker calls were skipped, result index depends. 
          // But actually we are pushing to apiCalls. 
          // Let's rely on array length or just check the last item if we are sure order.
          // Better to manage indexes more safely or check data shape.
          // Since we branch on role:
          const orgs = results[results.length - 1]; // It will be the last pushed
          if (Array.isArray(orgs) && orgs.length > 0 && 'org_name' in orgs[0]) {
            setUserOrgIds(new Set(orgs.map((o: any) => o.id)));
          } else if (Array.isArray(orgs) && orgs.length === 0) {
            setUserOrgIds(new Set());
          }
        }

        // Return count to update totalPages
        return count;

      } catch (error) {
        console.error('Error loading jobs:', error);
        return 0;
      } finally {
        setLoading(false);
      }
    }

    loadData().then(count => {
      setTotalCount(count);
    });
  }, [user?.id, userRole, filters, page]); // Depend on filters and page to trigger refetch

  // Removed filteredJobs useMemo as filtering is server-side

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // pageJobs is now just 'jobs' because we only fetch the current page
  const pageJobs = jobs;

  const handleFilterChange = (val: JobFilterState) => {
    setFilters(val);
    setPage(1);
  };

  const resetFilters = () => setFilters(defaultFilters);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [page]);

  return (
    <AppShell padded background="muted">
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs and Title removed as per user request */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>

            <h1 className="text-2xl font-bold text-gray-900">Find your next dental role</h1>
            <p className="text-sm text-gray-600">
              {loading ? 'Loading jobs...' : `${totalCount} jobs - filters update instantly`}
            </p>
          </div>
        </div>

        <JobFilters
          values={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="grid gap-4">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              Loading jobs...
            </div>
          ) : (
            <>
              {pageJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={handleApplyClick}
                  isSaved={savedJobIds.has(job.id)}
                  onToggleSave={handleToggleSave}
                  onHide={handleHideJob}
                  isHidden={hiddenJobIds.has(job.id)}
                  onUndo={() => handleUndoHide(job)}
                  hasApplied={appliedJobIds.has(job.id)}
                  onDelete={handleDeleteJob}
                  canEdit={userOrgIds.has(job.orgId)}
                />
              ))}
              {pageJobs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                  No jobs match these filters. Try clearing some options.
                </div>
              )}
            </>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <ApplyModal
        open={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJob(undefined)}
        resumes={resumes}
        onSuccess={() => {
          if (selectedJob) {
            setAppliedJobIds(prev => new Set(prev).add(selectedJob.id));
          }
        }}
      />

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastMessage.includes('hidden') ? 'Job Hidden' : toastMessage.includes('successfully') ? 'Success' : toastMessage.includes('removed') ? 'Success' : 'Error'}
        description={toastMessage}
        variant={toastMessage.includes('FAILED') ? 'error' : 'success'}
        action={undefined}
      />
    </AppShell>
  );
}
