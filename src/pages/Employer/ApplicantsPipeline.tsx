import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Candidate, JobStage } from '../../lib/types';
import { KanbanBoard } from '../../components/KanbanBoard';
import { CandidateDrawer } from '../../components/CandidateDrawer';
import { Badge } from '../../components/ui/badge';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Toast } from '../../components/ui/toast';
import { ShareModal } from '../../components/ShareModal';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { supabase } from '../../lib/supabase';
import { getCandidatesForOrg, updateApplicationStatus, toggleCandidateFavorite } from '../../lib/api/applications';
import { getUsersOrganizations } from '../../lib/api/organizations';

const sidebarLinks = [
  { to: '/employer/dashboard', label: 'Overview' },
  { to: '/employer/applicants', label: 'Applicants' },
  { to: '/employer/post-job', label: 'Post job' },
  { to: '/employer/organization', label: 'Organization Profile' }
];

export default function ApplicantsPipeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<{ id: string, title: string, slug?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | undefined>();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastOpen, setToastOpen] = useState(false);

  const { slug } = useParams<{ slug: string }>();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const { conversations } = useChat();

  const totalUnreadCount = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  // Get current job title
  const currentJob = jobs.find(j => j.id === selectedJobId);

  // Update URL when filter changes
  const handleJobChange = (jobId: string) => {
    if (!jobId) {
      navigate('/employer/applicants');
      return;
    }
    const job = jobs.find(j => j.id === jobId);
    if (job && job.slug) {
      navigate(`/employer/applicants/${job.slug}`);
    } else {
      // Fallback for no slug
      navigate(`/employer/applicants?jobId=${jobId}`);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        // Get User's Organizations (Owned + Member)
        const orgs = await getUsersOrganizations(user.id);

        if (!orgs || orgs.length === 0) {
          // Handle no org case - maybe redirect or show empty state
          setLoading(false);
          return;
        }

        // Determine active org (from localStorage or default to first)
        const storedOrgId = localStorage.getItem('activeOrgId');
        const activeOrg = orgs.find(o => o.id === storedOrgId) || orgs[0];

        if (activeOrg) {
          setOrgId(activeOrg.id);
          // Fetch candidates and jobs in parallel for the ACTIVE organization
          const [candidatesData, jobsData] = await Promise.all([
            getCandidatesForOrg(activeOrg.id),
            supabase.from('jobs').select('id, title, slug').eq('org_id', activeOrg.id).eq('status', 'published').order('created_at', { ascending: false })
          ]);

          setCandidates(candidatesData);
          // Initialize favorites from data
          setFavoriteIds(candidatesData.filter(c => c.isFavorite).map(c => c.id));

          if (jobsData.data && jobsData.data.length > 0) {
            setJobs(jobsData.data);

            // Determine initial job selection from SLUG or Query Param

            // 1. Try slug first
            let initialJobId = '';

            if (slug) {
              // Try to match slug directly
              const matchedJob = jobsData.data.find(j => j.slug === slug);
              if (matchedJob) {
                initialJobId = matchedJob.id;
              } else {
                // Try parsing ID from slug (legacy or just in case)
                // Simple check if slug ends with UUID
                const match = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
                if (match) {
                  const potentialId = match[1];
                  if (jobsData.data.some(j => j.id === potentialId)) {
                    initialJobId = potentialId;
                  }
                }
              }
            }

            // 2. Fallback to query param
            if (!initialJobId) {
              const urlJobId = searchParams.get('jobId');
              if (urlJobId && jobsData.data.some(j => j.id === urlJobId)) {
                initialJobId = urlJobId;
              }
            }

            // 3. Fallback to first job
            if (!initialJobId) {
              initialJobId = jobsData.data[0].id;
              // Optionally replace URL to show the slug of the first job?
              // Let's not auto-navigate yet to avoid redirect loop issues, just select it in state.
            }

            setSelectedJobId(initialJobId);
          } else {
            setJobs([]);
          }
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.id, slug, searchParams]);

  const handleMove = async (id: string, status: JobStage) => {
    // Optimistic update
    const previousCandidates = [...candidates];
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.status === status) return c;
        setToastMessage(`${c.name} has moved to ${status}`);
        setToastOpen(true);
        return { ...c, status };
      })
    );

    try {
      await updateApplicationStatus(id, status.toLowerCase() as any, user!.id);
    } catch (error) {
      console.error('Error updating status:', error);
      setCandidates(previousCandidates); // Revert
      setToastMessage('Failed to update status');
      setToastOpen(true);
    }
  };

  const toggleFavorite = async (id: string) => {
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return;

    // Determine new state
    const isNowFavorite = !favoriteIds.includes(id);

    // Optimistic Update
    setFavoriteIds((prev) => {
      const next = isNowFavorite ? [...prev, id] : prev.filter((fav) => fav !== id);
      setToastMessage(
        `${candidate.name} ${isNowFavorite ? 'added to' : 'removed from'} favorites`
      );
      setToastOpen(true);
      return next;
    });

    // API Call
    try {
      await toggleCandidateFavorite(id, isNowFavorite);
    } catch (error) {
      console.error('Error toggling favorite', error);
      // Revert on error
      setFavoriteIds((prev) => {
        return isNowFavorite ? prev.filter(fid => fid !== id) : [...prev, id];
      });
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (filteredCandidates.length === 0) {
      setToastMessage('No candidates to export');
      setToastOpen(true);
      return;
    }

    // Define headers
    const headers = ['Name', 'Status', 'Job Title', 'School', 'Grad Date', 'City', 'Rating', 'Notes'];

    // Map data to rows
    const rows = filteredCandidates.map(c => [
      c.name,
      c.status,
      c.jobTitle,
      c.school,
      c.gradDate,
      c.city,
      c.rating,
      c.notes || ''
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        let stringCell = String(cell);
        // Prevent Excel formula injection
        if (/^[=+\-@]/.test(stringCell)) {
          stringCell = "'" + stringCell;
        }
        return `"${stringCell.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `applicants_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter candidates based on selected job - strict filter
  const filteredCandidates = candidates.filter(c => {
    const matchJob = c.jobId === selectedJobId;
    const matchFav = showFavoritesOnly ? favoriteIds.includes(c.id) : true;
    return matchJob && matchFav;
  });

  const appliedCount = filteredCandidates.filter((c) => c.status === 'Applied').length;
  const interviewCount = filteredCandidates.filter((c) => c.status === 'Interview').length;
  const shortlistedCount = filteredCandidates.filter((c) => c.status === 'Shortlisted').length;
  const offerCount = filteredCandidates.filter((c) => c.status === 'Offer').length;
  const recent = filteredCandidates.slice(0, 5);

  if (loading) {
    return (
      <DashboardShell sidebarLinks={sidebarLinks} title="Applicants pipeline" subtitle="Loading..." hideNavigation>
        <p className="p-8 text-center text-gray-500">Loading pipeline...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      sidebarLinks={sidebarLinks}
      title="Applicants pipeline"
      subtitle="Move candidates between stages or open profile details."
      actions={<Badge variant="info">{filteredCandidates.length} candidates</Badge>}
      hideNavigation
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* <Breadcrumbs items={[{ label: 'Employer Home', to: '/employers' }, { label: 'Applicants' }]} /> */}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowShareModal(true)} disabled={!selectedJobId}>
            Invite candidate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(orgId ? `/messages?orgId=${orgId}` : '/messages')}
            className="relative"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
              {totalUnreadCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ml-1">
                  {totalUnreadCount}
                </span>
              )}
            </div>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export list
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Search candidates..." className="min-w-[220px]" />

            <Select
              className="min-w-[200px]"
              value={selectedJobId}
              onChange={(e) => handleJobChange(e.target.value)}
              disabled={jobs.length === 0}
            >
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
              {jobs.length === 0 && <option value="">No active jobs</option>}
            </Select>

            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 bg-white">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm font-medium text-gray-700">Favourites only</span>
            </label>
          </div>
          <div className="text-xs text-gray-500">
            Updated just now - {filteredCandidates.length} total
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Applied</p>
          <p className="text-2xl font-semibold text-gray-900">{appliedCount}</p>
          <p className="text-xs text-gray-500">Awaiting screening</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Shortlisted</p>
          <p className="text-2xl font-semibold text-gray-900">{shortlistedCount}</p>
          <p className="text-xs text-gray-500">Ready for outreach</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Interview</p>
          <p className="text-2xl font-semibold text-gray-900">{interviewCount}</p>
          <p className="text-xs text-gray-500">Next 7 days</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Offers</p>
          <p className="text-2xl font-semibold text-gray-900">{offerCount}</p>
          <p className="text-xs text-gray-500">Pending acceptance</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,300px]">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Pipeline board</p>
              <p className="text-xs text-gray-500">Drag and drop candidates to update their status.</p>
            </div>
            <Badge variant="info">Live view</Badge>
          </div>
          <div className="mt-4">
            <KanbanBoard
              candidates={filteredCandidates}
              onMove={handleMove}
              onView={setSelectedCandidate}
              favorites={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-4">
            <p className="text-sm font-semibold text-gray-900">Recent candidates</p>
            <div className="mt-3 space-y-3">
              {recent.length === 0 ? <p className="text-sm text-gray-500">No recent candidates for this job.</p> : recent.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 text-left text-sm transition hover:border-brand"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.name}</p>
                    <p className="text-xs text-gray-500">{candidate.school}</p>
                    <p className="text-[10px] text-gray-400">For: {candidate.jobTitle}</p>
                  </div>
                  <Badge variant="outline">{candidate.status}</Badge>
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold text-gray-900">Hiring tips</p>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li>Send interview invites within 48 hours of application.</li>
              <li>Use dental-specific screening questions to reduce churn.</li>
              <li>Highlight training provided for new grads.</li>
            </ul>
          </Card>
        </div>
      </div>

      <CandidateDrawer
        candidate={selectedCandidate}
        orgId={orgId}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(undefined)}
        onMove={(id, status) => {
          handleMove(id, status);
          setSelectedCandidate(undefined);
        }}
      />

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        title="Status updated"
        description={toastMessage}
        variant="info"
      />

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={`${window.location.origin}/jobs/${selectedJobId}`}
        title={currentJob?.title || 'Job Opportunity'}
      />
    </DashboardShell>
  );
}
