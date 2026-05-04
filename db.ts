import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // User Profile
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT NOT NULL,
      job_title_model TEXT,
      job_title_ba TEXT,
      banner_title_model TEXT,
      banner_subtitle_model TEXT,
      banner_title_ba TEXT,
      banner_subtitle_ba TEXT,
      bio TEXT,
      avatar_url TEXT,
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
      subjects TEXT, -- JSON array
      career_goal TEXT,
      current_location TEXT
    )
  `);

  // Migration for new profile fields
  try { db.exec(`ALTER TABLE profile ADD COLUMN banner_title_model TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE profile ADD COLUMN banner_subtitle_model TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE profile ADD COLUMN banner_title_ba TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE profile ADD COLUMN banner_subtitle_ba TEXT`); } catch (e) {}

  // BA Projects Showcase
  db.exec(`
    CREATE TABLE IF NOT EXISTS ba_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT,
      images TEXT, -- JSON array of URLs for carousel
      flowchart_url TEXT,
      github_url TEXT,
      tags TEXT, -- JSON array
      grid_class TEXT
    )
  `);

  // Life & Hobbies (The Memory String)
  db.exec(`
    CREATE TABLE IF NOT EXISTS life_hobbies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      title TEXT,
      thought TEXT,
      date TEXT,
      location TEXT
    )
  `);

  // Images / Gallery
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'model_banner', 'ba_banner', 'model_diary', 'lookbook', 'concept'
      url TEXT, -- Primary URL (backward compatibility)
      urls TEXT, -- JSON array of image URLs
      title TEXT,
      date TEXT,
      photographer TEXT,
      makeup TEXT,
      location TEXT,
      grid_class TEXT,
      concept_vibe TEXT,
      facebook_post_url TEXT,
      description TEXT,
      metadata TEXT -- JSON string for extra info
    )
  `);

  try {
    db.exec(`ALTER TABLE assets ADD COLUMN urls TEXT`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE assets ADD COLUMN description TEXT`);
  } catch (e) {}

  // Availability / Calendar
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_str TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  // Skills / Services
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL, -- 'model' or 'ba'
      title TEXT NOT NULL,
      description TEXT,
      icon_name TEXT,
      benefits TEXT, -- JSON array
      stat_label TEXT,
      stat_value TEXT,
      image_url TEXT
    )
  `);

  // Migration for image_url if schema was older
  try {
    db.exec(`ALTER TABLE services ADD COLUMN image_url TEXT`);
  } catch (e) {
    // Column likely already exists
  }

  // Career Path / BA Projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS career_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER, 
      period TEXT NOT NULL,
      role TEXT NOT NULL,
      company TEXT,
      type TEXT, -- 'full-time', 'intern', etc.
      status TEXT, -- 'active', 'completed'
      description TEXT,
      projects TEXT -- JSON array of project objects
    )
  `);

  try {
    db.exec(`ALTER TABLE career_milestones ADD COLUMN year INTEGER`);
  } catch (e) {}

  console.log('Database initialized');
}

export default db;
