import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { getPendingOrganizations, updateVerificationStatus } from '../../lib/api/organizations';




const analytics = [
  { label: 'Jobs this week', value: 28 },
  { label: 'New students', value: 64 },
  { label: 'Resume views', value: 120 },
  { label: 'Reports filed', value: 3 }
];

export default function AdminDashboard() {
  const [platformNotes, setPlatformNotes] = useState('Align templates and pricing across markets.');
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const data = await getPendingOrganizations();
      setPendingOrgs(data || []);
    } catch (error) {
      console.error('Error fetching pending orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerification = async (orgId: string, status: 'verified' | 'rejected') => {
    try {
      await updateVerificationStatus(orgId, status);
      // Refresh list
      fetchPending();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <DashboardShell
      sidebarLinks={[]}
      hideNavigation={true}
      title="Admin Console"
      subtitle="Moderation queue, reports, and analytics (mock)."
      actions={<Badge variant="info">UI only</Badge>}
    >
      {/* <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Overview' }]} /> */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Verification Queue</h3>
            <Badge variant="warning">{pendingOrgs.length} pending</Badge>
          </div>
          <div className="mt-3 divide-y divide-gray-100">
            {pendingOrgs.length === 0 ? (
              <p className="py-4 text-sm text-gray-500 text-center">No organizations waiting for verification.</p>
            ) : (
              pendingOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between py-3">
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
                    </div>
                  </Link>
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
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-gray-900">Platform notes</h3>
          <p className="text-sm text-gray-600">Document moderation cues and policy reminders for the admin team.</p>
          <Textarea
            className="mt-3"
            label="Notes"
            value={platformNotes}
            onChange={(e) => setPlatformNotes(e.target.value)}
          />
          <div className="mt-3">
            <Button variant="primary">Save notes (mock)</Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {analytics.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
            <div className="mt-3 h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(item.value, 120) / 1.2}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Textarea label="Escalations" placeholder="Notes on flagged jobs or resumes" />
          <Textarea label="Follow-ups" placeholder="Reminders for the admin team" />
        </div>
        <div className="mt-3">
          <Button variant="primary">Save notes (mock)</Button>
        </div>
      </Card>
    </DashboardShell>
  );
}
