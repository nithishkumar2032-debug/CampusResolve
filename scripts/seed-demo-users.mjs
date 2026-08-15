/**
 * Seed demo Auth users + roles via service role.
 * Loads .env.local from project root. Does not print secrets.
 *
 * Usage: node scripts/seed-demo-users.mjs
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) throw new Error(".env.local not found");
  const env = {};
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const DEMO_PASSWORD = "Hostel@2026";

const USERS = [
  // 10 students
  {
    email: "asha.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Asha Verma",
    hostel_block: "Block A",
  },
  {
    email: "rahul.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Rahul Mehta",
    hostel_block: "Block A",
  },
  {
    email: "priya.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Priya Nair",
    hostel_block: "Block B",
  },
  {
    email: "arjun.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Arjun Patel",
    hostel_block: "Block B",
  },
  {
    email: "sneha.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Sneha Reddy",
    hostel_block: "Block C",
  },
  {
    email: "vikram.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Vikram Singh",
    hostel_block: "Block C",
  },
  {
    email: "ananya.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Ananya Iyer",
    hostel_block: "Block D",
  },
  {
    email: "karthik.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Karthik Rao",
    hostel_block: "Block D",
  },
  {
    email: "meera.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Meera Joshi",
    hostel_block: "Block E",
  },
  {
    email: "rohan.student.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "student",
    full_name: "Rohan Gupta",
    hostel_block: "Block E",
  },
  // Warden
  {
    email: "warden.demo@gmail.com",
    password: DEMO_PASSWORD,
    role: "warden",
    full_name: "Ravi Warden",
    hostel_block: "Block B",
  },
  // Technicians
  {
    email: "tech.demo@gmail.com",
    password: DEMO_PASSWORD,
    role: "worker",
    full_name: "Kumar Technician",
    hostel_block: null,
  },
  {
    email: "priya.tech.cr@gmail.com",
    password: DEMO_PASSWORD,
    role: "worker",
    full_name: "Priya Electrician",
    hostel_block: null,
  },
  // Admin demo account (keep)
  {
    email: "admin.demo@gmail.com",
    password: DEMO_PASSWORD,
    role: "admin",
    full_name: "Dean Admin",
    hostel_block: null,
  },
];

async function ensureUser(admin, u) {
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existing = listed.users.find(
    (x) => x.email?.toLowerCase() === u.email.toLowerCase(),
  );

  let userId = existing?.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        hostel_block: u.hostel_block,
      },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`CREATED ${u.role}: ${u.email}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        hostel_block: u.hostel_block,
      },
    });
    if (error) throw error;
    console.log(`UPDATED ${u.role}: ${u.email}`);
  }

  await new Promise((r) => setTimeout(r, 350));

  const { error: upErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      hostel_block: u.hostel_block,
      active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (upErr) throw upErr;
  console.log(`ROLE SET ${u.email} -> ${u.role}`);
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or service role key");

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const u of USERS) {
    await ensureUser(admin, u);
  }

  // Keep personal Gmail as admin if present
  const personal = "nithish.kumar2032@gmail.com";
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const me = listed?.users?.find((x) => x.email?.toLowerCase() === personal);
  if (me) {
    await admin
      .from("profiles")
      .update({
        role: "admin",
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", me.id);
    console.log(`KEPT/PROMOTED existing ${personal} -> admin`);
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("email, full_name, role, active")
    .order("role")
    .order("full_name");
  if (error) throw error;
  console.log("\nProfiles:");
  for (const p of profiles ?? []) {
    console.log(`- ${p.role}\t${p.full_name}\t${p.email}\tactive=${p.active}`);
  }
  console.log(`\nShared password: ${DEMO_PASSWORD}`);
  console.log("Login: http://localhost:3000/login");
}

main().catch((e) => {
  console.error("FAILED:", e.message || e);
  process.exit(1);
});
