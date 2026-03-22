const admin = require('firebase-admin');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Priority:
// 1. FIREBASE_SERVICE_ACCOUNT (JSON string in env)
// 2. GOOGLE_APPLICATION_CREDENTIALS (file path in env, handled by applicationDefault)
// 3. Application Default Credentials (cloud environment or gcloud auth)

let serviceAccount;
try {
    // 1. Try env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // 2. Try local file
    else {
        const serviceAccountPath = path.join(__dirname, '../service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            console.log("Loaded service account from file:", serviceAccountPath);
        }
    }
} catch (error) {
    console.warn("Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable or load service-account.json:", error.message);
}

// Project ID fallback
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'traavo-c017e';

if (!admin.apps.length) {
    try {
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: projectId
            });
            console.log("Firebase Admin initialized with Service Account from env.");
        } else {
            // Fallback to Application Default Credentials
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: projectId
            });
            console.log("Firebase Admin initialized with Application Default Credentials.");
        }
    } catch (error) {
        console.error("Firebase Admin Initialization Check:", error.message);
        // Not throwing error to allow server to start, but auth features will fail if not configured.
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };