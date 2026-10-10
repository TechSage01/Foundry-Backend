export interface CommentNode {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  replies: CommentNode[];
}

export const slugify = (title: string): string => {
  const cleanTitle = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const shortHash = Math.floor(1000 + Math.random() * 9000);
  return `${cleanTitle}-${shortHash}`;
}

export const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

export const buildCommentTree = (flatComments: any[]): CommentNode[] => {
  const map = new Map<string, CommentNode>();
  const rootComment: CommentNode[] = [];

  flatComments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] })
  })

  flatComments.forEach((comment) => {
    const node = map.get(comment.id)!;

    if (comment.parent_id && map.has(comment.parent_id)) {
      map.get(comment.parent_id)!.replies.push(node)
    } else {
      rootComment.push(node)
    }
  })

  return rootComment
}

export const formatDate = (dateInput: any): string | null => {
  if (!dateInput) return null;

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}