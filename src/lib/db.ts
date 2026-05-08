import Database from 'better-sqlite3';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const dbPath = join(process.cwd(), 'database.sqlite');

function getDatabase() {
  try {
    const database = new Database(dbPath);
    // Test connectivity
    database.pragma('foreign_keys = ON');
    database.pragma('journal_mode = WAL');
    return database;
  } catch (err) {
    if (err instanceof Error && (err.message.includes('malformed') || (err as any).code === 'SQLITE_CORRUPT')) {
      console.error('Database corruption detected on startup. Attempting to recover by re-creating database...');
      try {
        if (existsSync(dbPath)) {
          unlinkSync(dbPath);
          console.log('Corrupt database file deleted.');
        }
      } catch (unlinkErr) {
        console.error('Failed to delete corrupt database:', unlinkErr);
      }
      const database = new Database(dbPath);
      database.pragma('foreign_keys = ON');
      database.pragma('journal_mode = WAL');
      return database;
    }
    throw err;
  }
}

const db = getDatabase();

export function initDb() {
  // Check integrity explicitly
  try {
    const check = db.pragma('integrity_check');
    if (check[0].integrity_check !== 'ok') {
      console.error('Database integrity check failed:', check[0].integrity_check);
    }
  } catch (err) {
    console.error('Failed to run integrity check:', err);
  }

  // Profile is special - id is INTEGER 1
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT,
      job_title_model TEXT,
      job_title_ba TEXT,
      banner_title_model TEXT,
      banner_subtitle_model TEXT,
      banner_title_ba TEXT,
      banner_subtitle_ba TEXT,
      bio TEXT,
      avatar_url TEXT,
      avatar_url_model TEXT,
      avatar_url_ba TEXT,
      fb_link TEXT,
      ig_link TEXT,
      zalo_link TEXT,
      linkedin_link TEXT,
      height INTEGER,
      weight INTEGER,
      bust INTEGER,
      waist INTEGER,
      hips INTEGER,
      birth_date TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      university TEXT,
      gpa TEXT,
      subjects TEXT,
      career_goal TEXT,
      current_location TEXT,
      banner_url TEXT,
      banner_url_model TEXT,
      banner_url_ba TEXT,
      updatedAt TEXT,
      createdAt TEXT
    )
  `);

  // Ensure default profile exists
  const existingProfile = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  if (!existingProfile) {
    db.prepare('INSERT INTO profile (id, full_name) VALUES (1, ?)').run('Thu Phương');
  }

  // Schema definition for all tables
  const tables = {
    ba_projects: `
      CREATE TABLE IF NOT EXISTS ba_projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        role TEXT NOT NULL,
        description TEXT,
        images TEXT,
        flowchart_url TEXT,
        github_url TEXT,
        tags TEXT,
        grid_class TEXT,
        updatedAt TEXT,
        createdAt TEXT
      )
    `,
    life_hobbies: `
      CREATE TABLE IF NOT EXISTS life_hobbies (
        id TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        title TEXT,
        thought TEXT,
        date TEXT,
        location TEXT,
        updatedAt TEXT,
        createdAt TEXT
      )
    `,
    assets: `
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        url TEXT,
        urls TEXT,
        title TEXT,
        date TEXT,
        photographer TEXT,
        makeup TEXT,
        location TEXT,
        grid_class TEXT,
        concept_vibe TEXT,
        concept TEXT,
        facebook_post_url TEXT,
        description TEXT,
        metadata TEXT,
        updatedAt TEXT,
        createdAt TEXT
      )
    `,
    calendar: `
      CREATE TABLE IF NOT EXISTS calendar (
        id TEXT PRIMARY KEY,
        date_str TEXT NOT NULL,
        status TEXT NOT NULL,
        updatedAt TEXT,
        createdAt TEXT
      )
    `,
    services: `
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon_name TEXT,
        benefits TEXT,
        stat_label TEXT,
        stat_value TEXT,
        image_url TEXT,
        updatedAt TEXT,
        createdAt TEXT
      )
    `,
    career_milestones: `
      CREATE TABLE IF NOT EXISTS career_milestones (
        id TEXT PRIMARY KEY,
        mode TEXT DEFAULT 'ba',
        year INTEGER, 
        period TEXT NOT NULL,
        role TEXT NOT NULL,
        company TEXT,
        type TEXT,
        status TEXT,
        description TEXT,
        projects TEXT,
        updatedAt TEXT,
        createdAt TEXT
      )
    `
  };

  // Run creations and ensure columns
  Object.entries(tables).forEach(([tableName, createSql]) => {
    db.exec(createSql);
    
    // Auto-migration for existing tables
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
      const existingCols = new Set(tableInfo.map(c => c.name));
      
      // 1. Auto-migration for TEXT IDs if they were INTEGER before
      const idCol = tableInfo.find(c => c.name === 'id');
      if (idCol && idCol.type.toUpperCase() !== 'TEXT' && idCol.type.toUpperCase() !== '') {
        console.log(`Migrating ${tableName} table to use TEXT ID...`);
        const oldTable = `${tableName}_old_${Date.now()}`;
        db.exec(`ALTER TABLE ${tableName} RENAME TO ${oldTable}`);
        db.exec(createSql);
        const cols = tableInfo.map(c => c.name).join(', ');
        db.exec(`INSERT INTO ${tableName} (${cols}) SELECT ${cols.split(', ').map(c => c === 'id' ? 'CAST(id AS TEXT)' : c).join(', ')} FROM ${oldTable}`);
        db.exec(`DROP TABLE ${oldTable}`);
      }

      // 2. Ensure all columns from the schema exist (Add missing columns)
      // Extract column names from the createSql string using a simple heuristic
      const match = createSql.match(/\(([\s\S]*)\)/);
      if (match) {
        const colLines = match[1].split(',').map(line => line.trim()).filter(line => line && !line.toUpperCase().includes('PRIMARY KEY'));
        colLines.forEach(line => {
          const colName = line.split(/\s+/)[0];
          if (colName && !existingCols.has(colName)) {
            console.log(`Adding missing column ${colName} to ${tableName}...`);
            try {
              db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${line}`);
            } catch (alterErr) {
              console.warn(`Could not add column ${colName} to ${tableName}:`, alterErr);
            }
          }
        });
      }
    } catch (e) {
      console.warn(`Migration error for ${tableName}:`, e);
    }
  });

  // Also handle profile table separately since it's not in the loop
  try {
    const profileInfo = db.prepare(`PRAGMA table_info(profile)`).all() as any[];
    const profileCols = new Set(profileInfo.map(c => c.name));
    const expectedProfileCols = [
      'job_title_model TEXT', 'job_title_ba TEXT', 
      'banner_title_model TEXT', 'banner_subtitle_model TEXT', 
      'banner_title_ba TEXT', 'banner_subtitle_ba TEXT',
      'avatar_url_model TEXT', 'avatar_url_ba TEXT',
      'banner_url_model TEXT', 'banner_url_ba TEXT'
    ];
    expectedProfileCols.forEach(colDef => {
      const colName = colDef.split(' ')[0];
      if (!profileCols.has(colName)) {
        console.log(`Adding missing column ${colName} to profile...`);
        db.exec(`ALTER TABLE profile ADD COLUMN ${colDef}`);
      }
    });
  } catch (e) {
    console.warn('Profile migration error:', e);
  }

  console.log('Database initialized and verified');

  // Seed default BA content if empty
  const baProjectCount = db.prepare('SELECT count(*) as count FROM ba_projects').get() as any;
  if (baProjectCount.count === 0) {
    console.log('Seeding default BA projects...');
    db.prepare(`INSERT INTO ba_projects (id, title, role, description, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'default_ba_1',
      'E-commerce Transformation',
      'Lead Business Analyst',
      'Optimized checkout flow and integrated automated inventory management system.',
      JSON.stringify(['UML', 'BPMN', 'E-commerce']),
      new Date().toISOString()
    );
  }

  const baMilestoneCount = db.prepare("SELECT count(*) as count FROM career_milestones WHERE mode = 'ba'").get() as any;
  if (baMilestoneCount.count === 0) {
     console.log('Seeding default BA milestones...');
     db.prepare(`INSERT INTO career_milestones (id, mode, year, period, role, company, type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
       'default_ba_ms_1',
       'ba',
       2024,
       '2024 - Hiện tại',
       'Senior Business Analyst',
       'Tech Solutions Global',
       'Agency',
       'active',
       'Leading requirements engineering for enterprise-scale digital transformation projects.'
     );
  }

  const baServiceCount = db.prepare("SELECT count(*) as count FROM services WHERE mode = 'ba'").get() as any;
  if (baServiceCount.count === 0) {
    console.log('Seeding default BA services...');
    const baServices = [
      { id: 'ba_s1', mode: 'ba', title: 'Business Process Modeling', description: 'Visualizing and optimizing complex business workflows using standard notations.', icon_name: 'Workflow' },
      { id: 'ba_s2', mode: 'ba', title: 'Requirements Engineering', description: 'Eliciting and documenting clear, actionable requirements for software development teams.', icon_name: 'ClipboardList' },
      { id: 'ba_s3', mode: 'ba', title: 'System Analysis', description: 'Translating business needs into technical specifications and solution architectures.', icon_name: 'Database' }
    ];
    baServices.forEach(s => {
      db.prepare(`INSERT INTO services (id, mode, title, description, icon_name) VALUES (?, ?, ?, ?, ?)`).run(s.id, s.mode, s.title, s.description, s.icon_name);
    });
  }
}

export default db;
