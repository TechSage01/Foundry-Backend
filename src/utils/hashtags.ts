export interface HashtagSuggestion {
  type: "username" | "community" | "tag";
  value: string;
  label: string;
  subtitle?: string; 
  avatar_url?: string | null;
}

export const escapeLikePrefix = (str: string) => str.replace(/[%_\\]/g, "\\$&");