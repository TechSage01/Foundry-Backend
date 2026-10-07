-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (name),
  UNIQUE (slug),
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY (community_id, user_id),
  FOREIGN KEY(community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY,
  community_id UUID NOT NULL,
  author_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  content TEXT NOT NULL,
  cover_image_url TEXT,
  reading_time_minutes INTEGER DEFAULT 1,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (slug),
  FOREIGN KEY(community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS community_posts;
DROP TABLE IF EXISTS community_members;
DROP TABLE IF EXISTS communities;
-- +goose StatementEnd
