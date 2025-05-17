import admin from 'firebase-admin';
import serviceAccount from '../config/firebase.json' assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestoreDb = admin.firestore();
export { firestoreDb };