# Foundry Backend

## API Routes
### auth

| Method   | Endpoint                        | Description                   |
| -------- | ------------------------------- | ----------------------------- |
| `GET`    | `/api/auth/google`              | Sign in with Google           |
| `GET`    | `/api/auth/github`              | Sign in with GitHub           |
| `GET`    | `/api/auth/me`                  | Fetch user                    |


### profile

| Method   | Endpoint                        | Description                   |
| -------- | ------------------------------- | ----------------------------- |
| `PUT`    | `/api/profile`                  | Update profile                |


### projects

| Method   | Endpoint                        | Description                   |
| -------- | ------------------------------- | ----------------------------- |
| `POST`   | `/api/projects`                 | Create new project            |
| `GET`    | `/api/projects`                 | Fetch all published projects  |
| `GET`    | `/api/projects/{slug}`          | Get a project                 |
| `GET`    | `/api/projects/user/{username}` | Get all projects from a user  |
| `PUT`    | `/api/projects/{id}`            | Update project                | 
| `DELETE` | `/api/projects/{id}`            | Delete project                |


### experiences

| Method   | Endpoint                        | Description                   |
| -------- | ------------------------------- | ----------------------------- |
| `POST`   | `/api/experiences`              | Create new experience/journey |

<br>

---

## Docs

---

**`PUT /api/profile`**

Updates the authenticated user's profile.

**Request Body (`multipart/form-data`)**

| Field            | Type          | Required | Description                                        |
| ---------------- | ------------- | -------- | -------------------------------------------------- |
| `avatar`         | File          | No       | Profile avatar. Maximum size: 3MB.                 |
| `username`       | string        | No       | User's username.                                   |
| `full_name`      | string        | No       | User's full name.                                  |
| `headline`       | string | null | No       | User's profile headline.                           |
| `bio`            | string | null | No       | User's biography.                                  |
| `location`       | string | null | No       | User's location.                                   |
| `skills`         | string        | No       | JSON-stringified array of skills.                  |
| `external_links` | string        | No       | JSON-stringified object containing external links. |

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

<br>

---

**`POST /api/experiences/`**

Create a new experience/journey for the authenticated user.

**Request Body**

```json
{
  "company_name": "string",
  "company_url": "string | null",
  "role": "string",
  "location": "string | null",
  "employment_type": "Full-time | Part-time | Contract | Internship | Freelance | null",
  "start_date": "Date",
  "end_date": "Date | null",
  "is_current": "boolean",
  "description": "string | null",
  "technologies": "string[] <an array of strings>"
}
```
