import express, { Request, Response } from 'express';
import { ProjectRepository } from '../models/Project';

const router = express.Router();
const projectRepo = new ProjectRepository();

// GET all projects
router.get('/', (req: Request, res: Response) => {
    try {
        const projects = projectRepo.findAll();
        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET project by ID
router.get('/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const project = projectRepo.findById(id);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(project);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST new project
router.post('/', (req: Request, res: Response) => {
    try {
        const { name, description, data } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const project = projectRepo.create({
            name,
            description,
            data: typeof data === 'string' ? data : JSON.stringify(data)
        });

        res.status(201).json(project);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update project
router.put('/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        // Ensure data is stringified if it's an object (though typically it might come as object JSON body)
        // If client sends JSON object for 'data' field, we store it as is if schema allows, but our schema expects TEXT/string
        // The repository expects 'data' to be a string.
        if (updates.data && typeof updates.data !== 'string') {
            updates.data = JSON.stringify(updates.data);
        }

        const updated = projectRepo.update(id, updates);
        if (!updated) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE project
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const success = projectRepo.delete(id);
        if (!success) {
            // It might be idempotent to return 200/204, but strict delete usually 404 if not found
            // For simplicity, we can check if it existed first or just return 200 if delete call succeeded (even if nothing deleted)
            // But repo.delete returns boolean based on changes.
            // Let's return 200 regardless or 404? 
            // Test expects 200, then 404 on get.
            // If repo.delete returns false, it means nothing was deleted (id didn't exist).
            // We can return 404 or just 200. Let's start with 200 for now, but correct HTTP is often 404 if not found.
            // Actually, deleting non-existent resource is often 204 or 404.
            // Let's trust repo.delete result.
            if (!success) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }
        }
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
