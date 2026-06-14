# FoodBridge — Food Distribution Management System

Full-stack starter for the **ICT 222-2 ICT Project** (Uva Wellassa University of Sri Lanka).
Built to the proposal spec: **MySQL · Express.js · React.js · Node.js**, three-tier architecture,
role-based access for **Donor / NGO Admin / Volunteer**, JWT + bcrypt auth, and PDF/CSV reporting.

```
foodbridge/
├── database/         MySQL schema (6 tables)
├── server/           Node + Express REST API
└── client/           React + Vite + Tailwind frontend
```

---

## 0. Quick start (optional, one command)

After the database is loaded (step 2) and you've created the two `.env` files, you can install and run both apps from the project root:

```bash
npm install                 # installs the root concurrently runner
npm run install:all         # installs server + client deps
npm run seed                # seeds admin + demo accounts
npm run dev                 # runs API (:5000) + frontend (:5173) together
```

Prefer to do it step by step? Follow sections 3 and 4 below instead.

---

## 1. Prerequisites

| Tool      | Version | Notes                                                   |
|-----------|---------|---------------------------------------------------------|
| Node.js   | 18 LTS+ | https://nodejs.org                                      |
| MySQL     | 8.x     | Standalone, or via **XAMPP / MAMP** (MySQL on port 3306) |
| npm       | 9+      | Ships with Node                                          |

> Using XAMPP? Start **MySQL** from the control panel — that's all you need.

---

## 2. Database setup

From the project root, load the schema (creates the `foodbridge` database and all 6 tables):

```bash
mysql -u root -p < database/schema.sql
```

No password set on MySQL root (typical XAMPP)? Drop the `-p`:

```bash
mysql -u root < database/schema.sql
```

Tables created: `users`, `donors`, `food_posts`, `collection_tasks`, `distributions`, `audit_logs`.

---

## 3. Backend (API)

```bash
cd server
cp .env.example .env        # then edit DB_PASSWORD / JWT_SECRET
npm install
npm run seed                # creates the default admin + demo accounts
npm run dev                 # starts http://localhost:5000
```

`npm run seed` prints the demo logins:

| Role      | Email                     | Password       |
|-----------|---------------------------|----------------|
| Admin     | admin@foodbridge.lk       | `Admin@123`    |
| Donor     | donor@foodbridge.lk       | `Donor@123`    |
| Volunteer | volunteer@foodbridge.lk   | `Volunteer@123`|

> **Change `JWT_SECRET` in `.env`** to a long random string before any real use.
> `.env` is git-ignored so secrets never reach version control.

Health check: open http://localhost:5000/api/health → `{"status":"ok"}`.

---

## 4. Frontend (client)

In a **second terminal**:

```bash
cd client
cp .env.example .env        # default is fine for local dev
npm install
npm run dev                 # starts http://localhost:5173
```

Open **http://localhost:5173** and log in with one of the demo accounts.
The Vite dev server proxies `/api` to the backend on port 5000, so no CORS config is needed in development.

---

## 5. Try the full workflow

1. **Donor** logs in → *My Food Posts* → **+ New post** → list surplus food.
2. **Admin** → *Task Assignment* → assign the available post to a volunteer.
3. **Volunteer** → *My Tasks* → **Confirm pickup** → **Mark delivered**.
4. **Admin** → *Distributions* → log the distribution to a community.
5. **Admin** → *Dashboard* → see impact metrics → **Export PDF / CSV**.
6. Register a brand-new donor → **Admin → Donor Approvals** → Approve → that donor can now log in and post.

---

## 6. API reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint                          | Role            | Purpose                              |
|--------|-----------------------------------|-----------------|--------------------------------------|
| POST   | `/auth/register`                  | public          | Donor / volunteer self-registration  |
| POST   | `/auth/login`                     | public          | Login → JWT                          |
| GET    | `/auth/me`                        | any             | Current user                         |
| GET    | `/donors?status=`                 | admin           | List donors                          |
| GET    | `/donors/me`                      | donor           | Own donor profile + status           |
| PATCH  | `/donors/:id/verify`              | admin           | Approve / reject donor               |
| POST   | `/food-posts`                     | donor           | Create surplus food post             |
| GET    | `/food-posts?status=`             | donor / admin   | List posts (own / all)               |
| PATCH  | `/food-posts/:id`                 | donor           | Edit / cancel post                   |
| GET    | `/tasks/volunteers`               | admin           | Active volunteer roster              |
| POST   | `/tasks`                          | admin           | Assign post → volunteer              |
| GET    | `/tasks?status=`                  | admin / volun.  | List tasks (all / own)               |
| PATCH  | `/tasks/:id/status`               | volunteer       | picked_up → delivered                |
| POST   | `/distributions`                  | admin           | Log community distribution           |
| GET    | `/distributions?from=&to=`        | admin           | Distribution log                     |
| GET    | `/analytics/summary`              | admin           | Dashboard metrics                    |
| GET    | `/reports/distributions.csv`      | admin           | CSV export                           |
| GET    | `/reports/distributions.pdf`      | admin           | PDF export                           |

---

## 7. How the code maps to the proposal objectives

| Obj | Where it lives                                                                 |
|-----|--------------------------------------------------------------------------------|
| O1  | `auth.controller.js`, `middleware/auth.js`, `middleware/rbac.js` (JWT + bcrypt + RBAC) |
| O2  | `donor.controller.js` `verifyDonor` + `admin/DonorApprovals.jsx`               |
| O3  | `foodpost.controller.js` + `donor/DonorDashboard.jsx`                          |
| O4  | `task.controller.js` `assignTask` + `admin/TaskAssignment.jsx`                 |
| O5  | `task.controller.js` `updateTaskStatus` + `volunteer/VolunteerDashboard.jsx`  |
| O6  | `analytics.controller.js` + `admin/AdminDashboard.jsx`                         |
| O7  | `report.controller.js` (PDFKit + json2csv)                                     |
| O8  | `helmet`, `express-rate-limit`, `express-validator`, `dotenv`, audit logs      |

---

## 8. Testing

```bash
cd server
npm test            # Jest — sample JWT unit test in tests/auth.test.js
```

Extend with Supertest (already a dev dependency) for API integration tests, and Postman
for manual endpoint testing, per the proposal's testing strategy.

---

## 9. Deployment notes (per proposal: Vercel / Render)

- **Database** → a managed MySQL host (e.g. Railway, PlanetScale, Aiven). Run `schema.sql` there.
- **Backend** → Render / Railway as a Node web service. Set all `.env` values as host environment
  variables. Run `npm run seed` once against the production DB.
- **Frontend** → Vercel / Netlify. Set `VITE_API_BASE` to the deployed API URL and rebuild.
- Set `CLIENT_ORIGIN` on the backend to the deployed frontend URL for CORS.

---

## 10. Notes

- Recipients are **not** system users — distribution is logged by the NGO, matching the proposal model.
- Donor accounts start **inactive** and cannot log in until an admin approves them.
- A food post moves: `available → assigned → collected → distributed` (or `expired`).
- Every sensitive action is written to `audit_logs` for accountability.

Team: ICT23090 · ICT23092 · ICT23093 · ICT23027 · ICT23066 — Supervisor: Mr. V Dishankan
