import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfigFallback from '../firebase-applet-config.json' assert { type: 'json' };

const firebaseConfig = {
  apiKey: firebaseConfigFallback.apiKey,
  authDomain: firebaseConfigFallback.authDomain,
  projectId: firebaseConfigFallback.projectId,
  storageBucket: firebaseConfigFallback.storageBucket,
  messagingSenderId: firebaseConfigFallback.messagingSenderId,
  appId: firebaseConfigFallback.appId,
};

const app = initializeApp(firebaseConfig);
const dbId = "ai-studio-c4007c60-6fcb-4c15-85f2-4e79dde9a2fa";

async function run() {
  console.log("Testing default database...");
  try {
    const dbDefault = getFirestore(app);
    const snapDefault = await getDocs(collection(dbDefault, 'public_cases'));
    console.log("Default DB Success! Found", snapDefault.size, "documents");
  } catch (err: any) {
    console.error("Default DB Error:", err.message);
  }

  console.log("\nTesting custom database:", dbId);
  try {
    const dbCustom = getFirestore(app, dbId);
    const snapCustom = await getDocs(collection(dbCustom, 'public_cases'));
    console.log("Custom DB Success! Found", snapCustom.size, "documents");
    snapCustom.forEach(doc => {
      console.log(" - Document ID:", doc.id, "Title:", doc.data().title);
    });
  } catch (err: any) {
    console.error("Custom DB Error:", err.message);
  }
}

run();
