import { supabase } from '../supabase';
import { Education } from '../types';
import { toPostgresDate } from '../utils';

export async function getEducation(userId: string): Promise<Education[]> {
    const { data, error } = await (supabase as any)
        .from('education')
        .select('*')
        .eq('job_seeker_id', userId)
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching education:', error);
        return [];
    }

    return data.map((item: any) => ({
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

export async function addEducation(userId: string, edu: Omit<Education, 'id'>) {
    const { data, error } = await (supabase as any)
        .from('education')
        .insert({
            job_seeker_id: userId,
            institution_name: edu.institutionName,
            degree: edu.degree,
            field_of_study: edu.fieldOfStudy,
            start_date: toPostgresDate(edu.startDate),
            end_date: toPostgresDate(edu.endDate),
            is_current: edu.isCurrent,
            description: edu.description,
        })
        .select()
        .single();

    if (error) throw error;

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
    const updates: any = {};
    if (edu.institutionName !== undefined) updates.institution_name = edu.institutionName;
    if (edu.degree !== undefined) updates.degree = edu.degree;
    if (edu.fieldOfStudy !== undefined) updates.field_of_study = edu.fieldOfStudy;
    if (edu.startDate !== undefined) updates.start_date = toPostgresDate(edu.startDate);
    if (edu.endDate !== undefined) updates.end_date = toPostgresDate(edu.endDate);
    if (edu.isCurrent !== undefined) updates.is_current = edu.isCurrent;
    if (edu.description !== undefined) updates.description = edu.description;

    const { error } = await (supabase as any)
        .from('education')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteEducation(id: string) {
    const { error } = await (supabase as any)
        .from('education')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
