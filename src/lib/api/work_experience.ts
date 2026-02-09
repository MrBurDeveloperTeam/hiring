import { supabase } from '../supabase';
import { WorkExperience } from '../types';
import { toPostgresDate } from '../utils';

export async function getWorkExperience(userId: string): Promise<WorkExperience[]> {
    const { data, error } = await (supabase as any)
        .from('work_experience')
        .select('*')
        .eq('job_seeker_id', userId)
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching work experience:', error);
        return [];
    }

    return data.map((item: any) => ({
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

export async function addWorkExperience(userId: string, exp: Omit<WorkExperience, 'id'>) {
    const { data, error } = await (supabase as any)
        .from('work_experience')
        .insert({
            job_seeker_id: userId,
            company_name: exp.companyName,
            job_title: exp.jobTitle,
            location: exp.location,
            start_date: toPostgresDate(exp.startDate),
            end_date: toPostgresDate(exp.endDate),
            is_current: exp.isCurrent,
            description: exp.description,
        })
        .select()
        .single();

    if (error) throw error;

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
    const updates: any = {};
    if (exp.companyName !== undefined) updates.company_name = exp.companyName;
    if (exp.jobTitle !== undefined) updates.job_title = exp.jobTitle;
    if (exp.location !== undefined) updates.location = exp.location;
    if (exp.startDate !== undefined) updates.start_date = toPostgresDate(exp.startDate);
    if (exp.endDate !== undefined) updates.end_date = toPostgresDate(exp.endDate);
    if (exp.isCurrent !== undefined) updates.is_current = exp.isCurrent;
    if (exp.description !== undefined) updates.description = exp.description;

    const { error } = await (supabase as any)
        .from('work_experience')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteWorkExperience(id: string) {
    const { error } = await (supabase as any)
        .from('work_experience')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
