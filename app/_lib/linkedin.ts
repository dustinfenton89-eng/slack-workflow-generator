/**
 * LinkedIn API connection helpers.
 *
 * Uses LinkedIn's OAuth 2.0 (Authorization Code flow) + OpenID Connect.
 * Mirrors the fetch-based style used in app/_lib/openai.ts.
 *
 * Required environment variables:
 *   LINKEDIN_CLIENT_ID       - from your LinkedIn Developer app
 *   LINKEDIN_CLIENT_SECRET   - from your LinkedIn Developer app
 *   LINKEDIN_REDIRECT_URI    - e.g. https://yourapp.com/api/linkedin/callback
 *
 * Docs:
 *   https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 *   https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
 *   https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
 */

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const POSTS_URL = "https://api.linkedin.com/rest/posts";

// LinkedIn versions the REST API by month (YYYYMM). Bump as needed.
const LINKEDIN_VERSION = "202506";

/** Default scopes: OpenID Connect sign-in + permission to post as the member. */
export const DEFAULT_SCOPES = ["openid", "profile", "email", "w_member_social"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getRedirectUri(): string {
  return requireEnv("LINKEDIN_REDIRECT_URI");
}

/**
 * Build the URL to send a member to in order to authorize the app.
 * `state` should be an unguessable value you also store, to protect against CSRF.
 */
export function getAuthorizationUrl(state: string, scopes: string[] = DEFAULT_SCOPES): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requireEnv("LINKEDIN_CLIENT_ID"),
    redirect_uri: getRedirectUri(),
    state,
    scope: scopes.join(" "),
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface LinkedInToken {
  access_token: string;
  expires_in: number; // seconds
  scope?: string;
  token_type?: string;
  id_token?: string; // present when the "openid" scope is requested
}

/** Exchange the authorization `code` returned to the callback for an access token. */
export async function exchangeCodeForToken(code: string): Promise<LinkedInToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: requireEnv("LINKEDIN_CLIENT_ID"),
    client_secret: requireEnv("LINKEDIN_CLIENT_SECRET"),
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${await res.text()}`);
  return (await res.json()) as LinkedInToken;
}

export interface LinkedInUser {
  sub: string; // stable member id — use as the person URN: urn:li:person:{sub}
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string | { country: string; language: string };
}

/** Fetch the authenticated member's OpenID Connect profile. */
export async function getUserInfo(accessToken: string): Promise<LinkedInUser> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`LinkedIn userinfo failed: ${await res.text()}`);
  return (await res.json()) as LinkedInUser;
}

/**
 * Publish a text post to LinkedIn as the given member.
 * Requires the `w_member_social` scope.
 *
 * @param accessToken member access token
 * @param authorSub   the member's `sub` from getUserInfo (person id)
 * @param text        the post body
 * @param visibility  PUBLIC (default) or CONNECTIONS
 * @returns the created post URN (e.g. urn:li:share:123...)
 */
export async function sharePost(
  accessToken: string,
  authorSub: string,
  text: string,
  visibility: "PUBLIC" | "CONNECTIONS" = "PUBLIC"
): Promise<string> {
  const res = await fetch(POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": LINKEDIN_VERSION,
    },
    body: JSON.stringify({
      author: `urn:li:person:${authorSub}`,
      commentary: text,
      visibility,
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!res.ok) throw new Error(`LinkedIn post failed: ${await res.text()}`);
  // LinkedIn returns the new post's URN in this header.
  return res.headers.get("x-restli-id") || "";
}
