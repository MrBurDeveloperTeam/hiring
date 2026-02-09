import { supabase } from '../supabase';
import { Database } from '../database.types';

export async function getOrganizationByName(orgName: string) {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .ilike('org_name', orgName) // Case-insensitive match
        .single();

    if (error) {
        console.error('Error fetching organization by name:', error);
        return null;
    }

    return data;
}

export async function getOrganizationById(orgId: string) {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

    if (error) {
        console.error('Error fetching organization by ID:', error);
        return null;
    }

    return data;
}

// Re-export existing ones if needed or keep separate.
// Ideally we should consolidate, but for now this new file handles the public fetch needs.
// The existing `getUsersOrganizations` was in `organizations.ts` (wait, I haven't seen that file?
// The JobProfile used `import ... from '../../lib/api/organizations'`.
// Ah, I should check if that file exists first! I might be overwriting or duplicating.)
