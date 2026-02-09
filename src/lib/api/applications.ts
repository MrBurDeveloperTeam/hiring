import { supabase } from '../supabase';
import type { Database } from '../database.types';
import type { Application, Candidate, JobStage } from '../types';

type ApplicationRow = Database['public']['Tables']['applications']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type SeekerProfileRow = Database['public']['Tables']['seeker_profiles']['Row'];

// Helper to map database application to frontend Application type
// Helper to map database application to frontend Application type
function mapApplicationToFrontend(
  app: ApplicationRow,
  profile: Partial<ProfileRow> | null,
  job?: any
): Application {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
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

// Helper to map database application + profile to Candidate type
function mapApplicationToCandidate(
  app: ApplicationRow & { is_favorite?: boolean },
  profile: Partial<ProfileRow> | null,
  seekerProfile: SeekerProfileRow | null,
  job: { title: string } | null,
  resume: { storage_path: string } | null
): Candidate {
  const skills: string[] = [];
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return {
    id: app.id,
    name: profile?.name || 'Unknown',
    school: seekerProfile?.school_name || 'Unknown',
    gradDate: seekerProfile?.expected_graduation_date ? seekerProfile.expected_graduation_date.substring(0, 7) : '',
    skills,
    status: capitalize(app.status) as JobStage,
    rating: 4.0, // Default rating, can be calculated later
    city: '',
    notes: app.employer_notes || undefined,
    jobId: app.job_id,
    jobTitle: job?.title || 'Unknown Role',
    isFavorite: app.is_favorite,
    resumePath: resume?.storage_path,
    seekerId: profile?.user_id
  };
}

export async function getApplications(filters?: {
  job_id?: string;
  org_id?: string;
  seeker_user_id?: string;
  status?: Database['public']['Enums']['application_status'];
}): Promise<Application[]> {
  let query = supabase
    .from('applications')
    .select(`
      *,
      profiles!applications_seeker_user_id_fkey (
        user_id,
        name,
        name
      ),
      jobs!applications_job_id_fkey (
        title,
        city,
        org_id,
        organizations (
          id,
          org_name,
          city,
          state
        )
      )
    `);

  if (filters?.job_id) {
    query = query.eq('job_id', filters.job_id);
  }

  if (filters?.org_id) {
    query = query.eq('org_id', filters.org_id);
  }

  if (filters?.seeker_user_id) {
    query = query.eq('seeker_user_id', filters.seeker_user_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }

  return (data || []).map((item) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    const job = Array.isArray(item.jobs) ? item.jobs[0] : item.jobs;
    return mapApplicationToFrontend(item, profile, job);
  });
}

export async function getCandidatesForOrg(orgId: string): Promise<Candidate[]> {
  // 1. Fetch applications first
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      is_favorite,
      jobs!applications_job_id_fkey (
        title
      ),
      seeker_documents!applications_resume_doc_id_fkey (
        storage_path
      )
    `)
    .eq('org_id', orgId);

  if (appError) {
    console.error('Error fetching candidates (applications):', appError);
    throw appError;
  }

  if (!applications || applications.length === 0) {

    return [];
  }

  // 2. Extract seeker IDs
  const seekerIds = Array.from(new Set(applications.map(app => app.seeker_user_id)));


  // 3. Fetch profiles and seeker_profiles separately
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select(`
      user_id,
      name,
      seeker_profiles (
        school_name,
        expected_graduation_date
      )
    `)
    .in('user_id', seekerIds);

  if (profileError) {
    console.error('Error fetching candidate profiles:', profileError);
  }



  // 4. Map profiles to a dictionary for easy lookup
  const profileMap = new Map();
  if (profiles) {
    profiles.forEach(p => {
      profileMap.set(p.user_id, p);
    });
  }

  // 5. Combine and map
  const candidates: Candidate[] = [];

  applications.forEach((item) => {
    const profile = profileMap.get(item.seeker_user_id);

    // If profile doesn't exist (orphan application), usage Unknown placeholder
    if (!profile) {

    }

    // seeker_profiles is nested inside profile in the result of the second query
    const seekerProfile = profile && 'seeker_profiles' in profile
      ? (Array.isArray(profile.seeker_profiles) ? profile.seeker_profiles[0] : profile.seeker_profiles)
      : null;

    const job = Array.isArray(item.jobs) ? item.jobs[0] : item.jobs;
    const resume = Array.isArray(item.seeker_documents) ? item.seeker_documents[0] : item.seeker_documents;

    candidates.push(mapApplicationToCandidate(item as any, profile, seekerProfile as SeekerProfileRow | null, job, resume as any));
  });

  return candidates;
}

export async function toggleCandidateFavorite(applicationId: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ is_favorite: isFavorite })
    .eq('id', applicationId);

  if (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
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
  const { data, error } = await supabase
    .from('applications')
    .insert({
      ...applicationData,
      status: applicationData.status || 'applied',
      screening_answers: applicationData.screening_answers || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating application:', error);
    throw error;
  }

  // Fetch profile separately to avoid RLS/Join issues in the transaction return
  const { data: profileData } = await supabase
    .from('profiles')
    .select('user_id, name')
    .eq('user_id', applicationData.seeker_user_id)
    .single();

  // Create application event
  await supabase
    .from('application_events')
    .insert({
      application_id: data.id,
      actor_user_id: applicationData.seeker_user_id,
      event_type: 'status_change',
      payload: { status: data.status },
    });

  return mapApplicationToFrontend(data, profileData);
}

export async function updateApplicationStatus(
  id: string,
  status: Database['public']['Enums']['application_status'],
  actorUserId: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('applications')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating application:', updateError);
    throw updateError;
  }

  // Create application event
  await supabase
    .from('application_events')
    .insert({
      application_id: id,
      actor_user_id: actorUserId,
      event_type: 'status_change',
      payload: { status },
    });
}

export async function updateApplicationNotes(
  id: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      employer_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating notes:', error);
    throw error;
  }
}
