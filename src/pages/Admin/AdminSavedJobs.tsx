import { useState, useEffect } from 'react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Pagination } from '../../components/Pagination';
import { getSavedJobs, unsaveJob } from '../../lib/api/jobs';
import { JobCard } from '../../components/JobCard';
import { useAuth } from '../../contexts/AuthContext';
import { Job } from '../../lib/types';
import { Toast } from '../../components/ui/toast';

const ITEMS_PER_PAGE = 20;

export default function AdminSavedJobs() {
    const { user } = useAuth();
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        async function fetchSavedJobs() {
            if (!user?.id) return;
            try {
                setLoading(true);
                const data = await getSavedJobs(user.id);
                setSavedJobs(data);
            } catch (error) {
                console.error('Error fetching saved jobs:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchSavedJobs();
    }, [user?.id]);

    const handleUnsave = async (job: Job) => {
        if (!user?.id) return;
        if (window.confirm('Remove this job from your saved list?')) {
            try {
                await unsaveJob(user.id, job.id);
                setSavedJobs(prev => prev.filter(j => j.id !== job.id));
                setToastMessage('Job removed from saved');
                setToastOpen(true);
            } catch (error) {
                console.error('Error unsaving job:', error);
                setToastMessage('Failed to remove job');
                setToastOpen(true);
            }
        }
    };

    const totalPages = Math.ceil(savedJobs.length / ITEMS_PER_PAGE) || 1;
    const paginatedList = savedJobs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <DashboardShell
            sidebarLinks={[]}
            hideNavigation={true}
            title="Saved Jobs"
            subtitle="Manage the jobs you've saved for later."
            actions={<Badge variant="info">{savedJobs.length} Saved</Badge>}
        >
            <div className="space-y-4">
                {loading ? (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
                        <p className="text-sm text-gray-500">Loading saved jobs...</p>
                    </div>
                ) : paginatedList.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
                        <p className="text-sm text-gray-500">
                            You haven't saved any jobs yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {paginatedList.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                isSaved={true}
                                onToggleSave={() => handleUnsave(job)}
                            />
                        ))}
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
                    </div>
                )}
            </div>

            <Toast
                open={toastOpen}
                onClose={() => setToastOpen(false)}
                title={toastMessage.includes('Failed') ? 'Error' : 'Success'}
                description={toastMessage}
                variant={toastMessage.includes('Failed') ? 'error' : 'success'}
            />
        </DashboardShell>
    );
}
