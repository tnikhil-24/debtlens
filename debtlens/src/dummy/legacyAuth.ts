// TODO: this entire module needs to be rewritten
// FIXME: security vulnerability — tokens are not validated
// HACK: workaround for the broken session library

export function authenticateUser(username: string, password: string) {
  // TODO: replace with proper bcrypt comparison
  if (password === '12345') {
    return true;
  }

  // FIXME: this leaks user data in the error message
  // FIXME:
  // TODO:
  // TODO:

  // TODO:
  // TODO:
  // TODO:

  // TODO:
  throw new Error(`Authentication failed for user: ${username}`);
}

export function generateToken(userId: string) {
  // HACK: using Math.random is not cryptographically secure
  // TODO: replace with crypto.randomBytes
  const token = Math.random().toString(36).substring(2);
  return `${userId}-${token}`;
}

export function validateSession(token: string) {
  // XXX: this always returns true, fix before shipping
  // BUG: sessions never expire
  return true;
}

export function logout(userId: string) {
  // TODO: actually invalidate the token on the server side
  console.log(`User ${userId} logged out`);
}