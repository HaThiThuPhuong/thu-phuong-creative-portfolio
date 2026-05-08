import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from './src/lib/db.ts';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDb();

  app.use(express.json({ limit: '50mb' }));

  // Auth simple implementation
  const ADMIN_PWD = process.env.ADMIN_PASSWORD || 'thuphuongadmin';
  const SESSION_TOKEN = 'secret_session_token_thuphuong';

  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PWD) {
      res.json({ 
        token: SESSION_TOKEN, 
        user: { 
          uid: 'admin',
          email: 'thuphuong342005@gmail.com', 
          displayName: 'Thu Phương (Admin)',
          isAdmin: true
        } 
      });
    } else {
      res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization;
    if (token === SESSION_TOKEN) {
      res.json({ 
        uid: 'admin',
        email: 'thuphuong342005@gmail.com', 
        displayName: 'Thu Phương (Admin)',
        isAdmin: true
      });
    } else {
      res.status(401).json({ error: 'Not logged in' });
    }
  });

  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // For local dev and simple usage, we allow GET always, but protect mutations
    if (req.method === 'GET') return next();
    
    const token = req.headers.authorization;
    if (token === SESSION_TOKEN) {
      next();
    } else {
      res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện thao tác này' });
    }
  };

  const safeParse = (str: string | null | undefined, fallback: any) => {
    try {
      if (!str || typeof str !== 'string') return fallback;
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  };

  // API Routes
  app.get('/api/profile', (req, res) => {
    try {
      const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get() as any;
      if (profile) {
        profile.subjects = safeParse(profile.subjects, []);
      }
      res.json(profile || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/profile', authMiddleware, (req, res) => {
    const fields = Object.keys(req.body);
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    try {
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => {
        const val = req.body[field];
        return typeof val === 'object' ? JSON.stringify(val) : val;
      });

      // Simple one-row profile update (id is always 1)
      const existing = db.prepare('SELECT id FROM profile WHERE id = 1').get();
      if (existing) {
        db.prepare(`UPDATE profile SET ${setClause} WHERE id = 1`).run(...values);
      } else {
        const cols = fields.join(', ');
        const placeholders = fields.map(() => '?').join(', ');
        db.prepare(`INSERT INTO profile (${cols}) VALUES (${placeholders})`).run(...values);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/assets', (req, res) => {
    try {
      const { type } = req.query;
      let assets;
      if (type) {
        assets = db.prepare('SELECT * FROM assets WHERE type = ?').all(type) as any[];
      } else {
        assets = db.prepare('SELECT * FROM assets').all() as any[];
      }
      res.json((assets || []).map((a: any) => ({
        ...a,
        id: String(a.id),
        urls: safeParse(a.urls, []),
        metadata: safeParse(a.metadata, {})
      })));
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Extract metadata from Facebook/Instagram
  app.post('/api/assets/extract', authMiddleware, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const html = await response.text();
      const $ = cheerio.load(html);

      const ogImage = $('meta[property="og:image"]').attr('content');
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');

      // Mocking multiple images for demonstration of multi-select
      // In a real scraper, we would find all gallery images
      const images = [ogImage].filter(Boolean);
      if (images.length > 0) {
        // Just for demo purposes, if it's a "gallery" request we might simulate finding more
        // Since we can't truly scrape FB dynamic content easily without headless browser
        images.push(`https://picsum.photos/seed/${Math.random()}/800/1000`);
        images.push(`https://picsum.photos/seed/${Math.random()}/800/1000`);
      }

      res.json({
        imageUrl: ogImage || '',
        urls: images, // Multiple images
        title: ogTitle || '',
        description: ogDescription || '',
        facebookLink: url
      });
    } catch (error) {
      console.error('Extraction error:', error);
      res.status(500).json({ error: 'Could not extract metadata' });
    }
  });

  const handleUpsert = (table: string, req: express.Request, res: express.Response) => {
    try {
      // Get table info to filter valid columns
      const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      const validCols = new Set(tableInfo.map(info => info.name));
      const colTypes = tableInfo.reduce((acc, info) => {
        acc[info.name] = info.type.toUpperCase();
        return acc;
      }, {} as Record<string, string>);

      // ID resolution
      const paramId = req.params.id;
      if (paramId) req.body.id = paramId;

      // Ensure we have an ID if it's a primary key table
      if (validCols.has('id') && !req.body.id) {
        req.body.id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const fields = Object.keys(req.body).filter(field => validCols.has(field));
      
      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

      const cols = fields.join(', ');
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map(field => {
        let val = req.body[field];
        
        // Handle JSON fields
        if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
          return JSON.stringify(val);
        }

        // Handle numeric fields based on schema
        if (colTypes[field] === 'INTEGER') {
           if (val === null || val === undefined || val === '') return null;
           const num = parseInt(val, 10);
           return isNaN(num) ? val : num; 
        }

        // Handle text fields - ensure string
        if (colTypes[field] === 'TEXT' && val !== null && val !== undefined) {
           return String(val);
        }

        return val;
      });

      const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`);
      stmt.run(...values);
      res.json({ success: true, id: String(req.body.id) });
    } catch (error) {
      console.error(`Error upserting into ${table}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  // Manage assets
  app.post('/api/assets', authMiddleware, (req, res) => {
    handleUpsert('assets', req, res);
  });

  app.put('/api/assets/:id', authMiddleware, (req, res) => {
    // For specific PUT, we can still use dynamic update or just redirect to upsert
    handleUpsert('assets', req, res);
  });

  app.delete('/api/assets/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM assets WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/calendar', (req, res) => {
    try {
      const calendar = db.prepare('SELECT * FROM calendar ORDER BY date_str ASC').all() as any[];
      res.json((calendar || []).map(c => ({ ...c, id: String(c.id) })));
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/calendar', authMiddleware, (req, res) => {
    handleUpsert('calendar', req, res);
  });

  app.delete('/api/calendar/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM calendar WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting calendar:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/services', (req, res) => {
    try {
      const { mode } = req.query;
      let services;
      if (mode) {
        services = db.prepare('SELECT * FROM services WHERE mode = ?').all(mode) as any[];
      } else {
        services = db.prepare('SELECT * FROM services').all() as any[];
      }
      res.json((services || []).map((s: any) => ({
        ...s,
        id: String(s.id),
        benefits: safeParse(s.benefits, [])
      })));
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/services', authMiddleware, (req, res) => {
    handleUpsert('services', req, res);
  });

  app.put('/api/services/:id', authMiddleware, (req, res) => {
    handleUpsert('services', req, res);
  });

  app.delete('/api/services/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM services WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/milestones', (req, res) => {
    try {
      const { mode } = req.query;
      let milestones;
      if (mode) {
        milestones = db.prepare('SELECT * FROM career_milestones WHERE mode = ? ORDER BY year DESC').all(mode) as any[];
      } else {
        milestones = db.prepare('SELECT * FROM career_milestones ORDER BY year DESC').all() as any[];
      }
      res.json((milestones || []).map((m: any) => ({
        ...m,
        id: String(m.id),
        projects: safeParse(m.projects, [])
      })));
    } catch (error) {
      console.error('Error fetching milestones:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/milestones', authMiddleware, (req, res) => {
    handleUpsert('career_milestones', req, res);
  });

  app.put('/api/milestones/:id', authMiddleware, (req, res) => {
    handleUpsert('career_milestones', req, res);
  });

  app.delete('/api/milestones/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM career_milestones WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/ba-projects', (req, res) => {
    try {
      const projects = db.prepare('SELECT * FROM ba_projects').all() as any[];
      res.json((projects || []).map((p: any) => ({
        ...p,
        id: String(p.id),
        images: safeParse(p.images, []),
        tags: safeParse(p.tags, [])
      })));
    } catch (error) {
      console.error('Error fetching BA projects:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/ba-projects', authMiddleware, (req, res) => {
    handleUpsert('ba_projects', req, res);
  });

  app.put('/api/ba-projects/:id', authMiddleware, (req, res) => {
    handleUpsert('ba_projects', req, res);
  });

  app.delete('/api/ba-projects/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM ba_projects WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting BA project:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/life-hobbies', (req, res) => {
    try {
      const items = db.prepare('SELECT * FROM life_hobbies').all() as any[];
      res.json((items || []).map(i => ({ ...i, id: String(i.id) })));
    } catch (error) {
      console.error('Error fetching life hobbies:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/life-hobbies', authMiddleware, (req, res) => {
    handleUpsert('life_hobbies', req, res);
  });

  app.put('/api/life-hobbies/:id', authMiddleware, (req, res) => {
    handleUpsert('life_hobbies', req, res);
  });

  app.delete('/api/life-hobbies/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM life_hobbies WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting life hobby:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Serve Vite or static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
