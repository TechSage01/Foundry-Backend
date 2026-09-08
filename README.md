# Foundry Backend

## API Routes

### Authentication

| Method | Endpoint           | Description         |
| ------ | ------------------ | ------------------- |
| `GET`  | `/api/auth/google` | Sign in with Google |
| `GET`  | `/api/auth/github` | Sign in with GitHub |

---

### Profile

#### Update Profile

**`PUT /api/profile`**

Updates the authenticated user's profile.

**Request Body**

```json
{
  "username": "string",
  "headline": "string | null",
  "bio": "string | null",
  "location": "string | null",
  "skills": ["string"],
  "external_links": {
    "github": "https://github.com/username",
    "linkedin": "https://linkedin.com/in/username"
  }
}
```

**Validation**

| Field            | Rules                                                             |
| ---------------- | ----------------------------------------------------------------- |
| `username`       | Optional. 3–30 characters; letters, numbers, and underscores only |
| `headline`       | Optional. Maximum 100 characters                         |
| `bio`            | Optional. Maximum 500 characters                         |
| `location`       | Optional. Maximum 50 characters                          |
| `skills`         | Optional. Array of strings                               |
| `external_links` | Optional. Key-value object containing string URLs        |

---

### Projects

#### Create Project

**`POST /api/projects`**

Creates a new project for the authenticated user.

**Request Body**

```json
{
  "title": "My Project",
  "tagline": "A short description of my project",
  "description": "A detailed description of the project.",
  "cover_image_url": "https://example.com/cover.png",
  "demo_url": "https://example.com",
  "github_url": "https://github.com/username/project",
  "tech_stack": ["React", "TypeScript", "Go", "PostgreSQL"],
  "is_published": true
}
```

**Validation**

| Field             | Rules                                  |
| ----------------- | -------------------------------------- |
| `title`           | Required. 2–100 characters             |
| `tagline`         | Required. 5–200 characters             |
| `description`     | Optional                      |
| `cover_image_url` | Optional. Must be a valid URL |
| `demo_url`        | Optional. Must be a valid URL |
| `github_url`      | Optional. Must be a valid URL |
| `tech_stack`      | Array of strings. Defaults to `[]`     |
| `is_published`    | Boolean. Defaults to `true`            |