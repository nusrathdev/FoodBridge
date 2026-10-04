# FoodBridge — Project Progress Report

**Project:** FoodBridge — Surplus Food Donation & Distribution Platform
**Prepared by:** Nusrath
**Date:** 22 July 2026
**Status:** Core system complete and ready for demonstration

---

## 1. Introduction

FoodBridge is a web-based platform that connects food donors — restaurants, bakeries, supermarkets, and caterers — with volunteers who collect surplus food and distribute it to communities in need. Every day, large quantities of edible food are discarded by businesses while vulnerable groups go without meals. FoodBridge addresses this gap by providing a coordinated digital pipeline: donors post surplus food with a pickup window, administrators verify donors and assign collection tasks, and volunteers collect and distribute the food to recipient groups, with every step tracked and auditable.

This report summarizes the progress made on the project to date, describes the features that have been implemented across the backend, frontend, and database layers, and outlines the demonstration plan and the remaining work.

## 2. Project Objectives

The system was designed around the following objectives, all of which have been achieved in the current build:

1. Provide secure, role-based access for three types of users: donors, volunteers, and administrators.
2. Allow verified donors to post surplus food with quantity, pickup address, and a defined pickup time window.
3. Give administrators the ability to verify donor organizations, approve or reject applications with reasons, and assign collection tasks to volunteers.
4. Enable volunteers to view their assigned tasks and update them through the collection and delivery stages.
5. Record final distributions — which recipient group received the food, how much, and who distributed it.
6. Track the full lifecycle of every food post (available → assigned → collected → distributed, or expired) for transparency and reporting.
7. Provide analytics and exportable reports so the organization can measure its impact.

## 3. Work Completed

### 3.1 System Architecture

The application follows a standard three-tier architecture. The frontend is a React single-page application built with Vite, communicating with the backend over a REST API. The backend is a Node.js/Express server organized into routes, controllers, validators, middleware, and services, which keeps the codebase modular and easy to extend. Data is persisted in a MySQL relational database. The frontend runs on port 5173 during development and the API server on port 5000.

### 3.2 Database Design

The MySQL schema has been fully designed and implemented with six tables that model the complete donation pipeline:

- **users** — all accounts with name, email, hashed password, and role (donor, volunteer, or admin).
- **donors** — donor organization profiles linked to user accounts, including organization name, food handling certificate, verification status (pending, approved, or rejected), rejection reason, and verification timestamp.
- **food_posts** — surplus food listings with food type, quantity, pickup address, pickup window start and end times, and lifecycle status (available, assigned, collected, distributed, or expired).
- **collection_tasks** — assignments linking a food post to a volunteer, recording who assigned the task and timestamps for assignment, collection, and delivery.
- **distributions** — final distribution records with the recipient group, quantity distributed, the distributing volunteer, and notes.
- **audit_logs** — a record of significant actions for accountability.

All primary keys use UUIDs, and foreign key relationships enforce referential integrity across the pipeline.

### 3.3 Backend Development

The Express backend is feature-complete for the core workflow. The following modules have been implemented and tested:

**Authentication and security.** Users register and log in through a JWT-based authentication system. Passwords are hashed with bcrypt before storage, and tokens carry the user's role for authorization. Middleware protects every private route and enforces role-based access, so a volunteer cannot reach admin endpoints and vice versa. The server is hardened with Helmet for secure HTTP headers, CORS configuration, request rate limiting to prevent abuse, and express-validator input validation on all write endpoints.

**Donor management.** When a user registers as a donor, a donor profile is automatically created in pending status. Administrators can review pending applications and approve them or reject them with a written reason, which the donor can see. Only approved donors can post food.

**Food post management.** Approved donors can create food posts specifying the food type, quantity, pickup address, and pickup window. Donors can view and manage their own posts, and the status of each post updates automatically as it moves through the pipeline.

**Task assignment and tracking.** Administrators view available food posts and assign them to volunteers, creating a collection task. Volunteers see their assigned tasks and update the status as they collect and deliver the food, with timestamps recorded at each step.

**Distribution recording.** Once food is delivered, the distribution is logged with the recipient group, the quantity distributed, and optional notes, completing the chain from donation to beneficiary.

**Analytics and reporting.** An analytics module aggregates platform activity for the admin dashboard, and a reporting service can export data as CSV and PDF documents using json2csv and PDFKit, so impact reports can be shared with stakeholders.

### 3.4 Frontend Development

The React client provides a dedicated experience for each role, with routing guarded by a ProtectedRoute component and authentication state managed globally through an AuthContext provider.

- **Public pages:** Login and Registration, with registration supporting donor-specific fields such as organization name and food handling certificate. Clear error feedback is shown on failed logins and invalid input.
- **Donor pages:** a Dashboard summarizing the donor's activity, a Post Food form for creating new surplus listings, and a My Posts page showing each post and its live status.
- **Admin pages:** a Dashboard with platform analytics, a Donor Verification page for approving or rejecting donor applications, a Task Assignment page for matching available food posts with volunteers, and a Distributions page for reviewing completed distributions.
- **Volunteer pages:** a Tasks page where volunteers see their assigned pickups and progress them through collected and delivered states.
- **Shared components:** a navigation bar that adapts to the logged-in role, status badges that color-code the food post lifecycle, and an Unauthorized page for access violations.

### 3.5 Demonstration Data

To support a realistic demonstration, seed scripts have been prepared. An admin seeding script creates the system administrator account, and a demo seeding script populates the database with six donor organizations (four approved, one pending verification, and one rejected with a reason), four volunteers, and eleven food posts covering every lifecycle state — three currently available, two assigned, two collected, three fully distributed to recipient groups such as community shelters and an old age home, and one expired. Seven collection tasks and three distribution records complete the pipeline, so the analytics dashboard and reports display meaningful data during the demo.

## 4. Demonstration Plan

The demonstration will walk through the complete life of a donation:

1. **Donor journey:** log in as an approved donor, post a new surplus food item with a pickup window, and show it appearing in My Posts as "available."
2. **Admin verification:** log in as the administrator, show the pending donor application and approve it, and show the rejected application with its reason.
3. **Task assignment:** as admin, assign the newly posted food to a volunteer.
4. **Volunteer journey:** log in as that volunteer, view the assigned task, and mark it collected and then delivered.
5. **Distribution and impact:** record the distribution to a recipient group, then return to the admin dashboard to show the updated analytics and export a report.

## 5. Challenges Addressed

Several practical challenges were resolved during development. Designing the food post lifecycle required careful state management so that statuses stay consistent between posts, tasks, and distributions. Role-based authorization needed to be enforced on both the client (route guards) and the server (middleware) to be genuinely secure. Handling pickup time windows required attention to date handling between the JavaScript client, the API, and MySQL DATETIME columns. Finally, input validation and rate limiting were added after reviewing common API security practices.

## 6. Remaining Work and Future Enhancements

The core system is complete. The following items are planned as future enhancements:

- Email or in-app notifications when a donor is approved, a task is assigned, or a pickup window is about to expire.
- Automatic expiry of food posts whose pickup window has passed, via a scheduled job.
- A public impact page showing total meals rescued and communities served.
- Map integration for pickup addresses and volunteer routing.
- Mobile-responsive refinements and accessibility improvements.
- Deployment to a cloud environment with a managed MySQL instance and CI/CD.

## 7. Conclusion

FoodBridge has progressed from concept to a working, end-to-end system. The database schema, secure REST API, and role-based React frontend are all implemented and integrated, and the platform now supports the complete journey of surplus food — from a donor's listing, through admin verification and volunteer collection, to a recorded distribution that feeds people in need. With demonstration data prepared and the demo flow rehearsed, the project is ready for presentation, and the remaining roadmap items are enhancements rather than gaps in core functionality.
