-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  required_skills VARCHAR(50)[] NOT NULL DEFAULT '{}',
  work_arrangement VARCHAR(20) NOT NULL,
  location_range VARCHAR(255),
  compensation VARCHAR(255),
  deadline_at TIMESTAMP WITH TIME ZONE,
  fast_apply_enabled BOOLEAN NOT NULL DEFAULT true,
  external_apply_url VARCHAR(500),
  screening_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_applications (
  id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  applicant_id UUID NOT NULL,
  cover_note TEXT NOT NULL,
  resume_url TEXT DEFAULT NULL,
  portfolio_url TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT uq_applicant_opportunity UNIQUE (opportunity_id, applicant_id),
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS opportunity_applications;
DROP TABLE IF EXISTS opportunities;
-- +goose StatementEnd
