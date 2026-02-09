
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { getAllOrganizations } from '../../lib/api/organizations';
import { Building2, Search, MapPin, CheckCircle2, Clock } from 'lucide-react';

export default function OrganizationsList() {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getAllOrganizations();
                setOrganizations(data || []);
            } catch (error) {
                console.error('Error loading organizations:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const filteredOrgs = organizations.filter(org =>
        org.org_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardShell
            sidebarLinks={[]}
            hideNavigation={true}
            title="All Organizations"
            subtitle="Manage and view all registered organizations."
        >
            {/* <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Organizations' }]} /> */}

            <div className="mt-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search organizations by name or location..."
                        className="pl-10 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading organizations...</div>
            ) : filteredOrgs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                    <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No organizations found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredOrgs.map((org) => (
                        <Link
                            key={org.id}
                            to={`/organizations/${encodeURIComponent(org.org_name)}`}
                            className="block"
                        >
                            <Card className="p-4 hover:border-brand/40 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
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

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-brand transition-colors">
                                                {org.org_name}
                                            </h3>
                                            {org.verified_status === 'verified' && (
                                                <CheckCircle2 className="h-4 w-4 text-brand" />
                                            )}
                                            {org.verified_status === 'pending' && (
                                                <Badge variant="warning" className="text-xs py-0 h-5">Pending</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span className="capitalize flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {org.org_type?.replace('_', ' ')}
                                            </span>
                                            {(org.city || org.state) && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {[org.city, org.state].filter(Boolean).join(', ')}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                Joined {new Date(org.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="hidden sm:block">
                                        <Button variant="ghost" size="sm" className="text-gray-400 group-hover:text-brand">
                                            View Profile
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </DashboardShell>
    );
}
