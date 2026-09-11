-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  tagline VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  demo_url TEXT,
  github_url TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (slug),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
);

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  company_url TEXT,
  role VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  employment_type VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS trg_experiences_updated_at ON experiences;

DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS experiences;
-- +goose StatementEnd
