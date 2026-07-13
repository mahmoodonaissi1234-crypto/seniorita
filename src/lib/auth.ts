export const SESSION_COOKIE = "seniorita_session";

const VALID_EMAIL = "admin@seniorita.com";
const VALID_PASSWORD = "password";

export function checkCredentials(email: string, password: string) {
  return email === VALID_EMAIL && password === VALID_PASSWORD;
}
