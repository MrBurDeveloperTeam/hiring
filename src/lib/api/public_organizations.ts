import { workerGetPublic } from './apiClient';

export async function getOrganizationByName(orgName: string) {
    try {
        const result = await workerGetPublic(`/api/organizations?name=${encodeURIComponent(orgName)}`);
        return result.data || null;
    } catch {
        console.error('Error fetching organization by name via worker');
        return null;
    }
}

export async function getOrganizationById(orgId: string) {
    try {
        const result = await workerGetPublic(`/api/organizations/${orgId}`);
        return result.data || null;
    } catch {
        console.error('Error fetching organization by ID via worker');
        return null;
    }
}
