-- +goose Up
-- +goose StatementBegin
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE profiles
  DROP COLUMN IF EXISTS cover_image_url;
-- +goose StatementEnd
