import { supabase } from '../supabase';
import type { Database } from '../database.types';
import type { Job } from '../types';
import { getJobIdFromSlug } from '../utils';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

// Helper to map database job + org to frontend Job type
function mapJobToFrontend(job: JobRow, org: OrganizationRow | null): Job {
  // Handle benefits: supports legacy string[] or new { list: string[] } format
  const rawBenefits = job.benefits as any;
  const benefits = Array.isArray(rawBenefits)
    ? rawBenefits
    : (rawBenefits?.list && Array.isArray(rawBenefits.list) ? rawBenefits.list : []);
  const requirements = job.requirements ? job.requirements.split('\n').filter(Boolean) : [];

  // Map employment_type enum to frontend format
  const employmentTypeMap: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    internship: 'Internship',
    contract: 'Contract',
    temporary: 'Temporary',
  };

  // Map experience_level enum to frontend format
  const experienceLevelMap: Record<string, string> = {
    entry: 'New Grad',
    junior: 'Junior',
    mid: 'Mid',
    senior: 'Senior',
  };

  // Format salary range
  const salaryRange =
    job.salary_min && job.salary_max
      ? `${job.currency || 'MYR'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
      : 'Salary not disclosed';

  return {
    id: job.id,
    roleType: job.title,
    clinicName: org?.org_name || 'Unknown Organization',
    city: job.city || '',
    country: job.country || '',
    specialtyTags: job.specialty_tags || [],
    employmentType: (employmentTypeMap[job.employment_type] || job.employment_type) as Job['employmentType'],
    shiftType: (job.shift_type as 'Day' | 'Night' | 'Rotating') || 'Day',
    salaryRange,
    benefits,
    requirements,
    postedAt: job.published_at || job.created_at,
    experienceLevel: (experienceLevelMap[job.experience_level] || job.experience_level) as Job['experienceLevel'],
    newGradWelcome: job.new_grad_welcome,
    trainingProvided: job.training_provided,
    internshipAvailable: job.internship_available || false,
    description: job.description,
    salaryMin: job.salary_min || undefined,
    salaryMax: job.salary_max || undefined,
    orgId: job.org_id,
    logoUrl: org?.logo_url || undefined,
    slug: job.slug || undefined,
  };
}

export async function getJobs(filters?: {
  status?: 'published';
  keyword?: string;
  location?: string;
  specialty?: string;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  newGrad?: boolean;
  training?: boolean;
  internship?: boolean;
  orgId?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Job[]; count: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 6;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('jobs')
    .select(`
      *,
      organizations (
        id,
        org_name,
        city,
        country,
        logo_url
      )
    `, { count: 'exact' });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.keyword) {
    query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
  }

  if (filters?.location) {
    // Search in job city/country OR organization city/country requires a joined filter which is complex in simple queries.
    // For performance, we'll search base columns on jobs table first.
    query = query.or(`city.ilike.%${filters.location}%,country.ilike.%${filters.location}%`);
  }

  if (filters?.specialty) {
    query = query.contains('specialty_tags', [filters.specialty]);
  }

  if (filters?.salaryMin) {
    // Assuming legacy string parsing is handled on insertion, we rely on numeric columns
    query = query.gte('salary_max', filters.salaryMin);
  }

  if (filters?.newGrad) {
    query = query.eq('new_grad_welcome', true);
  }

  if (filters?.training) {
    query = query.eq('training_provided', true);
  }

  if (filters?.internship) {
    query = query.eq('internship_available', true);
  }

  if (filters?.orgId) {
    query = query.eq('org_id', filters.orgId);
  }

  if (filters?.employmentType && filters.employmentType !== '') {
    const empTypeMap: Record<string, string> = {
      'Full-time': 'full_time',
      'Part-time': 'part_time',
      'Internship': 'internship',
      'Contract': 'contract',
      'Temporary': 'temporary',
    };
    query = query.eq('employment_type', (empTypeMap[filters.employmentType] || filters.employmentType) as Database['public']['Enums']['employment_type']);
  }

  if (filters?.experienceLevel && filters.experienceLevel !== '') {
    const expLevelMap: Record<string, string> = {
      'New Grad': 'entry',
      'Junior': 'junior',
      'Mid': 'mid',
      'Senior': 'senior',
    };
    query = query.eq('experience_level', (expLevelMap[filters.experienceLevel] || filters.experienceLevel) as Database['public']['Enums']['experience_level']);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  const jobs = (data || []).map((item: any) => {
    const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
    return mapJobToFrontend(item, org);
  });

  return { data: jobs, count: count || 0 };
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      organizations (
        id,
        org_name,
        city,
        country,
        logo_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }

  const org = Array.isArray((data as any).organizations) ? (data as any).organizations[0] : (data as any).organizations;
  return mapJobToFrontend(data, org);
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const selectQuery = `
      *,
      organizations (
        id,
        org_name,
        city,
        country,
        logo_url
      )
    `;

  // 1. Try finding by exact slug match
  const { data: slugData } = await supabase
    .from('jobs')
    .select(selectQuery)
    .eq('slug', slug)
    .single();

  if (slugData) {
    const org = Array.isArray((slugData as any).organizations) ? (slugData as any).organizations[0] : (slugData as any).organizations;
    return mapJobToFrontend(slugData, org);
  }

  // 2. If not found, try extracting ID (for legacy URLs or un-slugged jobs)
  // Check if the input looks like a UUID or contains one at the end
  const potentialId = getJobIdFromSlug(slug);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(potentialId)) {
    const { data: idData, error } = await supabase
      .from('jobs')
      .select(selectQuery)
      .eq('id', potentialId)
      .single();

    if (idData) {
      const org = Array.isArray((idData as any).organizations) ? (idData as any).organizations[0] : (idData as any).organizations;
      return mapJobToFrontend(idData, org);
    }
  }

  return null;
}

export async function createJob(jobData: {
  org_id: string;
  title: string;
  role_type: Database['public']['Enums']['role_type'];
  employment_type: Database['public']['Enums']['employment_type'];
  experience_level: Database['public']['Enums']['experience_level'];
  description: string;
  specialty_tags?: string[];
  requirements?: string;
  responsibilities?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  city?: string;
  country?: string;
  shift_type?: string;
  benefits?: any;
  new_grad_welcome?: boolean;
  training_provided?: boolean;
  internship_available?: boolean;
  status?: Database['public']['Enums']['job_status'];
  slug: string;
}): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...jobData,
      status: jobData.status || 'draft',
      specialty_tags: jobData.specialty_tags || [],
      benefits: jobData.benefits || {},
    })
    .select(`
      *,
      organizations (
        id,
        org_name,
        city,
        country,
        logo_url
      )
    `)
    .single();

  if (error) {
    console.error('Error creating job:', error);
    throw error;
  }

  const org = Array.isArray((data as any).organizations) ? (data as any).organizations[0] : (data as any).organizations;
  return mapJobToFrontend(data, org);
}

export async function updateJobStatus(id: string, status: Database['public']['Enums']['job_status']): Promise<void> {
  const updateData: any = { status, updated_at: new Date().toISOString() };

  if (status === 'published' && !updateData.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  if (status === 'closed') {
    updateData.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}

export async function saveJob(userId: string, jobId: string): Promise<void> {
  const { error } = await supabase
    .from('job_saves')
    .insert({ user_id: userId, job_id: jobId });

  if (error) {
    // Ignore duplicate key error (already saved)
    if (error.code === '23505') return;
    console.error('Error saving job:', error);
    throw error;
  }
}

export async function unsaveJob(userId: string, jobId: string): Promise<void> {
  const { error } = await supabase
    .from('job_saves')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (error) {
    console.error('Error unsaving job:', error);
    throw error;
  }
}

export async function getSavedJobs(userId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('job_saves')
    .select(`
      job_id,
      jobs (
        *,
        organizations (
          id,
          org_name,
          city,
          country,
          logo_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved jobs:', error);
    throw error;
  }

  return (data || []).map((item: any) => {
    const job = item.jobs;
    // Handle nested arrays if necessary (though single relation)
    const jobData = Array.isArray(job) ? job[0] : job;
    const org = Array.isArray(jobData.organizations) ? jobData.organizations[0] : jobData.organizations;
    return mapJobToFrontend(jobData, org);
  });
}

export async function hideJob(userId: string, jobId: string): Promise<void> {
  const { error } = await supabase
    .from('job_hides')
    .insert({ user_id: userId, job_id: jobId });

  if (error) {
    if (error.code === '23505') return; // Already hidden
    console.error('Error hiding job:', error);
    throw error;
  }
}

export async function unhideJob(userId: string, jobId: string): Promise<void> {
  const { error } = await supabase
    .from('job_hides')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (error) {
    console.error('Error unhiding job:', error);
    throw error;
  }
}

export async function getHiddenJobIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('job_hides')
    .select('job_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching hidden jobs:', error);
    return [];
  }

  return data.map((item: any) => item.job_id);
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}
