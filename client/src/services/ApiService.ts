import { KubeConfig } from '../utils/localStorage';

export interface ProjectData {
    id: number;
    name: string;
    description?: string;
    data: string; // JSON string
    created_at: string;
    updated_at: string;
}

export class ApiService {
    private static baseUrl = '/api';

    static async getProjects(): Promise<ProjectData[]> {
        const response = await fetch(`${this.baseUrl}/projects`);
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        return response.json();
    }

    static async getProject(id: number): Promise<ProjectData> {
        const response = await fetch(`${this.baseUrl}/projects/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch project ${id}`);
        }
        return response.json();
    }

    static async createProject(name: string, data: KubeConfig): Promise<ProjectData> {
        const response = await fetch(`${this.baseUrl}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                data: JSON.stringify(data)
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to create project');
        }
        return response.json();
    }

    static async updateProject(id: number, data: Partial<KubeConfig>): Promise<ProjectData> {
        // Current backend implementation expects 'data' field to be the full state string.
        // If we want to partial update KubeConfig properties inside the JSON blob, 
        // we normally need to fetch-merge-save or send full object.
        // For now, let's assume 'saveConfig' sends the full state.

        // We also support updating name/description if provided in separate fields, 
        // but here we focus on saving the KubeConfig state.

        const response = await fetch(`${this.baseUrl}/projects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: JSON.stringify(data)
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update project ${id}`);
        }
        return response.json();
    }
}
