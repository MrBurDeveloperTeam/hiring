import { workerGet, workerPost, workerPut, workerDelete, workerFetch } from './apiClient';
import type { Database } from '../database.types';
import type { Job } from '../types';

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
    screening_questions: (job as any).screening_questions || [],
    expiresAt: job.expires_at || undefined,
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
  country?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Job[]; count: number }> {
  const params = new URLSearchParams();

  if (filters?.status) params.set('status', filters.status);
  if (filters?.keyword) params.set('keyword', filters.keyword);
  if (filters?.location) params.set('location', filters.location);
  if (filters?.specialty) params.set('specialty', filters.specialty);
  if (filters?.employmentType) params.set('employmentType', filters.employmentType);
  if (filters?.experienceLevel) params.set('experienceLevel', filters.experienceLevel);
  if (filters?.salaryMin) params.set('salaryMin', String(filters.salaryMin));
  if (filters?.newGrad) params.set('newGrad', 'true');
  if (filters?.training) params.set('training', 'true');
  if (filters?.internship) params.set('internship', 'true');
  if (filters?.orgId) params.set('orgId', filters.orgId);
  if (filters?.country) params.set('country', filters.country);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const path = `/api/jobs${query ? `?${query}` : ''}`;

  const result = await workerGet(path);

  const jobs = (result.data || []).map((item: any) => {
    const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
    return mapJobToFrontend(item, org);
  });

  return { data: jobs, count: result.data?.length || 0 };
}

export async function getJobById(id: string): Promise<Job | null> {
  try {
    const result = await workerGet(`/api/jobs/${id}`);
    if (!result.job) return null;

    const job = result.job as any;
    const org = Array.isArray(job.organizations) ? job.organizations[0] : job.organizations;
    return mapJobToFrontend(job, org);
  } catch {
    return null;
  }
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  try {
    const result = await workerGet(`/api/jobs/slug/${encodeURIComponent(slug)}`);
    if (!result.job) return null;

    const job = result.job as any;
    const org = Array.isArray(job.organizations) ? job.organizations[0] : job.organizations;
    return mapJobToFrontend(job, org);
  } catch {
    return null;
  }
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
  const result = await workerPost('/api/jobs', jobData);
  const data = result.data as any;
  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  return mapJobToFrontend(data, org);
}

export async function updateJobStatus(id: string, status: Database['public']['Enums']['job_status']): Promise<void> {
  await workerPut(`/api/jobs/${id}/status`, { status });
}

export async function saveJob(_userId: string, jobId: string): Promise<void> {
  await workerPost(`/api/jobs/${jobId}/save`);
}

export async function unsaveJob(_userId: string, jobId: string): Promise<void> {
  await workerDelete(`/api/jobs/${jobId}/save`);
}

export async function getSavedJobs(_userId: string): Promise<Job[]> {
  const result = await workerGet('/api/jobs/saved');

  return (result.data || []).map((item: any) => {
    const jobData = item.jobs;
    const job = Array.isArray(jobData) ? jobData[0] : jobData;
    const org = Array.isArray(job?.organizations) ? job.organizations[0] : job?.organizations;
    return mapJobToFrontend(job, org);
  });
}

export async function hideJob(_userId: string, jobId: string): Promise<void> {
  await workerPost(`/api/jobs/${jobId}/hide`);
}

export async function unhideJob(_userId: string, jobId: string): Promise<void> {
  await workerDelete(`/api/jobs/${jobId}/hide`);
}

export async function getHiddenJobIds(_userId: string): Promise<string[]> {
  const result = await workerGet('/api/jobs/hidden');
  return result.data || [];
}

export async function deleteJob(jobId: string): Promise<void> {
  await workerDelete(`/api/jobs/${jobId}`);
}

// Re-export updateJob for general updates (used by PostJob page)
export async function updateJob(jobId: string, jobData: any): Promise<Job> {
  const result = await workerPut(`/api/jobs/${jobId}`, jobData);
  const data = result.data as any;
  const org = Array.isArray(data?.organizations) ? data.organizations[0] : data?.organizations;
  return mapJobToFrontend(data, org);
}
