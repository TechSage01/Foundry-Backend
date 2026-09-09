# Foundry Backend

## API Routes

| Method | Endpoint               | Description         |
| ------ | ---------------------- | ------------------- |
| `GET`  | `/api/auth/google`     | Sign in with Google |
| `GET`  | `/api/auth/github`     | Sign in with GitHub |
| `PUT`  | `/api/profile`         | Update profile      |
| `POST` | `/api/projects`        | Create new project  |
| `GET`  | `/api/projects/{slug}` | Get a project       |

---

## Docs

---

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

---

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
