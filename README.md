
# Project Gateway

Project Gateway is a Next.js application designed to streamline the process of project proposal submissions. It provides a user-friendly interface for clients to submit their project details and an administrative panel for managing these submissions.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Firebase Setup](#firebase-setup)
  - [Environment Configuration](#environment-configuration)
  - [Firestore Security Rules](#firestore-security-rules)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Admin Panel](#admin-panel)
- [Email Configuration (Nodemailer with Gmail)](#email-configuration-nodemailer-with-gmail)
- [Deployment](#deployment)

## Features

**Client-Facing:**
-   **Landing Page:** Modern, responsive landing page showcasing:
    -   Hero section
    -   "Our Work" portfolio section
    -   "Services Offered" section
    -   "About Us" section
    -   Call-to-action (CTA)
-   **Project Submission Form:**
    -   Intuitive form for clients to submit project details (name, email, phone, project title, description).
    -   Supports multiple file uploads (up to 5 files, 200KB each, common document and image types).
    -   Client-side and server-side validation.
-   **Email Notifications:**
    -   Clients receive an email confirmation upon successful project submission.

**Admin Panel:**
-   **Secure Authentication:** Password-protected admin area.
-   **Dashboard:**
    -   View all project submissions in a sortable and searchable table.
    -   Quick overview of project title, client name, submission date, number of files, and status.
-   **Submission Management:**
    -   Clickable rows to view detailed project information, including attached files (downloadable).
    -   Actions on submissions:
        -   **Accept:** Marks the project as accepted.
        -   **Accept with Conditions:** Marks the project as accepted, allowing admins to specify conditions.
        -   **Reject with Reason:** Marks the project as rejected, allowing admins to provide a reason.
        -   **Delete:** Permanently removes a submission.
-   **Email Notifications:**
    -   Admins receive an email notification for each new project submission.
    -   Clients receive an email notification when an admin takes action (accept, accept with conditions, reject) on their submission, including any specified conditions or reasons.

## Tech Stack

-   **Framework:** Next.js 15 (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** ShadCN UI, Lucide React (icons)
-   **Form Handling:** React Hook Form, Zod (for validation)
-   **Database:** Firebase Firestore (for storing submission data and file content as Data URIs)
-   **Authentication:** Custom password-based (for admin panel) using React Context API
-   **Email Service:** Nodemailer (configured for Gmail via SMTP)
-   **Deployment:** Vercel (includes Speed Insights)

## Environment Variables

Create a `.env.local` file in the root of your project and add the following variables. See `.env.example` for a template.

-   **Firebase Configuration:**
    -   `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase project API Key.
    -   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase project Auth Domain.
    -   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID.
    -   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase project Storage Bucket.
    -   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase project Messaging Sender ID.
    -   `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase project App ID.
    -   `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: Your Firebase project Realtime Database URL (though Firestore is primarily used for submissions).

-   **Admin Configuration:**
    -   `NEXT_PUBLIC_ADMIN_PASSWORD`: Password for accessing the admin panel. (Default: `adminpassword` if not set)
    -   `ADMIN_EMAIL`: The email address where admin notifications for new submissions will be sent.

-   **Email (Nodemailer) Configuration:**
    -   `SMTP_HOST`: SMTP server host (e.g., `smtp.gmail.com`).
    -   `SMTP_PORT`: SMTP server port (e.g., `465` for SSL, `587` for TLS).
    -   `SMTP_USER`: SMTP username (e.g., your Gmail address).
    -   `SMTP_PASS`: SMTP password (e.g., your Gmail App Password).
    -   `EMAIL_FROM`: Sender email address for outgoing emails (e.g., `"Project Gateway <your.email@gmail.com>"`).
    -   `SMTP_SECURE`: Use `true` for SSL (port 465), `false` for TLS (port 587).

-   **Application URL:**
    -   `NEXT_PUBLIC_APP_URL`: The base URL of your deployed application (e.g., `http://localhost:9002` for development, or your production domain). This is used for generating links in emails.

## Getting Started

### Prerequisites

-   Node.js (v18.x or later recommended)
-   npm or yarn
-   A Firebase project.
-   A Gmail account (if using Gmail for email sending) with 2-Step Verification and an App Password.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd project-gateway
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Firebase Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2.  In your project, navigate to **Build > Firestore Database** and create a database. Choose your location and start in **production mode** (you'll configure security rules later).
3.  Go to **Project settings** (the gear icon next to "Project Overview").
4.  Under the "General" tab, scroll down to "Your apps".
5.  Click on the Web icon (`</>`) to add a new web app.
6.  Register the app (give it a nickname). Firebase Hosting setup is optional for now.
7.  After registering, Firebase will provide you with a configuration object. Copy these credentials (`apiKey`, `authDomain`, etc.).

### Environment Configuration

1.  Create a `.env.local` file in the root of your project.
2.  Copy the contents from `.env.example` into `.env.local`.
3.  Fill in the Firebase credentials you obtained in the "Firebase Setup" step.
4.  Set `NEXT_PUBLIC_ADMIN_PASSWORD` for the admin panel.
5.  Configure the SMTP settings for Nodemailer (see [Email Configuration](#email-configuration-nodemailer-with-gmail) below).
6.  Set `ADMIN_EMAIL` to the email address that should receive notifications about new submissions.
7.  Set `NEXT_PUBLIC_APP_URL` to your local development URL (e.g., `http://localhost:9002`) or your production URL when deployed.

### Firestore Security Rules

You need to set up security rules for your Firestore database to control access to the `submissions` collection.

1.  In the Firebase Console, go to **Build > Firestore Database > Rules**.
2.  Replace the default rules with something like the following:

    ```
    rules_version = '2';

    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow public creation of submissions
        match /submissions/{submissionId} {
          allow create: if true;
          // Allow admin (authenticated user - in this app, implies knowing the admin password
          // which isn't directly tied to Firebase Auth but conceptually it's admin access)
          // For a more robust solution, integrate Firebase Authentication for admins.
          // For this project's current setup, server-side actions gatekeep these.
          // However, direct client-side SDK access needs rules.
          // As server actions handle reads/updates/deletes, we can restrict client SDK access:
          allow read, update, delete: if false; // Or, if using client SDK for admin: request.auth != null;

          // If your admin panel directly uses Firebase SDK with auth, the rule would be:
          // allow read, update, delete: if request.auth != null && request.auth.token.admin == true; // (Requires custom claims)
        }
      }
    }
    ```

    **Important:** The rules above are a starting point.
    - `allow create: if true;` allows anyone to submit the form.
    - `allow read, update, delete: if false;` (if using server actions exclusively for these) prevents direct client-side modification/reading of all submissions. Server actions use admin credentials and are more secure.
    - If you plan to build admin features that directly interact with Firestore from the client-side using the Firebase SDK (not through server actions), you would need more permissive rules combined with Firebase Authentication for admins (e.g., `request.auth != null`). This project currently uses server actions for admin operations.

3.  Publish your rules.

### Running the Development Server

```bash
npm run dev
```
The application will be available at `http://localhost:9002` (or the port specified in your `package.json` scripts).

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
project-gateway/
├── .vscode/                    # VSCode settings
├── components/                 # Reusable React components
│   ├── admin/                  # Components specific to the admin panel
│   ├── landing/                # Components specific to the landing page
│   ├── layout/                 # Layout components (header, footer)
│   └── ui/                     # ShadCN UI components
├── public/                     # Static assets (images, etc.)
├── src/
│   ├── ai/                     # Genkit AI related files (if used)
│   ├── app/                    # Next.js App Router (pages, layouts, server actions)
│   │   ├── (main)/             # Routes for the public-facing site (e.g., page.tsx for homepage)
│   │   ├── admin/              # Routes for the admin panel
│   │   │   ├── signin/         # Admin sign-in page
│   │   │   ├── layout.tsx      # Layout for the admin section
│   │   │   └── page.tsx        # Admin dashboard page
│   │   ├── actions.ts          # Server Actions
│   │   ├── globals.css         # Global styles and Tailwind CSS theme
│   │   └── layout.tsx          # Root layout for the application
│   ├── contexts/               # React Context providers (e.g., AuthContext.tsx)
│   ├── hooks/                  # Custom React hooks (e.g., useToast.ts, use-mobile.tsx)
│   ├── lib/                    # Utility functions, schemas, configurations
│   │   ├── email/              # Nodemailer configuration and email templates
│   │   ├── firebase/           # Firebase configuration (config.ts)
│   │   ├── schemas.ts          # Zod schemas for form validation
│   │   └── utils.ts            # General utility functions (e.g., cn for classnames)
│   └── types/                  # TypeScript type definitions (index.ts)
├── .env.local                  # Local environment variables (Gitignored)
├── .env.example                # Example environment variables
├── components.json             # ShadCN UI configuration
├── next.config.ts              # Next.js configuration
├── package.json                # Project dependencies and scripts
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Admin Panel

-   **Access:** Navigate to `/admin` on your application's URL.
-   **Sign-in:** If not authenticated, you'll be redirected to `/admin/signin`. Enter the password defined in `NEXT_PUBLIC_ADMIN_PASSWORD`.
-   **Functionality:** View, search, sort, and manage project submissions. Perform actions like accepting, rejecting, or deleting projects.

## Email Configuration (Nodemailer with Gmail)

This project uses Nodemailer to send emails. For using a Gmail account:

1.  **Enable 2-Step Verification:** Go to your Google Account settings and enable 2-Step Verification if it's not already enabled.
2.  **Generate an App Password:**
    -   In your Google Account, go to **Security**.
    -   Under "How you sign in to Google," click on **2-Step Verification** (you might need to sign in again).
    -   Scroll down to the bottom and click on **App passwords**.
    -   Select "Mail" for the app and "Other (Custom name)" for the device. Give it a name (e.g., "Project Gateway Nodemailer").
    -   Click "Generate". Google will provide you with a 16-character App Password.
3.  **Configure `.env.local`:**
    -   `SMTP_HOST="smtp.gmail.com"`
    -   `SMTP_PORT="465"` (for SSL) or `"587"` (for TLS)
    -   `SMTP_USER="your.email@gmail.com"` (your full Gmail address)
    -   `SMTP_PASS="your_generated_app_password"` (the 16-character password from step 2)
    -   `EMAIL_FROM="Your App Name <your.email@gmail.com>"` (the sender name and email)
    -   `SMTP_SECURE="true"` (if using port 465) or `"false"` (if using port 587)
    -   `ADMIN_EMAIL="admin_notify_email@example.com"` (where admin gets new submission notifications)

**Note:** If you have issues, ensure your Gmail account allows "Less secure app access" (though App Passwords are the preferred and more secure method).

## Deployment

This Next.js application can be deployed to any platform that supports Node.js applications, such as:

-   **Vercel:** (Recommended for Next.js) Connect your Git repository for automatic deployments.
-   **Netlify:** Similar to Vercel, offers Git-based deployments.
-   **AWS Amplify, Google Cloud Run, Azure App Service:** Other cloud platform options.

**Before deploying:**
-   Ensure all necessary environment variables are set on your deployment platform.
-   Verify your Firestore security rules are configured for production.
-   Update `NEXT_PUBLIC_APP_URL` to your production domain.

---

This README provides a comprehensive guide to understanding, setting up, and running the Project Gateway application.
