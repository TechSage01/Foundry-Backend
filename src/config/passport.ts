import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from "passport-google-oauth20";
import { Strategy as GithubStrategy, Profile as GithubProfile } from "passport-github2";
import pool from "./db.js";
import { v4 as uuidv4 } from "uuid";

// ------ Github Stratey ------
passport.use(
  new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    scope: ['user:email'],
    callbackURL: process.env.GITHUB_CALLBACK_URL!
  },
  async (accessToken: string, _refreshToken: string, profile: GithubProfile, done: (err?: Error | null, user?: any) => void) => {
    let email = profile.emails?.[0].value;

    // fallback: fetch email
    if (!email) {
      try {
        const req = await fetch("https://api.github.com/user/emails", {
          headers: {
            "Authorization": `token ${accessToken}`,
            "User Agent": "Foundry"
          },
        });

        if (req.ok) {
          const emails: Array<{ email: string; primary: boolean; verified: boolean }> = await req.json();
          const primaryObj = emails.find((e) => e.primary && e.verified) || emails[0];
          email = primaryObj?.email;
        }
      } catch (err) {
        return done(new Error("Failed to retrieve email"))
      }
    }

    if (!email) {
      return done(new Error("No email account found"));
    }

    const fullName = profile.displayName || profile.username || "Anonymous";
    const avatarUrl = profile.photos?.[0].value;
    const baseUsername = (profile.username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');

    return handleOauthUser({ email, fullName, avatarUrl, baseUsername }, done)
  })
)

// ------ Google Strategy ------
passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!
  }, 
  async (accessToken, refreshToken, profile: GoogleProfile, done: GoogleVerifyCallback) => {
    const email = profile.emails?.[0].value;
    if (!email) {
      return done(new Error("No email account found"));
    }

    const fullName = profile.displayName;
    const avatarUrl = profile.photos?.[0].value;
    const baseUsername = email!.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    return handleOauthUser({ email, fullName, avatarUrl, baseUsername }, done)
  })
)

const handleOauthUser = async ({ email, fullName, avatarUrl, baseUsername }: { email: string, fullName: string, avatarUrl: string | undefined, baseUsername: string }, done: Function) => {

  const client = await pool.connect();

  try {
    await client.query('BEGIN')

    // 1. check if user already exists
    const existingUser = await client.query(
      `SELECT u.id, u.email, u.verified, p.username, p.full_name, p.avatar_url
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        WHERE u.email = $1
    `, [email])

    if (existingUser.rows.length > 0) {
      await client.query('COMMIT');
      return done(null, existingUser.rows[0]);
    }

    // 2. create new user and profile
    const userId = uuidv4();
    const user = await client.query(`
      INSERT INTO users (id, email, verified)
      VALUES ($1, $2, TRUE)
      RETURNING id, email, verified
    `, [userId, email])

    const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

    await client.query(`
      INSERT INTO profiles (user_id, full_name, username, avatar_url)
      VALUES ($1, $2, $3, $4)
    `, [userId, fullName, username, avatarUrl]);

    await client.query('COMMIT');

    const newUser = {
      ...user.rows[0],
      username,
      fullName,
      avatarUrl
    };

    return done(null, newUser)
  } catch (err) {
    await client.query('ROLLBACK');
    return done(err as Error);
  } finally {
    client.release();
  }
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.verified, p.username, p.full_name, p.avatar_url
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1`,
    [id]);
    done(null, rows[0] || null)
  } catch (err) {
    done(err as Error, null)
  }
});

export default passport

