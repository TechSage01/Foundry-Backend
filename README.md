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

| Method   | Endpoint                           | Description                                   |
| -------- | ---------------------------------- | --------------------------------------------- |
| `POST`   | `/api/projects`                    | Create new project                            |
| `GET`    | `/api/projects`                    | Fetch all published projects                  |
| `GET`    | `/api/projects/{slug}`             | Get a project                                 |
| `GET`    | `/api/projects/user/{username}`    | Get all projects from a user                  |
| `PUT`    | `/api/projects/{id}`               | Update project                                | 
| `DELETE` | `/api/projects/{id}`               | Delete project                                |


### project phases

| Method   | Endpoint                           | Description                                   |
| -------- | ---------------------------------- | --------------------------------------------- |
| `POST`   | `/api/projects/{id}/phases`        | Create a phase for a project                  |
| `PATCH`  | `/api/projects/phases/{id}/toggle` | Toggle completion status for a project phase  |
| `DELETE` | `/api/projects/phases/{id}`        | Delete a project phase                        |


### project likes

| Method   | Endpoint                           | Description                                   |
| -------- | ---------------------------------- | --------------------------------------------- |
| `POST`   | `/api/projects/{id}/likes`         | Toggle (create/delete) likes for projects     |    
| `GET`    | `/api/projects/{id}/likes`         | Get a project likes count                     |    


### experiences

| Method   | Endpoint                           | Description                                      |
| -------- | ---------------------------------- | ------------------------------------------------ |
| `POST`   | `/api/experiences`                 | Create new experience/journey                    |
| `GET`    | `/api/experiences/user/{username}` | Fetch all experiences associated with a username |
| `PUT`    | `/api/experiences/{id}`            | Update experience                                |
| `DELETE` | `/api/experiences/{id}`            | Delete experience                                |


### posts

| Method   | Endpoint                           | Description                                      |
| -------- | ---------------------------------- | ------------------------------------------------ |
| `POST`   | `/api/posts`                       | Create new posts                                 |
| `GET`    | `/api/posts`                       | Fetch all published posts                        |
| `GET`    | `/api/posts/me`                    | Fetch all owned posts for a user                 |
| `GET`    | `/api/posts/me/drafts`             | Fetch all owned posts drafts for a user          |
| `GET`    | `/api/posts/{slug}`                | Get a single post                                |
| `PUT`    | `/api/posts/{id}`                  | Update a post                                    |
| `DELETE` | `/api/posts/{id}`                  | Delete a post                                    |


### follows

| Method   | Endpoint                           | Description                                      |
| -------- | ---------------------------------- | ------------------------------------------------ |
| `POST`   | `/api/users/{userId}/follow`       | Follow a user                                    |
| `DELETE` | `/api/users/{userId}/follow`       | UnFollow a user                                  |
| `GET`    | `/api/users/{username}/followers`  | Get a list of followers for a user               |
| `GET`    | `/api/users/{username}/following`  | Get a list of users the user is following        |

### opportunities

| Method   | Endpoint                           | Description                                      |
| -------- | ---------------------------------- | ------------------------------------------------ |
| `POST`   | `/api/opportunities`               | Create a new opportunity                         |
| `GET`    | `/api/opportunities`               | Fetch all opportunities                          |

<br><br>

## Docs

<br>

**`PUT /api/profile`**

Updates the authenticated user's profile.

**Request Body (`multipart/form-data`)**

| Field            | Type          | Required | Description                                        |
| ---------------- | ------------- | -------- | -------------------------------------------------- |
| `avatar`         | File          | No       | Profile avatar. Maximum size: 2MB.                 |
| `cover_image`    | File          | No       | Profile cover image. Maximum size: 2MB.            |
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

**Request Body (`multipart/form-data`)**

| Field            | Type          | Required | Description                                        |
| ---------------- | ------------- | -------- | -------------------------------------------------- |
| `title`          | string        | Yes      | Project's title                                    |
| `tagline`        | string        | Yes      | Project's tagline.                                 |
| `description`    | string        | No       | Project's description.                             |
| `cover_image`    | File          | No       | Project's display image.                           |
| `demo_url`       | string        | No       | A demo video url.                                  |
| `github_url`     | string        | No       | The project's github link.                         |
| `tech_stack`     | string        | Yes      | JSON-stringified array of tech stacks.             |
| `is_published`   | string        | Yes      | "true" or "false" <"false" for drafts>.            |

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

**Request Body (`multipart/form-data`)**

| Field            | Type          | Required | Description                                        |
| ---------------- | ------------- | -------- | -------------------------------------------------- |
| `title`          | string        | No       | Project's title                                    |
| `tagline`        | string        | No       | Project's tagline.                                 |
| `description`    | string        | No       | Project's description.                             |
| `cover_image`    | File          | No       | Project's display image.                           |
| `demo_url`       | string        | No       | A demo video url.                                  |
| `github_url`     | string        | No       | The project's github link.                         |
| `tech_stack`     | string        | No       | JSON-stringified array of tech stacks.             |
| `is_published`   | string        | No       | "true" or "false" <"false" for drafts>.            |

<br>

---

**`POST /api/projects/{id}/phases`**

Create a project phase for the authenticated user.

**Request Body**

```json
{
  "title": "string",
  "description": "string | null",
  "is_completed": "string | null",
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

<br>

---

**`PUT /api/experiences/{id}`**

Update an experience/journey.

**Request Body**

```json
{
  "company_name": "string | null",
  "company_url": "string | null",
  "role": "string | null",
  "location": "string | null",
  "employment_type": "Full-time | Part-time | Contract | Internship | Freelance | null",
  "start_date": "Date | null",
  "end_date": "Date | null",
  "is_current": "boolean | null",
  "description": "string | null",
  "technologies": "string[] <an array of strings> | null"
}
```

<br>

---

**`POST /api/posts`**

Creates a new post for the authenticated user.

**Request Body (`multipart/form-data`)**

| Field            | Type          | Required | Description                                        |
| ---------------- | ------------- | -------- | -------------------------------------------------- |
| `title`          | string        | Yes      | Post's title                                       |
| `subtitle`       | string        | No       | Post's subtitle/tagline.                           |
| `content`        | string        | Yes      | Post's content.                                    |
| `cover_image`    | File          | No       | Post's display image.                              |
| `tags`           | string        | No       | Post hash tags.                                    |
| `is_published`   | string        | No       | "true" or "false" <"false" for drafts>.            |

<br>

---

<br>

**`PUT /api/posts/:id`**

Updates a post for the authenticated user.

**Request Body (`multipart/form-data`)**

| Field            | Type          | Required | Description                                        |
| ---------------- | ------------- | -------- | -------------------------------------------------- |
| `title`          | string        | No       | Post's title                                       |
| `subtitle`       | string        | No       | Post's subtitle/tagline.                           |
| `content`        | string        | No       | Post's content.                                    |
| `cover_image`    | File          | No       | Post's display image.                              |
| `tags`           | string        | No       | Post hash tags.                                    |
| `is_published`   | string        | No       | "true" or "false" <"false" for drafts>.            |

<br>

---

**`POST /api/opportunities`**

Create a new opportunity.

**Request Body**

```json
{
  "category": "string",
  "title": "string",
  "description": "string",
  "required_skills": "string[] e.g JSON.stringify(['Java', 'AI']) | null",
  "work_arrangement": "remote | hybrid | onsite",
  "location_range": "string | null",
  "compensation": "string | null",
  "deadline_at": "Date | null",
  "fast_apply_enabled": "Boolean | null",
  "external_apply_url": "string | null",
  "screening_prompt": "string | null"
}
```

<br>

---

**`GET /api/opportunities`**

Fetches a paginated list of opportunities with optional filtering.

**Query Parameters**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | Page number for pagination |
| `limit` | `integer` | No | `50` | Number of items per page (max 50) |
| `category` | `string` | No | `null` | Filter opportunities by category (e.g., `Freelance`) |
| `work_arrangement` | `string` | No | `null` | Filter opportunities by work arrangement (e.g., `remote`) |
| `skill` | `string` | No | `null` | Filter opportunities by skill (e.g., `Java`) |



