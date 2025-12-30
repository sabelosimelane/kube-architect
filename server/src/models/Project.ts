import { db } from '../db';

export interface Project {
    id?: number;
    name: string;
    description?: string;
    data: string; // JSON string of KubeConfig
    created_at?: string;
    updated_at?: string;
}

export class ProjectRepository {
    create(project: Project): Project {
        const stmt = db.prepare(`
      INSERT INTO projects (name, description, data)
      VALUES (@name, @description, @data)
    `);

        // Ensure description is null if undefined for SQLite
        const projectWithDefaults = {
            description: null,
            ...project
        };

        const info = stmt.run(projectWithDefaults);

        return {
            ...project,
            id: info.lastInsertRowid as number,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }


    findAll(): Project[] {
        const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
        return stmt.all() as Project[];
    }

    findById(id: number): Project | undefined {
        const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
        return stmt.get(id) as Project | undefined;
    }

    update(id: number, project: Partial<Project>): Project | undefined {
        const current = this.findById(id);
        if (!current) return undefined;

        const updates: string[] = [];
        const values: any[] = [];

        if (project.name !== undefined) {
            updates.push('name = ?');
            values.push(project.name);
        }
        if (project.description !== undefined) {
            updates.push('description = ?');
            values.push(project.description);
        }
        if (project.data !== undefined) {
            updates.push('data = ?');
            values.push(project.data);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const stmt = db.prepare(`
      UPDATE projects 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

        stmt.run(...values, id);

        return this.findById(id);
    }

    delete(id: number): boolean {
        const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
        const info = stmt.run(id);
        return info.changes > 0;
    }
}
