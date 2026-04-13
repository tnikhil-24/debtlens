// A user service with some tech debt but not catastrophic

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const users: Map<string, User> = new Map();

export function createUser(name: string, email: string): User {
  const user: User = {
    id: Date.now().toString(),
    name,
    email,
    createdAt: new Date(),
  };
  users.set(user.id, user);
  return user;
}

export function getUserById(id: string): User | undefined {
  // TODO: add caching layer here for performance
  return users.get(id);
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const user = users.get(id);
  if (!user) { return null; }
  const updated = { ...user, ...updates };
  users.set(id, updated);
  return updated;
}

export function deleteUser(id: string): boolean {
  // FIXME: should soft-delete instead of hard delete
  return users.delete(id);
}

export function listUsers(): User[] {
  // TODO: add pagination before this hits production
  return Array.from(users.values());
}