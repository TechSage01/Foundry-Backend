import { Request, Response } from "express";
import rdb from "../config/redis.js"
import { escapeLikePrefix, HashtagSuggestion } from "../utils/hashtags.js";
import pool from "../config/db.js";

// @route GET /api/posts/hashtags/suggest
// @desc Live hashtag suggestion for post contents
// @access Authenticated used only
export const suggestHashtags = async (req: Request, res: Response) => {
  const rawQuery = String(req.query.q ?? "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();

  if (!rawQuery) {
    return res.status(400).json({ success: false, message: "Query 'q' is missing" })
  }

  if (rawQuery.length > 40) {
    return res.status(400).json({ success: false, message: "Query too long" });
  }

  const cacheKey = `hashtag_suggest:${rawQuery}`;

  try {
    // 1. query cache
    const cached = await rdb.get(cacheKey);
    if (cached) {
      console.log("CACHE HIT")
      return res.status(200).json({ success: true, data: { suggestions: JSON.parse(cached) }} );
    }

    console.log("CACHE MISS")

    const prefix = `${escapeLikePrefix(rawQuery)}%`;

    // 2. Query usernames, communities, and existing post tags in parallel
    const [usersRes, communitiesRes, tagsRes] = await Promise.all([
      pool.query<{ username: string; full_name: string; avatar_url: string | null }>(
        `SELECT username, full_name, avatar_url
         FROM profiles
         WHERE LOWER(username) LIKE $1 ESCAPE '\\'
            OR LOWER(full_name) LIKE $1 ESCAPE '\\'
         ORDER BY
           CASE WHEN LOWER(username) LIKE $1 ESCAPE '\\' THEN 0 ELSE 1 END,
           username ASC
         LIMIT 4`,
        [prefix]
      ),
      pool.query<{ id: string; name: string; slug: string }>(
        `SELECT id, name, slug
         FROM communities
         WHERE
            LOWER(slug) LIKE $1 ESCAPE '\\'
          OR 
            LOWER(name) LIKE $1 ESCAPE '\\'
         ORDER BY name ASC
         LIMIT 3`,
        [prefix]
      ),
      pool.query<{ tag: string; usage_count: number }>(
        `SELECT LOWER(tag) AS tag, COUNT(*)::INT AS usage_count
         FROM posts, UNNEST(tags) AS tag
         WHERE is_published = true
           AND LOWER(tag) LIKE $1 ESCAPE '\\'
         GROUP BY LOWER(tag)
         ORDER BY usage_count DESC, tag ASC
         LIMIT 4`,
        [prefix]
      ),
    ]);

    const suggestions: HashtagSuggestion[] = [
      ...usersRes.rows.map((u) => ({
        type: "username" as const,
        value: u.username,
        label: u.full_name,
        subtitle: `@${u.username}`,
        avatar_url: u.avatar_url,
      })),
      ...communitiesRes.rows.map((c) => ({
        type: "community" as const,
        value: c.slug,
        label: c.name,
        subtitle: "Community",
      })),
      ...tagsRes.rows.map((t) => ({
        type: "tag" as const,
        value: t.tag,
        label: `#${t.tag}`,
        subtitle: `${t.usage_count} ${t.usage_count === 1 ? "post" : "posts"}`,
      })),
    ];

    await rdb.set(cacheKey, JSON.stringify(suggestions), "EX", 300);

    return res.status(200).json({ success: true, data: { suggestions } });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Failed to suggest hashtags" })
  }
}

