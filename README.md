# Foundry Backend

## API Routes

| Method   | Endpoint                        | Description                  |
| -------- | ------------------------------- | ---------------------------- |
| `GET`    | `/api/auth/google`              | Sign in with Google          |
| `GET`    | `/api/auth/github`              | Sign in with GitHub          |
| `GET`    | `/api/auth/me`                  | Fetch user                   |
| `PUT`    | `/api/profile`                  | Update profile               |
| `POST`   | `/api/projects`                 | Create new project           |
| `GET`    | `/api/projects`                 | Fetch all published projects |
| `GET`    | `/api/projects/{slug}`          | Get a project                |
| `GET`    | `/api/projects/user/{username}` | Get all projects from a user |
| `PUT`    | `/api/projects/{id}`            | Update project               | 
| `DELETE` | `/api/projects/{id}`            | Delete project               |

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
<br>

---

**`POST /api/projects`**

Creates a new project for the authenticated user.

**Request Body**

```json
{
  "title": "string",
  "tagline": "string",
  "description": "string | null",
  "cover_image_url": "string | null",
  "demo_url": "string | null",
  "github_url": "string | null",
  "tech_stack": ["string"],
  "is_published": "boolean <false for draft>"
}
```
<br>

---

**`GET /api/projects`**

Fetches a paginated list of published projects with optional technology tag filtering.

**Query Parameters**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | Page number for pagination |
| `limit` | `integer` | No | `12` | Number of items per page (max 50) |
| `tag` | `string` | No | `null` | Filter projects by tech stack tag (e.g., `Go`) |


<br>

---

**`PUT /api/projects/{id}`**

Update an existing project for the authenticated user.

**Request Body**

```json
{
  "title": "string",
  "tagline": "string",
  "description": "string | null",
  "cover_image_url": "string | null",
  "demo_url": "string | null",
  "github_url": "string | null",
  "tech_stack": ["string"],
  "is_published": "boolean <false for draft>"
}
```

---
