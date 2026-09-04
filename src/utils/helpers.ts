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