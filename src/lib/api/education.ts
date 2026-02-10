import { workerGet, workerPost } from './apiClient';
import type { Education } from '../types';

export async function getEducation(userId: string): Promise<Education[]> {
    const result = await workerGet(`/api/education?userId=${userId}`);

    return (result.data || []).map((item: any) => ({
        id: item.id,
        institutionName: item.institution_name,
        degree: item.degree,
        fieldOfStudy: item.field_of_study,
        startDate: item.start_date,
        endDate: item.end_date,
        isCurrent: item.is_current,
        description: item.description,
    }));
}

export async function addEducation(_userId: string, edu: Omit<Education, 'id'>) {
    const result = await workerPost('/api/education', {
        institutionName: edu.institutionName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        isCurrent: edu.isCurrent,
        description: edu.description,
    });

    const data = result.data as any;
    return {
        id: data.id,
        institutionName: data.institution_name,
        degree: data.degree,
        fieldOfStudy: data.field_of_study,
        startDate: data.start_date,
        endDate: data.end_date,
        isCurrent: data.is_current,
        description: data.description,
    } as Education;
}

export async function updateEducation(id: string, edu: Partial<Education>) {
    const { workerPut } = await import('./apiClient');
    await workerPut(`/api/education/${id}`, {
        institutionName: edu.institutionName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        isCurrent: edu.isCurrent,
        description: edu.description,
    });
}

export async function deleteEducation(id: string) {
    const { workerDelete } = await import('./apiClient');
    await workerDelete(`/api/education/${id}`);
}
