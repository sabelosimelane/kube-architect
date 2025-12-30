import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../services/ApiService';

global.fetch = vi.fn();

describe('ApiService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should fetch all projects', async () => {
        const mockProjects = [{ id: 1, name: 'Project 1' }];
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockProjects,
        });

        const projects = await ApiService.getProjects();
        expect(projects).toEqual(mockProjects);
        expect(global.fetch).toHaveBeenCalledWith('/api/projects');
    });

    it('should create a project', async () => {
        const mockProject = { id: 1, name: 'New Project' };
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockProject,
        });

        const config: any = { deployments: [] };
        const project = await ApiService.createProject('New Project', config);

        expect(project).toEqual(mockProject);
        expect(global.fetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                name: 'New Project',
                data: JSON.stringify(config)
            })
        }));
    });
});
