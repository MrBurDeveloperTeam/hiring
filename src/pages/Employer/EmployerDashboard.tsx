import { useEffect, useState } from 'react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { TagPill } from '../../components/TagPill';
import { JobCard } from '../../components/JobCard';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { JobStage } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { getUsersOrganizations } from '../../lib/api/organizations';
import { getJobs, deleteJob } from '../../lib/api/jobs';
import { ChevronsUpDown, Building2, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Modal } from '../../components/ui/modal';
import { Toast } from '../../components/ui/toast';

const sidebarLinks = [
  { to: '/employer/dashboard', label: 'Overview' },
  { to: '/employer/post-job', label: 'Post job' },
  { to: '/employer/applicants', label: 'Applicants' },
  { to: '/employer/team', label: 'Team' },
  { to: '/employer/organization', label: 'Organization Profile' },
  { to: '/jobs', label: 'Job board' }
];

const pipelineStages: JobStage[] = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [activeJobs, setActiveJobs] = useState<any[]>([]); // TODO: type properly with DB types
  const [applications, setApplications] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);

  // Deletion State
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    async function fetchEmployerData() {
      setLoading(true);
      try {
        // 1. Get All Organizations (Owned + Member)
        const orgsData = await getUsersOrganizations(user!.id);
        setAllOrgs(orgsData || []);

        // Resolve Active Org
        let activeOrg = null;
        const storedOrgId = localStorage.getItem('activeOrgId');

        if (storedOrgId && orgsData?.find(o => o.id === storedOrgId)) {
          activeOrg = orgsData.find(o => o.id === storedOrgId);
        } else if (orgsData && orgsData.length > 0) {
          activeOrg = orgsData[0];
        }

        setOrg(activeOrg);

        if (activeOrg) {
          localStorage.setItem('activeOrgId', activeOrg.id);

          // 2. Get Active Jobs
          const { data: jobsData } = await getJobs({
            orgId: activeOrg.id,
            status: 'published',
            limit: 5
          });
          setActiveJobs(jobsData || []);

          // 3. Get Applications via Worker
          const { getCandidatesForOrg } = await import('../../lib/api/applications');
          const candidates = await getCandidatesForOrg(activeOrg.id);
          const formattedApps = (candidates || []).map((c: any) => ({
            id: c.id,
            status: c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase()) : 'Applied',
            name: c.name || 'Unknown',
            school: c.school || 'Unknown School',
            jobTitle: c.jobTitle || 'Unknown Job',
            created_at: c.appliedAt
          }));
          setApplications(formattedApps);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployerData();
  }, [user?.id]);

  const handleOrgSwitch = (orgId: string) => {
    localStorage.setItem('activeOrgId', orgId);
    window.location.reload();
  };

  const handleDeleteJob = (job: any) => {
    setJobToDelete(job);
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      await deleteJob(jobToDelete.id);
      // Refresh list locally to avoid full reload
      setActiveJobs(prev => prev.filter(j => j.id !== jobToDelete.id));
      setToastMessage('Job deleted successfully');
      setToastOpen(true);
    } catch (error) {
      console.error('Error deleting job:', error);
      setToastMessage('Failed to delete job');
      setToastOpen(true);
    } finally {
      setDeleteConfirmationOpen(false);
      setJobToDelete(null);
    }
  };

  if (loading) {
    return (
      <DashboardShell sidebarLinks={sidebarLinks} title="Employer Dashboard">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        </div>
      </DashboardShell>
    );
  }

  // Onboarding View for Users with No Organization
  if (!org) {
    return (
      <DashboardShell sidebarLinks={[]} title="Employer Dashboard">
        <div className="flex h-[80vh] flex-col items-center justify-center text-center p-4">
          <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-brand/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your Employer Dashboard</h1>
            <p className="text-gray-500 mb-8">To start posting jobs and managing candidates, you need to create or join an organization.</p>

            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => window.location.href = '/employer/organization'}
              >
                Create New Organization
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Ask your team administrator to send you an <strong>invite link</strong> to join their organization.
              </p>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const stageCounts = pipelineStages.map((stage) => ({
    stage,
    count: applications.filter((c) => c.status === stage).length
  }));

  const highlightCandidates = applications.slice(0, 3); // Top 3 recent


  return (
    <DashboardShell
      sidebarLinks={sidebarLinks}
      title="Employer Dashboard"
      subtitle="Manage postings and review applicants."
      hideNavigation
      actions={
        <Button variant="primary" className='hover:text-white' asChild icon={<Users className="h-4 w-4" />}>
          <Link to="/employer/team">
            Team
          </Link>
        </Button>
      }
    >
      {/* <Breadcrumbs items={[{ label: 'Employer Home', to: '/employers' }, { label: 'Dashboard' }]} /> */}

      {/* Org Switcher / Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Building2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            {/* Clean Org Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 font-bold text-gray-900 text-xl hover:text-brand transition-colors focus:outline-none">
                  {org.org_name}
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {allOrgs.map((o) => (
                  <DropdownMenuItem key={o.id} onClick={() => handleOrgSwitch(o.id)} className="gap-2 cursor-pointer">
                    <span>{o.org_name}</span>
                    {o.id === org.id && <span className="ml-auto text-xs font-medium text-brand">Active</span>}
                    {o.membership_type === 'member' && <span className="text-xs text-gray-400 border border-gray-200 rounded px-1">Member</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{org.city || 'Malaysia'}</span>
              <span>•</span>
              <span className="capitalize">{org.membership_type === 'member' ? 'Member Access' : 'Owner Access'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Applicants summary</h3>
                <p className="text-sm text-gray-600">
                  {applications.filter((c) => c.status === 'Applied').length} applied -{' '}
                  {applications.filter((c) => c.status === 'Interview').length} interviews scheduled
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/employer/applicants">View applicants</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Active jobs</h3>
              <Badge variant="info">{activeJobs.length} live</Badge>
            </div>
            <div className="mt-3 space-y-3">
              {activeJobs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active jobs found. Post one now!</p>
              ) : (
                activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <JobCard
                      job={job}
                      canEdit={true}
                      onDelete={handleDeleteJob}
                    />
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/jobs/${job.id}`}>Preview</Link>
                      </Button>
                      <Button variant="primary" size="sm" asChild className='hover:text-white'>
                        <Link to={job.slug ? `/employer/applicants/${job.slug}` : `/employer/applicants?jobId=${job.id}`}>Applicants</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pipeline snapshot</h3>
              <Link to="/employer/applicants" className="text-xs font-semibold text-brand hover:text-brand-hover">
                View pipeline
              </Link>
            </div>
            <div className="mt-3 grid gap-2">
              {stageCounts.map((item) => (
                <div key={item.stage} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <span>{item.stage}</span>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Candidate highlights</h3>
              <Badge variant="outline">{applications.length} total</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {highlightCandidates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No applicants yet.</p>
              ) : (
                highlightCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{candidate.name}</p>
                      <p className="text-xs text-gray-500">{candidate.school}</p>
                      <p className="text-[10px] text-gray-400">For: {candidate.jobTitle}</p>
                    </div>
                    <Badge variant="outline">{candidate.status}</Badge>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Updated as of {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastMessage.includes('successfully') ? 'Success' : 'Error'}
        description={toastMessage}
        variant={toastMessage.includes('successfully') ? 'success' : 'error'}
      />

      <Modal
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        title="Delete Job Posting"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this job posting? This action cannot be undone and candidates will no longer be able to apply.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              onClick={confirmDelete}
            >
              Delete Job
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}

// Helper to avoid variable collision rename from 'applications.length' in render
const candidatesLen = 0; // Fixed below: replace with {applications.length} inside render
