# FoodBridge — Build-It-Yourself Guide (0 → 100)

**Food Distribution Management System · ICT 222-2 ICT Project**
Uva Wellassa University of Sri Lanka

> This is a **learning roadmap**, not a code dump. It tells you *what* to build, *in what order*, *which concepts to learn first*, *how to test each piece*, and *what mistakes to avoid* — but **you write the code**. That's the whole point. By the end you'll understand every line because you typed it.

---

## How to use this guide

1. Read **Part 1–3** together as a team before anyone writes code. Everyone should understand the architecture.
2. Each of the 5 of you takes an ownership area (Part 6), but **everyone builds the Week 3 auth module together** — it's the spine everything else hangs off.
3. Work **week by week**. Each weekly section has the same shape:
   - **Goal** — what exists at the end of the week
   - **Learn first** — concepts to study before coding (with search terms)
   - **Build** — the actual tasks, as a checklist
   - **Hints & pseudocode** — direction, not solutions
   - **Test it** — how you prove it works
   - **Pitfalls** — where teams lose days
   - **Done when** — your definition of done
4. **Never paste code you don't understand.** If you can't explain a line to a teammate, you haven't finished learning it.
5. Commit small and often. A green commit at the end of every work session.

---

# PART 1 — The Big Picture

## What you're building

A web platform that connects **food donors** (hotels, restaurants, events with surplus food) to an **NGO** that coordinates **volunteers** to collect and redistribute that food to people in need. Recipients are *served by* the system but are **not users** of it — only Donors, NGO Admins, and Volunteers log in.

The core flow of a single food donation:

```
Donor posts surplus food
        │
        ▼
  status: AVAILABLE  ──(admin assigns a volunteer)──►  ASSIGNED
        │                                                  │
        │                                          (volunteer collects)
        │                                                  ▼
        │                                              COLLECTED
        │                                                  │
        │                                       (admin logs distribution)
        │                                                  ▼
   (expiry passes)                                    DISTRIBUTED
        ▼
     EXPIRED
```

## Three-tier architecture

Your proposal commits to a classic **three-tier client–server** design. Learn what each tier does and where the boundary is:

| Tier | Tech | Responsibility |
|------|------|----------------|
| **Presentation** (client) | React.js | What the user sees and clicks. Holds *no* secrets. Talks to the API over HTTP. |
| **Application/Logic** (server) | Node.js + Express.js | All the rules: who can do what, validation, status transitions, auth. The *only* thing allowed to touch the database. |
| **Data** | MySQL | Stores everything. Never exposed directly to the browser. |

**The golden rule:** the browser never talks to MySQL. It talks to your Express API, and *only* the API talks to MySQL. Every security control lives in the middle tier. If a rule lives only in the React UI, it isn't a rule — a user can bypass the UI with Postman.

## The request lifecycle (memorise this)

When a volunteer clicks "Mark Delivered":

1. **React** sends `PATCH /api/tasks/42/status` with a JWT in the `Authorization` header and `{ status: "delivered" }` in the body.
2. **Express** receives it. Middleware runs in order: parse JSON → verify the JWT (who are you?) → check role (are you a volunteer?) → validate the body (is "delivered" a legal value?).
3. The **controller** checks business rules (is task 42 actually assigned to *this* volunteer? is the current status a legal predecessor of "delivered"?).
4. It runs a **SQL UPDATE** through the connection pool.
5. It writes an **audit log** row.
6. It returns **JSON**. React updates the screen.

Every feature you build is a variation of this lifecycle. Once it clicks, the whole project is "just" repeating this pattern with different rules.

## Why this stack

- **MySQL** — relational data with clear relationships (a task *belongs to* a post *belongs to* a donor). Foreign keys enforce integrity for you.
- **Express** — minimal, unopinionated web framework. You assemble it from middleware, which forces you to understand how a request flows. Great for learning.
- **React** — component-based UI. You'll build small reusable pieces (a status badge, a card, a table) and compose them.
- **Node** — one language (JavaScript) across the whole back end, and the same language as the front end. Less context-switching for a student team.

---

# PART 2 — Skills To Learn First

Don't try to learn everything before starting — learn each layer *just before* you need it. But get the **foundations** below solid in Week 1, because everything depends on them.

### Foundations (everyone, Week 1)
- **JavaScript essentials**: variables, functions, arrow functions, `const`/`let`, arrays (`map`/`filter`/`find`), objects, destructuring, template literals, modules (`import`/`export`).
- **Asynchronous JS**: Promises, `async`/`await`, `try/catch`. *This is the #1 thing that trips up beginners on Node.* Spend real time here.
- **HTTP basics**: what a request/response is, methods (GET/POST/PUT/PATCH/DELETE), status codes (200, 201, 400, 401, 403, 404, 422, 500), headers, JSON bodies.
- **What REST is**: resources as URLs (`/api/food-posts`), methods as verbs, statelessness.
- **Git basics**: clone, branch, add, commit, push, pull, merge, resolving a conflict.
  - Search terms: *"JavaScript async await tutorial"*, *"HTTP status codes explained"*, *"REST API for beginners"*, *"git branching tutorial"*.

### Back-end track (whoever owns the API)
- **Node + Express**: routing, middleware, `req`/`res`, the `next()` function.
- **SQL**: `CREATE TABLE`, `INSERT`, `SELECT` with `JOIN` and `WHERE`, `UPDATE`, aggregate functions (`COUNT`, `SUM`, `GROUP BY`), and **parameterised queries** (never string-concatenate user input into SQL).
- **Auth concepts**: what password hashing is and why (bcrypt), what a JWT is and what it contains, the difference between **authentication** (who are you) and **authorization** (what may you do).

### Front-end track (whoever owns the UI)
- **React fundamentals**: components, props, `useState`, `useEffect`, conditional rendering, rendering lists with keys, handling form input (controlled components).
- **React Router**: routes, navigation, route params, protected routes.
- **Calling an API from React**: `fetch` or `axios`, loading/error states, storing a token, sending it on each request.
- **Tailwind CSS** (optional but recommended): utility classes for fast styling.

### Cross-cutting (everyone, by Week 10)
- **Testing**: what a unit vs integration test is; Jest basics; testing an API with Supertest; manual testing with Postman.
- **Deployment**: environment variables, what "hosting" means, the idea of a managed database.

> A realistic expectation: a team new to this stack should budget **Week 1 almost entirely for learning** and accept that the first module (auth) will feel slow. After auth, every other module reuses the same patterns and you'll speed up dramatically.

---

# PART 3 — Environment Setup

Do this once per machine, ideally all together in your first lab session so you hit the same problems at the same time.

### 3.1 Install the tools

| Tool | What it's for | Notes |
|------|---------------|-------|
| **Node.js (LTS, v18+)** | Runs your server and build tools | Includes `npm`. Verify: `node -v` and `npm -v`. |
| **MySQL 8** (or **XAMPP**) | The database | XAMPP is the easiest on Windows — it bundles MySQL with a control panel. Start the **MySQL** service. |
| **VS Code** | Editor | Install extensions: ESLint, Prettier, and a MySQL client extension. |
| **Git** | Version control | Verify: `git --version`. Make a GitHub account each, create one shared repo. |
| **Postman** | Manually test your API | You'll live in this while building the back end. |
| **A browser** | Front end + DevTools | Learn the Network and Console tabs. |

### 3.2 Verify MySQL works
Open a MySQL shell (or phpMyAdmin if using XAMPP) and run a trivial query like `SELECT 1;`. If you get a result back, you're connected. Note your root username and password — you'll need them in your server config.

### 3.3 Set up the shared repo
1. One person creates a **private** GitHub repo named `foodbridge`.
2. Add all 5 members as collaborators.
3. Everyone clones it.
4. Create a `.gitignore` at the root **before your first commit** containing at least: `node_modules/`, `.env`, `dist/`, `*.log`.
   - **Critical:** `.env` must be git-ignored from commit #1. It holds your DB password and JWT secret. This is **Objective O8** and graders will check.

### 3.4 Agree on conventions (write these in the repo's README)
- Branch naming: `feature/auth`, `feature/food-posts`, etc.
- Commit message style: short, present tense ("add login route", not "added stuff").
- Code style: turn on Prettier "format on save" so you don't argue about spaces.

---

# PART 4 — Project Structure

Use a **monorepo**: one repository, two apps (server + client) plus a database folder. This keeps the whole project in one place and is easy to submit.

```
foodbridge/
├── .gitignore
├── README.md                  ← how to run the project (write this as you go)
├── database/
│   └── schema.sql             ← your CREATE TABLE statements
├── server/                    ← the Express API
│   ├── .env.example           ← template (committed)
│   ├── .env                   ← real secrets (NEVER committed)
│   ├── package.json
│   └── src/
│       ├── index.js           ← starts the server
│       ├── app.js             ← assembles Express + middleware
│       ├── config/            ← db connection
│       ├── middleware/        ← auth, role-check, validation, errors
│       ├── routes/            ← URL → controller wiring
│       ├── controllers/       ← the actual logic per feature
│       ├── validators/        ← input rules per feature
│       └── utils/             ← jwt helper, audit helper
└── client/                    ← the React app
    ├── package.json
    └── src/
        ├── main.jsx           ← app entry
        ├── App.jsx            ← routes
        ├── api/               ← axios instance + token handling
        ├── context/           ← auth state shared across the app
        ├── components/        ← reusable UI (Navbar, Card, Badge…)
        └── pages/             ← one folder per role: admin/ donor/ volunteer/
```

**Why this layout teaches you well:** the back end is split by *responsibility* (routes know URLs, controllers know logic, middleware knows cross-cutting concerns). When something breaks, the folder name tells you where to look. Resist the urge to dump everything in one file.

---

# PART 5 — The 12-Week Plan At A Glance

This maps **exactly** to the Gantt chart and objectives in your proposal.

| Week | Task | Phase | Objective | Primary deliverable |
|------|------|-------|-----------|--------------------|
| **1** | Requirements gathering | Planning | — | Agreed feature list, demo accounts decided, repo + tools ready |
| **2** | System architecture & DB schema | Design | — | `schema.sql` with 6 tables, ERD diagram |
| **2–3** | UI/UX wireframes (Figma) | Design | — | Wireframes for all 3 portals |
| **3** | Authentication & RBAC | Dev | **O1** | Register/login/JWT/role-guard working |
| **4** | Donor module & verification | Dev | **O2** | Admin approves/rejects donors |
| **5** | Food posting module | Dev | **O3** | Verified donors post food with expiry |
| **6** | Volunteer mgmt & task assignment | Dev | **O4** | Admin assigns collection tasks |
| **7** | Volunteer dashboard & status | Dev | **O5** | Volunteer confirms pickup → delivery |
| **8** | Distribution logging & analytics | Dev | **O6** | Impact metrics dashboard |
| **9** | Report generation (PDF/CSV) | Dev | **O7** | Export distributions |
| **3–9** | Unit & integration testing | Testing | — | Tests written *alongside* each module |
| **10** | System & security testing | Testing | **O8** | Validation, rate limiting, HTTPS, hardening |
| **11** | User acceptance testing | Testing | — | Real users try it, bugs logged & fixed |
| **11–12** | Documentation & final report | Closure | — | Report, README, API docs |
| **12** | Deployment & handover | Closure | — | Live on Vercel + Render |

Notice testing is **W3–W9 continuous**, not bolted on at the end. Write a test the moment a module works.

---

# PART 6 — Team Roles (5 Members)

You have five people (ICT23090, ICT23092, ICT23093, ICT23027, ICT23066). Suggested ownership — adjust to your strengths, but **someone must own each area**:

| Role | Owns | Also does |
|------|------|-----------|
| **Back-end lead** | Express app structure, auth/RBAC (O1), middleware | Code reviews all API PRs |
| **Back-end #2** | Food posts (O3), tasks (O4), distributions | Database queries |
| **Front-end lead** | React app structure, auth pages, routing, shared components | Code reviews all UI PRs |
| **Front-end #2** | The three role dashboards (donor/volunteer/admin pages) | Wireframes → components |
| **Database + QA + DevOps** | Schema design (W2), analytics (O6), reports (O7), testing setup, deployment | Keeps the ERD and API docs updated |

**But:** the **Week 3 auth module is built together** by the whole team in one or two sessions. It's the foundation; everyone must understand JWT + RBAC because every later feature checks the token and the role. After auth, split off into your lanes.

**Daily rhythm:** a 10-minute standup — what I did, what I'm doing, what's blocking me. Keep a shared board (Trello, as in your proposal, or ClickUp/GitHub Projects) with a card per task and columns: Backlog → In Progress → Review → Done.

---

# PART 7 — Git Workflow For A Team

Five people pushing to one repo will collide unless you have a rule. Use **feature branches + pull requests**:

1. `main` is always working. Nobody pushes directly to `main`.
2. For each task, branch off `main`: `git checkout -b feature/food-posts`.
3. Commit small, push your branch.
4. Open a **Pull Request** on GitHub. A teammate reviews it (even a quick read), then merge.
5. Before starting new work, `git checkout main && git pull` to get everyone's merged changes.

**Conflict survival:** conflicts are normal, not errors. When git marks a conflict, open the file, find the `<<<<<<<`/`=======`/`>>>>>>>` markers, decide which code wins (or combine), delete the markers, commit. Do a dry run together in Week 1 so the first real conflict isn't scary.

---

# PART 8 — Week-By-Week Build

---

## WEEK 1 — Requirements & Setup

**Goal:** everyone's machine runs Node + MySQL, the repo exists with `.gitignore`, and the team agrees on the exact feature list and the demo accounts you'll show in the viva.

**Learn first:** the foundations from Part 2 (async JS, HTTP, REST, git). This is your biggest learning week.

**Build (checklist):**
- [ ] Everyone completes Part 3 setup and can run `node -v`, connect to MySQL, and clone the repo.
- [ ] Root `.gitignore` committed (with `.env` ignored) — first commit.
- [ ] Write a one-page **requirements doc** in the repo: list every screen each role sees and every action they can take. This becomes your test plan later.
- [ ] Decide your three demo logins (one per role) and write them down. You'll seed these later.
- [ ] Set up the shared task board with a card per Week 3–12 task.

**Test it:** every team member pushes a trivial commit (e.g., adds their name to a `TEAM.md`) and pulls everyone else's. If all 5 can push and pull cleanly, your workflow works.

**Pitfalls:** skipping the `.gitignore`/`.env` setup and leaking secrets later; not aligning on requirements and building different things.

**Done when:** all machines are ready, the repo is shared and clean, and the team can describe the full donation lifecycle out loud.

---

## WEEK 2 — Database Design (the heart of the project)

**Goal:** a finished `database/schema.sql` with all 6 tables, correct types, foreign keys, and an ERD diagram you can put in your report.

**Learn first:** primary keys, foreign keys, one-to-many relationships, normalization (just to 3NF — don't over-engineer), SQL data types (`INT`, `VARCHAR`, `TEXT`, `DECIMAL`, `DATETIME`, `ENUM`, `BOOLEAN`/`TINYINT`), and indexes. Search: *"database foreign key one to many"*, *"MySQL data types"*, *"how to draw an ERD"*.

### The 6 tables — design spec (you write the SQL)

Below is the **design** — the fields and *why* each exists. Your task is to turn this into `CREATE TABLE` statements yourself. Think about which column is the primary key, which are foreign keys, what's `NOT NULL`, and what needs a default.

**1. `users`** — every person who can log in (all three roles).
- `id` (PK), `name`, `email` (unique — you log in with it), `password_hash` (the bcrypt hash, **never** the plain password), `role` (one of `donor`/`admin`/`volunteer`), `is_active` (donors start inactive until approved — see O2), `created_at`.
- *Why one table for all roles?* They share login mechanics. Role-specific data goes elsewhere.

**2. `donors`** — extra profile data for users whose role is `donor`.
- `id` (PK), `user_id` (FK → users), `organization_name`, `phone`, `address`, `verification_status` (`pending`/`approved`/`rejected`), `verification_note` (admin's recorded reason — O2 requires this), `verified_by` (FK → users, the admin), `verified_at`.
- *Why separate from users?* Volunteers and admins don't have an organization or verification status. Keep role-specific columns out of the shared table.

**3. `food_posts`** — a surplus-food listing created by a verified donor (O3).
- `id` (PK), `donor_id` (FK → donors), `title`, `description`, `quantity`, `unit` (e.g. meals/kg), `pickup_address`, `available_from`, `expires_at` (the configurable expiry window), `status` (`available`/`assigned`/`collected`/`distributed`/`expired`), `created_at`.

**4. `collection_tasks`** — an admin assigns a post to a volunteer to collect (O4, O5).
- `id` (PK), `food_post_id` (FK → food_posts, **unique** — one active task per post), `volunteer_id` (FK → users), `assigned_by` (FK → users, the admin), `status` (`assigned`/`picked_up`/`delivered`), `assigned_at`, `picked_up_at`, `delivered_at`, `notes`.

**5. `distributions`** — a record that collected food was handed out (O6).
- `id` (PK), `food_post_id` (FK → food_posts), `task_id` (FK → collection_tasks), `recipients_count`, `meals_served`, `location`, `distributed_by` (FK → users), `distributed_at`, `notes`.

**6. `audit_logs`** — a security/accountability trail of who did what (O8).
- `id` (PK), `user_id` (FK → users, nullable), `action` (e.g. `donor.approved`), `entity` (e.g. `donor`), `entity_id`, `detail` (JSON or text), `created_at`.

**Build (checklist):**
- [ ] Draw the ERD (use draw.io or Figma) showing all 6 tables and the FK lines between them. Put it in `/database/` and in your report.
- [ ] Write `CREATE TABLE` statements in `database/schema.sql`. Use `InnoDB` engine and `utf8mb4` charset.
- [ ] Add foreign keys with sensible `ON DELETE` behaviour (think: if a user is deleted, what happens to their posts?).
- [ ] Add indexes on columns you'll filter by a lot (`food_posts.status`, `collection_tasks.volunteer_id`).
- [ ] Make `schema.sql` **re-runnable**: drop tables in reverse-dependency order at the top so you can reset during development.

**Test it:** run `mysql -u root -p < database/schema.sql`. It should create the database and all 6 tables with no errors. Then `SHOW TABLES;` and `DESCRIBE food_posts;` to verify. Insert one fake row by hand and select it back.

**Pitfalls:** storing the plain password (never — only the hash); forgetting the unique constraint on `collection_tasks.food_post_id` (you'll get duplicate assignments); making `expires_at` a `DATE` instead of `DATETIME` (you need time precision for expiry).

**Done when:** the schema loads cleanly, the ERD is drawn, and every teammate can explain why each table exists and how they relate.

---

## WEEK 2–3 — Wireframes (Figma)

**Goal:** a clickable-ish wireframe for every screen, so the front-end team builds toward a target instead of guessing.

**Learn first:** basic Figma (frames, components, auto-layout). Search: *"Figma wireframe tutorial for beginners"*.

**Build (checklist):** wireframe these screens at minimum —
- Shared: Login, Register (with a donor/volunteer toggle).
- Donor: dashboard (list my posts + a "create post" form).
- Admin: dashboard (analytics cards), donor approvals queue, task-assignment board, distributions log.
- Volunteer: dashboard (my assigned tasks, buttons to confirm pickup and mark delivered).

**Test it:** walk a teammate through the wireframes as if they were a real donor. If they understand what to click without you explaining, the design works.

**Done when:** every screen in your requirements doc has a wireframe, and the team agrees on the layout.

> Your Figma is connected to this workspace, so you can keep wireframes there and reference them while building components.

---

## WEEK 3 — Authentication & RBAC → **Objective O1**

> Build this **as a whole team**. It's the foundation. Budget extra time.

**Goal:** users can register and log in; the server issues a JWT; protected routes reject requests with no/expired token (401) and reject the wrong role (403).

**Learn first:**
- **Password hashing** — why you never store plain passwords; what bcrypt does; what a "salt" and "rounds" are. Your proposal specifies **bcrypt with 12 rounds**.
- **JWT** — what the three parts are (header.payload.signature), what you put in the payload (user id, role — **never** the password), how the signature proves it wasn't tampered with, and expiry.
- **Authentication vs Authorization** — logging in (who you are) vs role-checking (what you may do).
- **Express middleware** — functions that run before your controller and can stop the request.
- Search: *"bcrypt hash password node"*, *"jsonwebtoken sign verify"*, *"express middleware explained"*, *"role based access control node"*.

**Build (checklist):**
- [ ] Initialise the server: `npm init`, install `express`, `mysql2`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cors`. Create `src/index.js` + `src/app.js` and get a `GET /api/health` route returning `{ ok: true }`.
- [ ] Create a `.env` (and committed `.env.example`) with `PORT`, DB credentials, `JWT_SECRET`, `BCRYPT_ROUNDS=12`.
- [ ] DB connection: a `mysql2` **connection pool** in `src/config/db.js`.
- [ ] `POST /api/auth/register` — validate input, hash the password, insert a `users` row. Donors also get a `donors` row and start `is_active = false` (pending). Volunteers can be active immediately (your team decides admin creation — usually seeded, not self-registered).
- [ ] `POST /api/auth/login` — look up by email, **bcrypt-compare** the password, block inactive accounts, return a signed JWT on success.
- [ ] `GET /api/auth/me` — returns the current user from their token.
- [ ] **`authenticate` middleware** — reads the `Authorization: Bearer <token>` header, verifies the JWT, attaches the user to `req.user`, or returns 401.
- [ ] **`authorize(...roles)` middleware** — checks `req.user.role` is in the allowed list, else 403.
- [ ] Write an **audit log** entry on register and login.

**Hints & pseudocode** (translate to real code yourself):

Hashing on register:
```
rounds = read BCRYPT_ROUNDS from env
hash = await bcrypt.hash(plainPassword, rounds)
// store `hash` in password_hash, never the plain password
```

The RBAC middleware is tiny but powerful — this is the shape, not the solution:
```
function authorize(...allowedRoles):
    return function(req, res, next):
        if req.user.role is not in allowedRoles:
            return res.status(403).json({ message: "Forbidden" })
        next()
```
You'll then guard a route like: `router.get('/donors', authenticate, authorize('admin'), listDonors)`.

Login (note the security detail):
```
user = SELECT * FROM users WHERE email = ?   // parameterised!
if no user OR !(await bcrypt.compare(input, user.password_hash)):
    return 401 with a GENERIC message ("Invalid credentials")
    // never reveal whether it was the email or password that was wrong
if !user.is_active: return 403 ("Account pending approval")
token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '1d' })
```

**Test it (Postman):**
- Register a volunteer → 201.
- Log in → you get a token. Paste it into [jwt.io](https://jwt.io) and confirm the payload has the role but **no password**.
- Call a protected admin route with the volunteer's token → **403**.
- Call it with no token → **401**.
- Call it with a garbage token → **401**.

**Pitfalls:** putting sensitive data in the JWT (it's only *signed*, not *encrypted* — anyone can read the payload); string-concatenating the email into SQL (use `?` placeholders); returning different errors for "wrong email" vs "wrong password" (lets attackers enumerate accounts — keep it generic); forgetting to `await` bcrypt (it returns a Promise).

**Done when:** the 401/403/200 behaviours above all pass in Postman, and every teammate can explain how a request proves its identity and role.

---

## WEEK 4 — Donor Module & Verification → **Objective O2**

**Goal:** an admin can see pending donors and **approve or reject** each one *with a recorded reason*; approving activates the donor's login.

**Learn first:** how one action touches multiple tables (update `donors.verification_status` **and** flip `users.is_active`), and why you record *who* did it and *why* (accountability — graders look for this).

**Build (checklist):**
- [ ] `GET /api/donors?status=pending` (admin only) — list donors, filterable by verification status.
- [ ] `GET /api/donors/me` (donor only) — a donor sees their own verification status.
- [ ] `PATCH /api/donors/:id/verify` (admin only) — body `{ decision: "approve"|"reject", note: "..." }`.
  - On **approve**: set `verification_status = approved`, set `users.is_active = true`, record `verified_by` and `verified_at`.
  - On **reject**: set `verification_status = rejected`, keep the account inactive, store the note.
  - Either way: write an `audit_logs` row (`donor.approved` / `donor.rejected`).

**Hints:** the approve/reject is two writes that should logically succeed or fail together — read about **SQL transactions** and consider wrapping them. Validate that `decision` is exactly one of the two allowed words (use your validation middleware) and that `note` isn't empty on rejection.

**Test it:** register a donor (starts pending, can't log in). As admin, list pending → see them. Approve → the donor can now log in. Register another, reject with a note → they still can't log in and the note is stored. Check `audit_logs` has both events.

**Pitfalls:** approving the donor row but forgetting to activate the user (they still can't log in); letting a rejected donor through; allowing a donor to approve themselves (guard with `authorize('admin')`).

**Done when:** the full pending → approved/rejected lifecycle works end to end, with reasons recorded.

---

## WEEK 5 — Food Posting Module → **Objective O3**

**Goal:** a **verified** donor can create a food post with full details and an expiry; donors see their own posts, admins see all.

**Learn first:** guarding an action by *more than role* — here, only donors whose verification is `approved` may post. This is a business rule on top of RBAC.

**Build (checklist):**
- [ ] A `requireVerifiedDonor` check (middleware or in-controller) — role is donor **and** their donor record is approved, else 403.
- [ ] `POST /api/food-posts` — validate (title, quantity > 0, `expires_at` in the future), insert with `status = available`.
- [ ] `GET /api/food-posts` — a donor sees only their own; an admin sees all. Support a `?status=` filter.
- [ ] `GET /api/food-posts/:id` and `PATCH /api/food-posts/:id` (donor can edit their own *while still available*).
- [ ] **Expiry handling:** decide how a post becomes `expired`. Simplest for a student project: a *lazy sweep* — whenever you list posts, flip any whose `expires_at` has passed and are still `available` to `expired`. (A scheduled job is the fancier alternative — optional.)

**Hints (pseudocode for the lazy sweep):**
```
// run at the start of listFoodPosts:
UPDATE food_posts SET status='expired'
WHERE status='available' AND expires_at < NOW()
```

**Test it:** as a *pending* donor, try to post → 403. Approve them, post → 201, status `available`. Create a post that expires in the past → after the next list call it shows `expired`. As another donor, confirm you can't see the first donor's posts.

**Pitfalls:** letting unverified donors post; trusting the client's idea of "now" for expiry (always use the server's `NOW()`); allowing edits after a post is assigned/collected.

**Done when:** verified donors can post and manage food, expiry works, and visibility is correctly scoped per role.

---

## WEEK 6 — Volunteer Management & Task Assignment → **Objective O4**

**Goal:** an admin sees available posts and available volunteers and **assigns** a collection task; the post moves to `assigned`.

**Learn first:** keeping two pieces of state consistent — creating a `collection_tasks` row **and** updating the `food_posts.status`. And preventing double-assignment (that unique constraint you added in Week 2 now earns its keep).

**Build (checklist):**
- [ ] `GET /api/volunteers` (admin) — list users with role `volunteer` (later: show their current task load).
- [ ] `POST /api/tasks` (admin) — body `{ food_post_id, volunteer_id, notes }`.
  - Verify the post exists and is `available`.
  - Insert a `collection_tasks` row with `status = assigned`.
  - Update the post to `status = assigned`.
  - Audit-log it.
- [ ] `GET /api/tasks` (admin sees all; volunteer sees only their own — you'll use this next week).

**Hints:** wrap the "create task + update post" in a transaction so you never end up with a task pointing at a post that didn't get marked assigned. If the unique constraint fires (post already has a task), catch that specific error and return a friendly 409 ("already assigned") instead of a raw 500.

**Test it:** as admin, assign an available post to a volunteer → task created, post now `assigned`. Try to assign the *same* post again → blocked (409). Try assigning an already-collected post → rejected.

**Pitfalls:** assigning a post that isn't available; the post status and task status drifting out of sync (transactions prevent this); letting a volunteer assign tasks (admin only).

**Done when:** an admin can assign exactly one volunteer per available post, with the post status kept in lockstep.

---

## WEEK 7 — Volunteer Dashboard & Status Updates → **Objective O5**

**Goal:** a volunteer sees their assigned tasks and walks each one through `assigned → picked_up → delivered`; on delivery the underlying post becomes `collected`.

**Learn first:** **state machines** — not every status can follow every other status. A volunteer can't jump from `assigned` straight to `delivered`, and can't move a task that's already delivered. Encode the *legal transitions*.

**Build (checklist):**
- [ ] `GET /api/tasks` (volunteer view) — only tasks where `volunteer_id = me`, joined with the post + donor contact so they know what to collect and where.
- [ ] `PATCH /api/tasks/:id/status` (volunteer, own task only) — body `{ status }`.
  - Allow only legal transitions (below). Reject illegal ones with 422.
  - On `picked_up`: stamp `picked_up_at`.
  - On `delivered`: stamp `delivered_at` **and** set the food post to `collected`.
  - Audit-log each transition.

**Hints — the transition guard (pseudocode):**
```
legalNext = {
  "assigned":  ["picked_up"],
  "picked_up": ["delivered"],
  "delivered": []        // terminal
}
if requestedStatus not in legalNext[task.currentStatus]:
    return 422 ("illegal status transition")
```
Also verify `task.volunteer_id === req.user.id` so volunteers can't touch each other's tasks.

**Test it:** as a volunteer, list tasks → see only yours. Move `assigned → picked_up → delivered`; confirm timestamps fill in and the post becomes `collected`. Try `assigned → delivered` directly → 422. Try updating a teammate's task with your token → 403/404.

**Pitfalls:** allowing any status from any status; forgetting to flip the post to `collected` on delivery (the distribution step in Week 8 depends on it); letting one volunteer edit another's task.

**Done when:** the full pickup→delivery flow works with enforced transitions and correct post status updates.

---

## WEEK 8 — Distribution Logging & Analytics → **Objective O6**

**Goal:** an admin logs that collected food was distributed (with impact numbers), and an analytics dashboard summarises the whole operation.

**Learn first:** SQL **aggregation** — `COUNT`, `SUM`, `GROUP BY` — to turn rows into metrics. This is where `SELECT` gets interesting.

**Build (checklist):**
- [ ] `POST /api/distributions` (admin) — only for posts whose status is `collected`. Record `recipients_count`, `meals_served`, `location`, `distributed_by`, link the task/post. Then set the post to `distributed`. Audit-log.
- [ ] `GET /api/distributions` (admin) — list, with optional `?from=&to=` date range.
- [ ] `GET /api/analytics/summary` (admin) — return a JSON object with metrics like: total donors (and pending count), total posts by status, total tasks by status, total meals served, total recipients, a **collection rate** (collected+distributed ÷ all posts), and a **top donors** list.

**Hints — analytics is several small aggregate queries combined into one response:**
```
totalMealsServed   = SELECT SUM(meals_served) FROM distributions
postsByStatus      = SELECT status, COUNT(*) FROM food_posts GROUP BY status
collectionRate     = (collected + distributed) / total posts
topDonors          = SELECT donor, COUNT(posts) ... GROUP BY donor ORDER BY ... LIMIT 5
```
Run them, assemble a plain object, return it. The React dashboard just renders the numbers.

**Test it:** run the full lifecycle once (post → assign → pick up → deliver → distribute). Then hit `/api/analytics/summary` and verify every number matches what you did by hand. Log a distribution for a post that *isn't* collected → rejected.

**Pitfalls:** dividing by zero in the collection rate when there are no posts (guard it); `SUM` returning `null` instead of `0` when there are no rows (coalesce it); letting distribution happen before collection.

**Done when:** the dashboard numbers are provably correct against a manual run-through.

---

## WEEK 9 — Report Generation (PDF & CSV) → **Objective O7**

**Goal:** an admin can **download** the distributions data as both a CSV (for spreadsheets) and a PDF (for stakeholders).

**Learn first:** how a server sends a *file* instead of JSON — the `Content-Type` and `Content-Disposition` headers that make a browser download rather than display. Search: *"express send file download header"*, *"generate csv node"*, *"pdfkit tutorial"*.

**Build (checklist):**
- [ ] `GET /api/reports/distributions.csv` (admin) — query distributions, convert rows to CSV (a library like `json2csv` helps), set headers so the browser downloads `distributions.csv`.
- [ ] `GET /api/reports/distributions.pdf` (admin) — generate a simple PDF (e.g. with `pdfkit`): a title, the date range, and a table of distributions with totals at the bottom.
- [ ] Wire "Download CSV / PDF" buttons on the admin dashboard.

**Hints:** for CSV, the key is the response headers:
```
res.header('Content-Type', 'text/csv')
res.header('Content-Disposition', 'attachment; filename="distributions.csv"')
res.send(csvString)
```
For PDF, stream the document straight to the response. Keep the layout simple — a header, a table, a totals row. Don't gold-plate it.

**Test it:** click each button in the browser; a file downloads. Open the CSV in Excel/Sheets — columns line up. Open the PDF — it's readable and the totals match the dashboard.

**Pitfalls:** building the file in memory for huge datasets (fine for a student project, just know the limitation); wrong headers so it displays as text instead of downloading; forgetting to guard these as admin-only.

**Done when:** both downloads work from the UI and the data inside matches your analytics.

---

## WEEK 10 — System & Security Testing → **Objective O8**

**Goal:** harden everything. This objective is mostly *verifying and tightening* what you built, plus a few new protections.

**Learn first:** the OWASP "top 10" at a beginner level — especially injection, broken auth, and broken access control. Search: *"OWASP top 10 explained simply"*, *"express-validator tutorial"*, *"express-rate-limit"*, *"helmet js"*.

**Security checklist (your O8 evidence — tick every box and screenshot for the report):**
- [ ] **Server-side input validation** on *every* write endpoint using `express-validator` (or similar). Never trust the client. Invalid input → 422 with clear messages.
- [ ] **SQL injection safe** — confirm every query uses parameterised placeholders (`?`), never string concatenation. Grep your code for any query building strings with `+`.
- [ ] **Rate limiting** with `express-rate-limit` — a stricter limit on `/api/auth/*` (login/register) to slow brute-force, a general limit elsewhere.
- [ ] **Helmet** — set secure HTTP headers with one line of middleware.
- [ ] **CORS** configured to your front-end origin, not wide open in production.
- [ ] **Passwords** — confirm bcrypt 12 rounds, hashes only, never logged.
- [ ] **JWT** — secret in `.env`, sensible expiry, no sensitive data in the payload.
- [ ] **RBAC** — re-test that each role gets 403 on others' endpoints (write these as automated tests).
- [ ] **Error handling** — a central error handler returns *generic* messages to clients (no stack traces, no SQL errors leaking to the browser); full details logged server-side only.
- [ ] **`.env` git-ignored** — confirm it's not in your repo history. (If it ever was committed, rotate the secrets.)
- [ ] **HTTPS** — you get this automatically from Vercel/Render in Week 12; note it in the report.
- [ ] **Audit logs** — confirm sensitive actions (login, approvals, assignments, status changes, distributions) all write a row.

**Test it:** try to break your own app. Send a login with a missing field (expect 422), a SQL-ish string in a search box (expect it treated as plain text), 50 rapid login attempts (expect rate-limit 429), a donor token on an admin route (expect 403). Each defense that holds is evidence for O8.

**Pitfalls:** validating on the front end only (useless for security — attackers skip your UI); leaking stack traces; an over-permissive CORS setting.

**Done when:** every box above is ticked, with a screenshot or test proving each — this section basically writes your report's security chapter.

---

## WEEK 11 — User Acceptance Testing (UAT)

**Goal:** real people (classmates, the supervisor, ideally someone who'd actually use it) try the system and you fix what they stumble on.

**Build/run (checklist):**
- [ ] Write **UAT scenarios** from your Week 1 requirements — one per user story ("As a donor, I can post surplus food and see its status").
- [ ] Recruit 3–5 testers. Give them the scenarios and demo logins. **Watch silently** — don't help; note where they get stuck.
- [ ] Log every bug/confusion in your task board with severity.
- [ ] Fix the high-severity issues; record the rest as "known limitations" in the report.

**Test it:** re-run the same scenarios after fixing. The blocking issues should be gone.

**Done when:** all critical-path scenarios pass for a first-time user without your help, and bugs are logged with their resolution status.

> Throughout Weeks 3–11, also keep your **automated tests** growing (next section). UAT is the human layer on top of them.

---

## WEEK 11–12 — Documentation & Final Report

**Goal:** everything a reader (and grader) needs to understand, run, and evaluate the project.

**Build (checklist):**
- [ ] **README.md** at the repo root: prerequisites, how to load the DB, how to run server + client, the demo logins, and a short feature tour.
- [ ] **API documentation**: a table of every endpoint — method, path, who can call it, request body, response. (You can also use your Postman collection as living docs — export it.)
- [ ] **The final report**: map each chapter to objectives O1–O8, include the ERD, architecture diagram, screenshots, your testing evidence (from Week 10), and the UAT results.
- [ ] **A short demo video or script** for the viva so the live demo can't be derailed by wifi.

**Done when:** a stranger could clone the repo, follow the README, and run the whole thing; and the report clearly shows where each objective was met.

---

## WEEK 12 — Deployment & Handover

**Goal:** the app is live on the internet over HTTPS, fulfilling the last piece of O8.

**Learn first:** environment variables in hosting, what a "build" is, and managed databases. Your proposal names **Vercel** and **Render**.

**Deployment plan:**
- [ ] **Database** — create a free/managed MySQL instance (e.g. Render's managed database, Railway, PlanetScale, or Aiven). Load your `schema.sql` into it. Note the connection details.
- [ ] **Back end (Express)** → **Render** (a Web Service). Set the environment variables (DB creds, `JWT_SECRET`, etc.) in Render's dashboard — *not* in code. Render gives you an HTTPS URL.
- [ ] **Front end (React)** → **Vercel**. Set the API base URL env var to your Render URL. Vercel builds and serves it over HTTPS.
- [ ] **Connect them** — make sure CORS on the server allows your Vercel domain, and the client points at the Render API.
- [ ] **Seed** the production demo accounts so the viva works.

**Test it:** open the Vercel URL on your phone (off campus wifi), log in as each role, run the full lifecycle. If it works from a device that's never seen your code, you've truly deployed.

**Pitfalls:** committing production secrets (set them in the dashboard); CORS blocking the deployed front end; forgetting to seed the demo data; free-tier servers "sleeping" — warm it up before the viva.

**Done when:** the live URL works end-to-end over HTTPS for all three roles.

---

# PART 9 — Testing Strategy (runs Weeks 3–11)

Your proposal commits to **Jest, Supertest, and Postman**. Don't leave testing to the end — add tests as each module lands.

| Type | Tool | When | What it checks |
|------|------|------|----------------|
| **Unit** | Jest | Per module | Small pure functions in isolation — e.g. the status-transition guard, the JWT helper. |
| **Integration** | Jest + Supertest | Per module | A real HTTP request hits your Express app and you assert the status code and JSON — e.g. "login with wrong password → 401". |
| **Manual / exploratory** | Postman | Continuously | Hitting endpoints by hand as you build; save a **collection** to re-run. |
| **System & security** | Postman + manual | Week 10 | The whole flow + the attack attempts from O8. |
| **Acceptance** | Humans | Week 11 | Real users against real scenarios. |

**Start tiny:** your first test can be a Jest unit test of the JWT sign/verify helper — it needs no database and proves your test setup works. Then add a Supertest case for login. Aim for a test on each *security-critical* path (auth, RBAC, status transitions) even if you can't test everything.

**A good habit:** every time you fix a bug, write a test that would have caught it. Your test suite grows to match your real failure modes.

---

# PART 10 — The Frontend Track (build in parallel)

The Gantt is back-end-module-centric, but your front-end pair builds **alongside** each module, against the wireframes. A sane order:

1. **App skeleton** (Week 3): Vite + React + Router + Tailwind; an axios instance that attaches the JWT; an auth context that stores the token + user; a `ProtectedRoute` that redirects unauthenticated users to login and sends each role to its own home.
2. **Auth pages** (Week 3): Login and Register (with the donor/volunteer toggle and donor-only fields).
3. **Donor dashboard** (Week 5): list my posts + create-post form.
4. **Admin pages** (Weeks 4/6/8): donor approvals queue, task assignment, analytics dashboard, distributions log + report buttons.
5. **Volunteer dashboard** (Week 7): my tasks + pickup/deliver buttons.

**Front-end principles to learn and apply:**
- **Controlled forms** — inputs bound to `useState`.
- **Loading and error states** — every API call has three states (loading, success, error); show all three, never a blank screen.
- **Never store secrets** — the token lives in memory/localStorage just to send on requests; all *enforcement* is server-side. The UI hiding a button is convenience, not security.
- **Reusable components** — a `StatusBadge`, a `Card`, a `Table`, a `StatCard`. Build once, reuse everywhere.
- **Show the role** — the navbar and available actions change by role, but the server still enforces it.

**Test the UI:** in the browser DevTools Network tab, watch each request carry the `Authorization` header. Log in as each role and confirm you only see your own screens and data.

---

# PART 11 — Reference Appendices

## A. Full API endpoint reference (your build target)

You implement these. Group = the controller/route file they live in.

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | public | Register a donor or volunteer |
| POST | `/api/auth/login` | public | Log in, receive JWT |
| GET | `/api/auth/me` | any auth | Current user |
| GET | `/api/donors` | admin | List donors (filter by status) |
| GET | `/api/donors/me` | donor | My verification status |
| PATCH | `/api/donors/:id/verify` | admin | Approve/reject a donor |
| POST | `/api/food-posts` | verified donor | Create a food post |
| GET | `/api/food-posts` | donor/admin | List (own / all) |
| GET | `/api/food-posts/:id` | donor/admin | One post |
| PATCH | `/api/food-posts/:id` | donor (own) | Edit while available |
| GET | `/api/volunteers` | admin | List volunteers |
| POST | `/api/tasks` | admin | Assign a collection task |
| GET | `/api/tasks` | admin/volunteer | List (all / own) |
| PATCH | `/api/tasks/:id/status` | volunteer (own) | Advance status |
| POST | `/api/distributions` | admin | Log a distribution |
| GET | `/api/distributions` | admin | List distributions |
| GET | `/api/analytics/summary` | admin | Dashboard metrics |
| GET | `/api/reports/distributions.csv` | admin | CSV download |
| GET | `/api/reports/distributions.pdf` | admin | PDF download |
| GET | `/api/health` | public | Liveness check |

## B. Environment variables (`server/.env`)

| Var | Example | Notes |
|-----|---------|-------|
| `PORT` | `5000` | API port |
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `3306` | |
| `DB_USER` | `root` | |
| `DB_PASSWORD` | *(yours)* | XAMPP default is empty |
| `DB_NAME` | `foodbridge` | |
| `JWT_SECRET` | *(long random string)* | Keep secret; rotate if leaked |
| `BCRYPT_ROUNDS` | `12` | Per the proposal |
| `CLIENT_ORIGIN` | `http://localhost:5173` | For CORS |

Front end (`client/.env`): one var for the API base URL (e.g. `VITE_API_BASE`), empty in dev if you proxy.

## C. Status vocabularies (keep these consistent everywhere)

- **`users.role`**: `donor` · `admin` · `volunteer`
- **`donors.verification_status`**: `pending` · `approved` · `rejected`
- **`food_posts.status`**: `available` · `assigned` · `collected` · `distributed` · `expired`
- **`collection_tasks.status`**: `assigned` · `picked_up` · `delivered`

## D. Glossary

- **Hashing** — a one-way transform of a password so the stored value can't be reversed to the original.
- **JWT** — a signed token proving who the bearer is; readable by anyone, tamper-evident.
- **Middleware** — a function that runs in the request pipeline before your handler.
- **RBAC** — Role-Based Access Control; permissions decided by the user's role.
- **Parameterised query** — passing user values to SQL via `?` placeholders so they can't be interpreted as SQL (prevents injection).
- **Pool** — a set of reusable DB connections so you don't open a new one per request.
- **Transaction** — a group of SQL writes that all succeed or all roll back.
- **CORS** — browser rule controlling which web origins may call your API.

---

# PART 12 — Final Submission Checklist (map to O1–O8)

Before the viva, confirm each objective has working code **and** evidence (screenshot/test) for the report:

- [ ] **O1** — Register/login with JWT + bcrypt(12); RBAC returns 401/403 correctly.
- [ ] **O2** — Admin approves/rejects donors with a recorded reason; approval activates login.
- [ ] **O3** — Verified donors post surplus food with quantity, details, and expiry; expiry works.
- [ ] **O4** — Admin assigns collection tasks to volunteers; no double-assignment.
- [ ] **O5** — Volunteers view tasks and update status through legal transitions in real time.
- [ ] **O6** — Analytics dashboard shows donation volume, collection rate, and impact metrics.
- [ ] **O7** — PDF and CSV exports download and match the data.
- [ ] **O8** — Validation, rate limiting, HTTPS (deployed), `.env` management, audit logs — all in place.

Plus: ERD ✓, architecture diagram ✓, README ✓, API docs ✓, test suite ✓, UAT results ✓, deployed live URL ✓, demo accounts seeded ✓.

---

# Resources

- **JavaScript & async** — MDN Web Docs (the canonical reference); "JavaScript.info" for tutorials.
- **Node/Express** — the official Express guide; "Express middleware" docs.
- **SQL/MySQL** — the MySQL reference manual; any "SQL JOIN" interactive tutorial.
- **React** — the official React docs (react.dev) — the new docs are genuinely excellent for learning.
- **Auth** — the `jsonwebtoken` and `bcrypt` npm readmes; jwt.io to inspect tokens.
- **Security** — OWASP Top 10 (beginner summaries); `helmet`, `express-rate-limit`, `express-validator` docs.
- **Testing** — Jest docs; Supertest readme; Postman's "Learning Center".
- **Deployment** — Render and Vercel "quickstart" guides.

---

*Build it slowly, understand every piece, and you'll be able to defend any line of it in the viva. Good luck — you've got this.*
