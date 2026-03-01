import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db } from "./firebase.js";

function toSafeUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split("@")[0] || "User"
  };
}

export function listenAuthState(cb) {
  return onAuthStateChanged(auth, (user) => cb(user ? toSafeUser(user) : null));
}

export async function register({ email, password, displayName }) {
  const creds = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(creds.user, { displayName });
  await setDoc(
    doc(db, "users", creds.user.uid),
    {
      uid: creds.user.uid,
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  return toSafeUser({ ...creds.user, displayName });
}

export async function login({ email, password }) {
  const creds = await signInWithEmailAndPassword(auth, email, password);
  await setDoc(
    doc(db, "users", creds.user.uid),
    {
      uid: creds.user.uid,
      email: creds.user.email,
      displayName: creds.user.displayName || creds.user.email?.split("@")[0] || "User",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  return toSafeUser(creds.user);
}

export async function logout() {
  await signOut(auth);
}
