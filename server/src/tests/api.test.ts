import request from 'supertest';
import { app } from '../index';
import { db, initDb } from '../db';
import { ProjectRepository } from '../models/Project';

describe('Project API', () => {
    beforeAll(() => {
        initDb();
    });

    beforeEach(() => {
        db.prepare('DELETE FROM projects').run();
    });

    it('GET /api/projects should return empty list initially', async () => {
        const res = await request(app).get('/api/projects');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('POST /api/projects should create a new project', async () => {
        const newProject = {
            name: 'API Test Project',
            description: 'Created via API',
            data: JSON.stringify({ deployments: [] })
        };

        const res = await request(app).post('/api/projects').send(newProject);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(newProject.name);
    });

    it('GET /api/projects/:id should return project details', async () => {
        // Create a project first
        const repo = new ProjectRepository();
        const project = repo.create({
            name: 'Existing Project',
            description: 'For fetching',
            data: '{}'
        });

        const res = await request(app).get(`/api/projects/${project.id}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(project.id);
        expect(res.body.name).toBe('Existing Project');
    });

    it('PUT /api/projects/:id should update project', async () => {
        const repo = new ProjectRepository();
        const project = repo.create({
            name: 'Original Name',
            data: '{}'
        });

        const updates = { name: 'Updated Name' };
        const res = await request(app).put(`/api/projects/${project.id}`).send(updates);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Name');
    });

    it('DELETE /api/projects/:id should remove project', async () => {
        const repo = new ProjectRepository();
        const project = repo.create({
            name: 'To Delete',
            data: '{}'
        });

        const res = await request(app).delete(`/api/projects/${project.id}`);
        expect(res.status).toBe(200); // Or 204

        const checkRes = await request(app).get(`/api/projects/${project.id}`);
        expect(checkRes.status).toBe(404);
    });
});
