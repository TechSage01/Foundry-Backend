import pool from "../config/db.js";

export type HashtagCategory = "username" | "community" | "tag";

export interface ContentBlock {
  type: "text" | "hashtag";
  content: string;
  isHashtag: boolean;
  hashtagType: HashtagCategory | null;
  target?: {
    id?: string;
    slug: string;
    href: string;
  };
}

const HASHTAG_REGEX = /(?:^|\s)(#([a-zA-Z0-9_-]{2,40}))(?=$|\s|[.,!?;:'")\]}])/g;

export const attachContentBlocks = async <T extends { content: string }>(
  posts: T[]
): Promise<(T & { content_blocks: ContentBlock[] }) []> => {
  if (posts.length === 0) {
    return [];
  }

  const candidates = new Set<string>();
  for (const post of posts) {
    if (!post.content) continue;
    for (const match of post.content.matchAll(HASHTAG_REGEX)) {
      candidates.add(match[2].toLowerCase())
    }
  }

  const userMap = new Map<string, { id: string; username: string }>();
  const communityMap = new Map<string, { id: string, slug: string }>();

  if (candidates.size > 0) {
    const candidateLists = Array.from(candidates);

    const [userRes, communitiesRes] = await Promise.all([
      pool.query<{ user_id: string; username: string }>(
        `SELECT user_id, username
         FROM profiles
         WHERE LOWER(username) = ANY($1::TEXT[])`,
      [candidateLists]
      ),
      pool.query<{ id: string; name: string, slug: string }>(
        `SELECT id, name, slug
         FROM communities
         WHERE LOWER(name) = ANY($1::TEXT[])`,
      [candidateLists]
      )
    ]);

    for (const row of userRes.rows) {
      userMap.set(row.username.toLowerCase(), {
        id: row.user_id,
        username: row.username
      })
    }

    for (const row of communitiesRes.rows) {
      communityMap.set(row.name.toLowerCase(), {
        id: row.id,
        slug: row.slug
      })
    }
  }

  // crawl each posts and slice into json blocks
  return posts.map((post) => ({
    ...post,
    content_blocks: tokenizePosts(post.content || "", userMap, communityMap)
  }))
}

const tokenizePosts = (
  text: string,
  userMap: Map<string, { id: string; username: string }>,
  communityMap: Map<string, { id: string; slug: string }>
): ContentBlock[] => {
  let blocks: ContentBlock[] = [];
  let cursor = 0;

  for (const match of text.matchAll(HASHTAG_REGEX)) {
    const fullMatch = match[0];
    const token = match[1];
    const rawWord = match[2];
    const key = rawWord.toLowerCase();

    const tokenStart = (match.index ?? 0) + (fullMatch.length - token.length);

    // push plain texts
    if (tokenStart > cursor) {
      blocks.push({
        type: "text",
        content: text.slice(cursor, tokenStart),
        isHashtag: false,
        hashtagType: null
      })
    }

    const matchedUser = userMap.get(key);
    const matchedCommunity = communityMap.get(key);

    if (matchedUser) {
      blocks.push({
        type: "hashtag",
        content: token,
        isHashtag: true,
        hashtagType: "username",
        target: {
          id: matchedUser.id,
          slug: matchedUser.username,
          href: `/${matchedUser.username}`,
        },
      });
    } else if (matchedCommunity) {
      blocks.push({
        type: "hashtag",
        content: token,
        isHashtag: true,
        hashtagType: "community",
        target: {
          id: matchedCommunity.id,
          slug: matchedCommunity.slug,
          href: `/communities/${matchedCommunity.slug}`,
        },
      });
    } else {
      blocks.push({
        type: "hashtag",
        content: token,
        isHashtag: true,
        hashtagType: "tag",
        target: {
          slug: key,
          href: `/?tag=${encodeURIComponent(key)}`,
        },
      });
    }

    cursor = tokenStart + token.length;
  }

  // Push remaining trailing text
  if (cursor < text.length) {
    blocks.push({
      type: "text",
      content: text.slice(cursor),
      isHashtag: false,
      hashtagType: null,
    });
  }

  return blocks;
}