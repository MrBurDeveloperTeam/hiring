import { workerGet, workerPost, workerPut } from './apiClient';
import type { Database } from '../database.types';
import type { Application, Candidate, JobStage } from '../types';

type ApplicationRow = Database['public']['Tables']['applications']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Helper to map Worker response application to frontend Application type
function mapApplicationToFrontend(app: any): Application {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;

  return {
    id: app.id,
    jobId: app.job_id,
    status: capitalize(app.status) as JobStage,
    appliedAt: app.created_at,
    candidateName: profile?.name || 'Unknown',
    jobTitle: job?.title || 'Unknown Job',
    clinicName: job?.organizations?.org_name || 'Unknown Clinic',
    location: job?.city || job?.organizations?.city || '',
    orgId: job?.org_id || job?.organizations?.id || '',
  };
}

export async function getApplications(filters?: {
  job_id?: string;
  org_id?: string;
  seeker_user_id?: string;
  status?: Database['public']['Enums']['application_status'];
}): Promise<Application[]> {
  const params = new URLSearchParams();

  if (filters?.job_id) params.set('jobId', filters.job_id);
  if (filters?.org_id) params.set('orgId', filters.org_id);
  if (filters?.seeker_user_id) params.set('seekerUserId', filters.seeker_user_id);
  if (filters?.status) params.set('status', filters.status);

  const query = params.toString();
  const path = `/api/applications${query ? `?${query}` : ''}`;

  const result = await workerGet(path);

  return (result.data || []).map((item: any) => mapApplicationToFrontend(item));
}

export async function getCandidatesForOrg(orgId: string): Promise<Candidate[]> {
  const result = await workerGet(`/api/applications/candidates?orgId=${orgId}`);

  // Worker already returns mapped candidate data
  return (result.data || []) as Candidate[];
}

export async function toggleCandidateFavorite(applicationId: string, isFavorite: boolean): Promise<void> {
  await workerPut(`/api/applications/${applicationId}/favorite`, { isFavorite });
}

export async function createApplication(applicationData: {
  job_id: string;
  org_id: string;
  seeker_user_id: string;
  resume_doc_id?: string;
  cover_letter?: string;
  screening_answers?: any;
  status?: Database['public']['Enums']['application_status'];
}): Promise<Application> {
  const result = await workerPost('/api/applications', applicationData);
  return mapApplicationToFrontend(result.data);
}

export async function updateApplicationStatus(
  id: string,
  status: Database['public']['Enums']['application_status'],
  _actorUserId: string
): Promise<void> {
  await workerPut(`/api/applications/${id}`, { status });
}

export async function updateApplicationNotes(
  id: string,
  notes: string
): Promise<void> {
  await workerPut(`/api/applications/${id}/notes`, { notes });
}
