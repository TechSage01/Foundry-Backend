// Blacklisted reserved paths to prevent routing collisions
export const RESERVED_USERNAMES = new Set([
  'admin', 'settings', 'api', 'auth', 'dashboard', 'support', 'help', 'login', 'register', 'root', 'user'
]);