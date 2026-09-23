-- +goose Up
-- +goose StatementBegin
ALTER TABLE profiles ADD COLUMN cover_image_url TEXT; 
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- +goose StatementEnd
