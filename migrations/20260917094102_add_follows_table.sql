-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,

  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT cannot_follow_self CHECK (follower_id <> following_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS follows;
-- +goose StatementEnd
