import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDv0D4PmCm2xztSIPWV3t_uuoExUXwH6LU",
  authDomain: "devhubs-project.firebaseapp.com",
  projectId: "devhubs-project",
  storageBucket: "devhubs-project.firebasestorage.app",
  messagingSenderId: "659320333811",
  appId: "1:659320333811:web:32bf805c2ef8d1ac701e86",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();

export { auth, githubProvider, signInWithPopup };