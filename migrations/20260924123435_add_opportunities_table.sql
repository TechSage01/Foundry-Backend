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
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS opportunities;
-- +goose StatementEnd
