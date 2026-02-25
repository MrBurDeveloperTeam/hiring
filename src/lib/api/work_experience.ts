import { workerGet, workerPost } from './apiClient';
import type { WorkExperience } from '../types';

export async function getWorkExperience(userId: string): Promise<WorkExperience[]> {
    const result = await workerGet(`/api/work-experience?userId=${userId}`);

    return (result.data || []).map((item: any) => ({
        id: item.id,
        companyName: item.company_name,
        jobTitle: item.job_title,
        location: item.location,
        startDate: item.start_date,
        endDate: item.end_date,
        isCurrent: item.is_current,
        description: item.description,
    }));
}

export async function addWorkExperience(_userId: string, exp: Omit<WorkExperience, 'id'>) {
    const result = await workerPost('/api/work-experience', {
        companyName: exp.companyName,
        jobTitle: exp.jobTitle,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        description: exp.description,
    });

    const data = result.data as any;
    return {
        id: data.id,
        companyName: data.company_name,
        jobTitle: data.job_title,
        location: data.location,
        startDate: data.start_date,
        endDate: data.end_date,
        isCurrent: data.is_current,
        description: data.description,
    } as WorkExperience;
}

export async function updateWorkExperience(id: string, exp: Partial<WorkExperience>) {
    const { workerPut } = await import('./apiClient');
    await workerPut(`/api/work-experience/${id}`, {
        companyName: exp.companyName,
        jobTitle: exp.jobTitle,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        description: exp.description,
    });
}

export async function deleteWorkExperience(id: string) {
    const { workerDelete } = await import('./apiClient');
    await workerDelete(`/api/work-experience/${id}`);
}
