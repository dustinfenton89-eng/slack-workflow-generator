This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## LinkedIn API Connection

This project includes a LinkedIn OAuth 2.0 connection (OpenID Connect) so it can
read a member's profile and publish posts on their behalf.

### Setup

1. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/apps).
2. Add the **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn**
   products (these grant the `openid profile email w_member_social` scopes).
3. Under **Auth**, add an authorized redirect URL that matches
   `LINKEDIN_REDIRECT_URI`, e.g. `http://localhost:3000/api/linkedin/callback`.
4. Copy `.env.example` to `.env.local` and set `LINKEDIN_CLIENT_ID`,
   `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI`.

### Routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/linkedin/auth` | GET | Redirects the browser to LinkedIn's consent screen (sets a CSRF `state` cookie). |
| `/api/linkedin/callback` | GET | Verifies `state`, exchanges the code for a token, stores it, and returns the profile. |
| `/api/linkedin/me` | GET | Returns the connected member's profile. `401` if not connected. |
| `/api/linkedin/share` | POST | Publishes a post. Body: `{ "text": "...", "visibility": "PUBLIC" \| "CONNECTIONS" }`. |

To connect, open [`/api/linkedin/auth`](http://localhost:3000/api/linkedin/auth)
in the browser and complete the LinkedIn consent screen.

> Note: For simplicity the access token is stored in an HttpOnly cookie for the
> current session. For production, persist tokens per user (e.g. in Supabase)
> and refresh them as needed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
