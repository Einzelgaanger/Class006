-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  admission_number TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  profile_image_url TEXT,
  rank INTEGER,
  role TEXT DEFAULT 'student'
);

-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  unit_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  file_url TEXT,
  unit_code TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  file_url TEXT,
  unit_code TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create past_papers table
CREATE TABLE IF NOT EXISTS past_papers (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  year TEXT NOT NULL,
  file_url TEXT,
  unit_code TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create completed_assignments table
CREATE TABLE IF NOT EXISTS completed_assignments (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_note_views table
CREATE TABLE IF NOT EXISTS user_note_views (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL REFERENCES notes(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(note_id, user_id)
);

-- Create user_paper_views table
CREATE TABLE IF NOT EXISTS user_paper_views (
  id SERIAL PRIMARY KEY,
  paper_id INTEGER NOT NULL REFERENCES past_papers(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(paper_id, user_id)
);

-- Create session table
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

-- Insert sample units
INSERT INTO units (unit_code, name, description, category) VALUES
  ('MAT 2101', 'Integral Calculus', 'Advanced integration techniques and applications', 'Mathematics'),
  ('MAT 2102', 'Real Analysis', 'Rigorous treatment of real number system and functions', 'Mathematics'),
  ('STA 2101', 'Probability Theory', 'Fundamentals of probability and random variables', 'Statistics'),
  ('DAT 2101', 'Algorithms and Data Structures', 'Efficient algorithms and data organization', 'Data Science'),
  ('DAT 2102', 'Information Security, Governance and the Cloud', 'Information security in modern cloud environments', 'Data Science'),
  ('HED 2101', 'Principles of Ethics', 'Ethical frameworks and moral reasoning', 'Humanities')
ON CONFLICT (unit_code) DO NOTHING;

-- Insert sample teacher account if not exists
INSERT INTO users (name, admission_number, password, role)
VALUES (
  'Teacher Account',
  'T001',
  '5dd56344bd460b0b593a5089eee816cc0b65328b41843d691cf61ca76519880052291c1712b716235759015238f5179672c81325e5413b29a3d15d5cb440642e.2f5240fd42bbdfe3bfd5a4dbd4d8317a',
  'teacher'
)
ON CONFLICT (admission_number) DO NOTHING; 