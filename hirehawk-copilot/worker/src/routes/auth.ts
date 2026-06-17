import { Env, User, Session } from "../types";

// Helper: Hashing password using Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response("OK", { status: 200 });
  }

  // Route: POST /auth/signup
  if (path === "/auth/signup" && request.method === "POST") {
    try {
      const { email, password, name, role } = (await request.json()) as any;
      if (!email || !password || !name || !role) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Check if user already exists
      const existingUser = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .first<User>();

      if (existingUser) {
        return new Response(JSON.stringify({ error: "User already exists with this email" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Generate salt and hash password
      const salt = crypto.randomUUID();
      const passwordHash = `${salt}:${await hashPassword(password, salt)}`;
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Insert user
      await env.DB.prepare(
        "INSERT INTO users (id, email, name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(userId, email, name, role, passwordHash, now, now)
        .run();

      // Create session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      await env.DB.prepare(
        "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
      )
        .bind(sessionId, userId, expiresAt, now)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          token: sessionId,
          user: { email, name, role }
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Failed to sign up" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Route: POST /auth/login
  if (path === "/auth/login" && request.method === "POST") {
    try {
      const { email, password } = (await request.json()) as any;
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Find user
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .first<User>();

      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Verify password
      const parts = user.password_hash.split(":");
      if (parts.length !== 2) {
        return new Response(JSON.stringify({ error: "Invalid stored password hash format" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      const [salt, storedHash] = parts;
      const inputHash = await hashPassword(password, salt);

      if (inputHash !== storedHash) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Create session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      await env.DB.prepare(
        "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
      )
        .bind(sessionId, user.id, expiresAt, now)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          token: sessionId,
          user: { email: user.email, name: user.name, role: user.role }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Failed to login" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Route: GET /auth/validate
  if (path === "/auth/validate" && request.method === "GET") {
    try {
      // Extract token from Authorization header or search params
      const authHeader = request.headers.get("Authorization");
      let token = "";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else {
        token = url.searchParams.get("token") || "";
      }

      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Query session and user
      const sessionAndUser = await env.DB.prepare(
        "SELECT s.expires_at, u.email, u.name, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?"
      )
        .bind(token)
        .first<{ expires_at: string; email: string; name: string; role: string }>();

      if (!sessionAndUser) {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Check if session is expired
      if (new Date(sessionAndUser.expires_at) < new Date()) {
        // Clean up expired session
        await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(token).run();
        return new Response(JSON.stringify({ error: "Unauthorized: Session expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(
        JSON.stringify({
          valid: true,
          user: {
            email: sessionAndUser.email,
            name: sessionAndUser.name,
            role: sessionAndUser.role
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Failed to validate session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Route: POST /auth/logout
  if (path === "/auth/logout" && request.method === "POST") {
    try {
      const authHeader = request.headers.get("Authorization");
      let token = "";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else {
        const body = (await request.json().catch(() => ({}))) as any;
        token = body.token || "";
      }

      if (token) {
        await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(token).run();
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Failed to logout" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}
