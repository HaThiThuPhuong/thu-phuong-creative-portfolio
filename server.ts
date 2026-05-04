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

  // API Routes
  app.get('/api/profile', (req, res) => {
    try {
      const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
      res.json(profile || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/profile', (req, res) => {
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
        assets = db.prepare('SELECT * FROM assets WHERE type = ?').all(type);
      } else {
        assets = db.prepare('SELECT * FROM assets').all();
      }
      res.json(assets || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Extract metadata from Facebook/Instagram
  app.post('/api/assets/extract', async (req, res) => {
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

  // Manage assets
  app.post('/api/assets', (req, res) => {
    const { type, url, urls, title, description, date, location, photographer, makeup, grid_class, concept_vibe, facebook_post_url, metadata } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO assets (type, url, urls, title, description, date, location, photographer, makeup, grid_class, concept_vibe, facebook_post_url, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(type, url, JSON.stringify(urls || []), title, description, date, location, photographer, makeup, grid_class, concept_vibe, facebook_post_url, metadata);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error('Error adding asset:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.put('/api/assets/:id', (req, res) => {
    const { id } = req.params;
    const { type, url, urls, title, description, date, location, photographer, makeup, grid_class, concept_vibe, facebook_post_url, metadata } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE assets SET 
          type = ?, url = ?, urls = ?, title = ?, description = ?, date = ?, location = ?, 
          photographer = ?, makeup = ?, grid_class = ?, 
          concept_vibe = ?, facebook_post_url = ?, metadata = ?
        WHERE id = ?
      `);
      stmt.run(type, url, JSON.stringify(urls || []), title, description, date, location, photographer, makeup, grid_class, concept_vibe, facebook_post_url, metadata, id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/assets/:id', (req, res) => {
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
      const calendar = db.prepare('SELECT * FROM calendar ORDER BY date_str ASC').all();
      res.json(calendar || []);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/calendar', (req, res) => {
    const { date_str, status } = req.body;
    try {
      // Upsert logic: if same date exists, update status, else insert
      const existing = db.prepare('SELECT id FROM calendar WHERE date_str = ?').get(date_str);
      if (existing) {
        db.prepare('UPDATE calendar SET status = ? WHERE date_str = ?').run(status, date_str);
      } else {
        db.prepare('INSERT INTO calendar (date_str, status) VALUES (?, ?)').run(date_str, status);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving calendar:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/calendar/:id', (req, res) => {
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
    console.log('GET /api/services', req.query);
    try {
      const { mode } = req.query;
      let services;
      if (mode) {
        services = db.prepare('SELECT * FROM services WHERE mode = ?').all(mode);
      } else {
        services = db.prepare('SELECT * FROM services').all();
      }
      res.json((services || []).map((s: any) => ({
        ...s,
        benefits: JSON.parse(s.benefits || '[]')
      })));
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/services', (req, res) => {
    const { id, mode, title, description, icon_name, stat_label, stat_value, image_url, benefits } = req.body;
    try {
      const benefitsStr = JSON.stringify(benefits || []);
      if (id) {
        db.prepare(`
          UPDATE services 
          SET mode = ?, title = ?, description = ?, icon_name = ?, stat_label = ?, stat_value = ?, image_url = ?, benefits = ?
          WHERE id = ?
        `).run(mode, title, description, icon_name, stat_label, stat_value, image_url, benefitsStr, id);
      } else {
        db.prepare(`
          INSERT INTO services (mode, title, description, icon_name, stat_label, stat_value, image_url, benefits)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(mode, title, description, icon_name, stat_label, stat_value, image_url, benefitsStr);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving service:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/services/:id', (req, res) => {
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
    console.log('GET /api/milestones');
    try {
      const milestones = db.prepare('SELECT * FROM career_milestones ORDER BY year DESC').all();
      res.json((milestones || []).map((m: any) => ({
        ...m,
        projects: JSON.parse(m.projects || '[]')
      })));
    } catch (error) {
      console.error('Error fetching milestones:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/milestones', (req, res) => {
    const { id, year, period, type, role, company, description, status, projects } = req.body;
    try {
      const projectsStr = JSON.stringify(projects || []);
      if (id) {
        db.prepare(`
          UPDATE career_milestones 
          SET year = ?, period = ?, type = ?, role = ?, company = ?, description = ?, status = ?, projects = ?
          WHERE id = ?
        `).run(year, period, type, role, company, description, status, projectsStr, id);
      } else {
        db.prepare(`
          INSERT INTO career_milestones (year, period, type, role, company, description, status, projects)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(year, period, type, role, company, description, status, projectsStr);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving milestone:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/milestones/:id', (req, res) => {
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
    console.log('GET /api/ba-projects');
    try {
      const projects = db.prepare('SELECT * FROM ba_projects').all();
      res.json((projects || []).map((p: any) => ({
        ...p,
        images: JSON.parse(p.images || '[]'),
        tags: JSON.parse(p.tags || '[]')
      })));
    } catch (error) {
      console.error('Error fetching BA projects:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/ba-projects', (req, res) => {
    const { id, title, role, description, flowchart_url, github_url, grid_class, images, tags } = req.body;
    try {
      const imagesStr = JSON.stringify(images || []);
      const tagsStr = JSON.stringify(tags || []);
      
      if (id) {
        db.prepare(`
          UPDATE ba_projects 
          SET title = ?, role = ?, description = ?, flowchart_url = ?, github_url = ?, grid_class = ?, images = ?, tags = ?
          WHERE id = ?
        `).run(title, role, description, flowchart_url, github_url, grid_class, imagesStr, tagsStr, id);
      } else {
        db.prepare(`
          INSERT INTO ba_projects (title, role, description, flowchart_url, github_url, grid_class, images, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(title, role, description, flowchart_url, github_url, grid_class, imagesStr, tagsStr);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving BA project:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/ba-projects/:id', (req, res) => {
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
    console.log('GET /api/life-hobbies');
    try {
      const items = db.prepare('SELECT * FROM life_hobbies').all();
      res.json(items || []);
    } catch (error) {
      console.error('Error fetching life hobbies:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/life-hobbies', (req, res) => {
    const { id, title, thought, image_url, date, location } = req.body;
    try {
      if (id) {
        db.prepare(`
          UPDATE life_hobbies 
          SET title = ?, thought = ?, image_url = ?, date = ?, location = ?
          WHERE id = ?
        `).run(title, thought, image_url, date, location, id);
      } else {
        db.prepare(`
          INSERT INTO life_hobbies (title, thought, image_url, date, location)
          VALUES (?, ?, ?, ?, ?)
        `).run(title, thought, image_url, date, location);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving life hobby:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/life-hobbies/:id', (req, res) => {
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
