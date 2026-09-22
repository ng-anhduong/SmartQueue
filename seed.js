import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID"),
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const branches = [
  "woodlands", 
  "ang_mo_kio", 
  "bukit_timah", 
  "toa_payoh", 
  "thomson",
  "choa_chu_kang",
  "holland_village"
];

// Avg service times derived from your seed script's random ranges:
// General: calledAt + 3-11 min → avg ~7 min
// Account: slightly longer → avg ~10 min
// Loan: longest → avg ~15 min
const serviceStats = [
  { serviceType: "General", avgServiceTime: 7 },
  { serviceType: "Account", avgServiceTime: 10 },
  { serviceType: "Loan", avgServiceTime: 15 },
];

async function seedServiceStats() {
  for (const branch of branches) {
    for (const { serviceType, avgServiceTime } of serviceStats) {
      const docId = `${branch}_${serviceType}`;
      await setDoc(doc(db, "serviceStats", docId), {
        branchId: branch,
        serviceType,
        avgServiceTime,
        totalServiceMinutes: avgServiceTime * 60, // placeholder: 60 samples worth
        serviceSampleCount: 60,
      });
      console.log(`Seeded serviceStats/${docId}`);
    }
  }

  console.log("Done! 21 serviceStats documents written.");
  process.exit(0);
}

seedServiceStats().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
