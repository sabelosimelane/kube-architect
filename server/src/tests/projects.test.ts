import { ProjectRepository } from '../models/Project';
import { db, initDb } from '../db';

// Mock database if not using in-memory or integration test DB
// For this step, we'll try to use the real DB setup but ensuring it's isolated or reset
// Since we are using better-sqlite3 with a file, we might want to use an in-memory DB for testing
// However, the db instance is exported from ../db/index.ts. 
// We might need to refactor db initialization to allow injection or environment based switching.

// For now, let's assume we can import the repository and it fails because it doesn't exist.

describe('ProjectRepository', () => {

    beforeAll(() => {
        initDb();
    });

    beforeEach(() => {
        db.prepare('DELETE FROM projects').run();
    });

    it('should create a project', () => {
        const repo = new ProjectRepository();
        const projectData = {
            name: 'Test Project',
            description: 'A test project',
            data: JSON.stringify({ deployments: [] })
        };

        const project = repo.create(projectData);

        expect(project).toHaveProperty('id');
        expect(project.name).toBe(projectData.name);
        expect(project.data).toBe(projectData.data);
    });

    it('should find all projects', () => {
        const repo = new ProjectRepository();
        const projects = repo.findAll();
        expect(Array.isArray(projects)).toBe(true);
    });
});
