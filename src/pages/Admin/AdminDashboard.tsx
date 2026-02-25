import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Tabs } from '../../components/ui/tabs';
import { Pagination } from '../../components/Pagination';
import { getAllOrganizations, updateVerificationStatus } from '../../lib/api/organizations';
import { getAdminStats, AdminStats, getPlatformNotes, createPlatformNote, togglePlatformNote, PlatformNote } from '../../lib/api/admin';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

const ITEMS_PER_PAGE = 15;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('queue');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notes, setNotes] = useState<PlatformNote[]>([]);
  const [notesTab, setNotesTab] = useState<'active' | 'history'>('active');
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgsData, statsData, notesData] = await Promise.all([
        getAllOrganizations(),
        getAdminStats(),
        getPlatformNotes()
      ]);
      setOrganizations(orgsData || []);
      setStats(statsData);
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerification = async (orgId: string, status: 'verified' | 'rejected' | 'pending') => {
    try {
      await updateVerificationStatus(orgId, status);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    try {
      setSavingNote(true);
      await createPlatformNote(newNote);
      setNewNote('');
      const updatedNotes = await getPlatformNotes();
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  const handleToggleNote = async (noteId: string, currentStatus: boolean) => {
    try {
      setNotes(notes.map(n => n.id === noteId ? { ...n, is_done: !currentStatus } : n));
      await togglePlatformNote(noteId, !currentStatus);
    } catch (error) {
      console.error('Error toggling note:', error);
      // Revert on error
      const refreshedNotes = await getPlatformNotes();
      setNotes(refreshedNotes);
    }
  };

  const pendingQueue = organizations.filter(org => org.verified_status === 'pending');
  const history = organizations.filter(org => org.verified_status !== 'pending');

  const activeNotes = notes.filter(n => !n.is_done);
  const historyNotes = notes.filter(n => n.is_done);
  const currentNotes = notesTab === 'active' ? activeNotes : historyNotes;

  const currentList = activeTab === 'queue' ? pendingQueue : history;
  const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE) || 1;
  const paginatedList = currentList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const tabs = [
    { id: 'queue', label: `Verification Queue (${pendingQueue.length})` },
    { id: 'history', label: `Verification History (${history.length})` }
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setCurrentPage(1);
  };

  return (
    <DashboardShell
      sidebarLinks={[]}
      hideNavigation={true}
      title="Admin Console"
      subtitle="Moderation queue, reports, and analytics (mock)."
      actions={<Badge variant="info">UI only</Badge>}
    >
      {/* Analytics at top */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[
          { label: 'Total Jobs', value: stats?.totalJobs || 0 },
          { label: 'Jobs this week', value: stats?.jobsThisWeek || 0 },
          { label: 'Total Seekers', value: stats?.totalSeekers || 0 },
          { label: 'Total Employers', value: stats?.totalEmployers || 0 }
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
            <div className="mt-3 h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(item.value, 150) / 1.5}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
        <div className="space-y-4">
          <Tabs tabs={tabs} active={activeTab} onChange={handleTabChange} />

          <Card className="p-5">
            <div className="divide-y divide-gray-100">
              {loading ? (
                <p className="py-8 text-sm text-gray-500 text-center">Loading...</p>
              ) : paginatedList.length === 0 ? (
                <p className="py-8 text-sm text-gray-500 text-center">
                  {activeTab === 'queue' ? 'No organizations waiting for verification.' : 'No verification history found.'}
                </p>
              ) : (
                paginatedList.map((org) => (
                  <div key={org.id} className="flex items-center justify-between py-4">
                    <Link to={`/organizations/${encodeURIComponent(org.org_name)}`} className="flex-1 flex items-center gap-4 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer group">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-brand/30 transition-colors">
                        {org.logo_url ? (
                          <img
                            src={org.logo_url}
                            alt={org.org_name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-2xl font-semibold text-gray-300">
                            {(org.org_name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 group-hover:text-brand transition-colors">
                          {org.org_name}
                        </p>
                        <p className="text-sm text-gray-600">Type: {org.org_type}</p>
                        {activeTab === 'history' && (
                          <Badge variant={org.verified_status === 'verified' ? 'success' : 'danger'} className="mt-1">
                            {org.verified_status}
                          </Badge>
                        )}
                      </div>
                    </Link>
                    {activeTab === 'queue' ? (
                      <div className="flex gap-2 pl-4">
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerification(org.id, 'verified')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          onClick={() => handleVerification(org.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 pl-4">
                        {org.verified_status === 'verified' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                            onClick={() => handleVerification(org.id, 'pending')}
                          >
                            Unverify
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {!loading && totalPages > 1 && (
              <div className="mt-6">
                <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 h-fit max-h-[calc(100vh-200px)] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Platform notes</h3>
                <p className="text-sm text-gray-600">Action items and policy updates.</p>
              </div>
            </div>

            <div className="mt-4 flex bg-gray-100/50 p-1 rounded-lg">
              <button
                onClick={() => setNotesTab('active')}
                className={cn(
                  "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                  notesTab === 'active' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Active ({activeNotes.length})
              </button>
              <button
                onClick={() => setNotesTab('history')}
                className={cn(
                  "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                  notesTab === 'history' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                History ({historyNotes.length})
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-2">
              {currentNotes.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-8">
                  {notesTab === 'active' ? 'No active notes.' : 'No history found.'}
                </p>
              ) : (
                currentNotes.map((note, index) => {
                  return (
                    <div key={note.id} className={cn(
                      "p-3 rounded-lg text-sm border flex items-center gap-4 transition-all hover:bg-gray-50/50",
                      note.is_done
                        ? "bg-gray-50 border-gray-100 opacity-60"
                        : "bg-white border-gray-200 shadow-sm"
                    )}>
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 font-bold text-xs border border-gray-200">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-gray-800 break-words font-medium leading-relaxed",
                          note.is_done && "line-through text-gray-400 font-normal"
                        )}>
                          {note.content}
                        </p>
                        {note.is_done && (
                          <div className="mt-1">
                            <Badge variant="success" className="text-[9px] py-0 px-1 font-semibold uppercase tracking-wider">Completed</Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-1">
                        <input
                          type="checkbox"
                          checked={!!note.is_done}
                          onChange={() => handleToggleNote(note.id, !!note.is_done)}
                          className="h-5 w-5 rounded-md border-gray-300 text-brand focus:ring-brand cursor-pointer transition-colors"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {notesTab === 'active' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Textarea
                  placeholder="New note..."
                  className="text-sm"
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="mt-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleSaveNote}
                    disabled={savingNote || !newNote.trim()}
                  >
                    {savingNote ? 'Saving...' : 'Post note'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
