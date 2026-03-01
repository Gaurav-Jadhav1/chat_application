import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { db, storage } from "./firebase.js";

function formatConversationSnapshot(snapshot) {
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

function formatMessageSnapshot(snapshot) {
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function listUsers(excludeUid) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("displayName"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data())
    .filter((u) => u.uid !== excludeUid);
}

export function listenConversations(uid, cb) {
  const q = query(
    collection(db, "conversations"),
    where("members", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snapshot) => cb(formatConversationSnapshot(snapshot)));
}

export function listenMessages(conversationId, cb) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => cb(formatMessageSnapshot(snapshot)));
}

export async function createOrGetDirectConversation(currentUser, targetUser) {
  const sorted = [currentUser.uid, targetUser.uid].sort();
  const id = `dm_${sorted[0]}_${sorted[1]}`;
  const refDoc = doc(db, "conversations", id);
  const found = await getDoc(refDoc);

  if (!found.exists()) {
    await setDoc(refDoc, {
      id,
      isGroup: false,
      name: targetUser.displayName,
      members: sorted,
      memberProfiles: {
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email
        },
        [targetUser.uid]: {
          uid: targetUser.uid,
          displayName: targetUser.displayName,
          email: targetUser.email
        }
      },
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: ""
    });
  }

  return id;
}

export async function createGroupConversation(currentUser, groupName, selectedUsers) {
  const members = [currentUser, ...selectedUsers];
  const memberIds = Array.from(new Set(members.map((m) => m.uid)));
  const memberProfiles = {};

  members.forEach((m) => {
    memberProfiles[m.uid] = {
      uid: m.uid,
      displayName: m.displayName,
      email: m.email
    };
  });

  const newDoc = await addDoc(collection(db, "conversations"), {
    isGroup: true,
    name: groupName,
    members: memberIds,
    memberProfiles,
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: ""
  });

  return newDoc.id;
}

export async function sendMessage({ conversationId, user, text, file }) {
  let fileUrl = "";
  let fileName = "";
  let messageType = "text";

  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `chatFiles/${conversationId}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
    fileName = file.name;
    messageType = "image";
  }

  const payload = {
    text: text || "",
    type: messageType,
    senderId: user.uid,
    senderName: user.displayName,
    senderEmail: user.email,
    fileUrl,
    fileName,
    createdAt: serverTimestamp()
  };

  await addDoc(collection(db, "conversations", conversationId, "messages"), payload);
  await updateDoc(doc(db, "conversations", conversationId), {
    updatedAt: serverTimestamp(),
    lastMessage: file ? `${user.displayName} sent an image/GIF` : `${user.displayName}: ${text}`,
    members: arrayUnion(user.uid)
  });
}
