# chat_application

Instagram-style chat app designed to be hosted on **GitHub Pages** using a static frontend and Firebase backend.

## Features

- Email/password authentication
- Direct messages and group chats
- Realtime chat updates
- GIF/image attachments
- Emoji picker
- Responsive clean UI
- Modular folder architecture

## Architecture

- Hosting: GitHub Pages (static files)
- Auth: Firebase Authentication
- Database: Cloud Firestore
- Attachments: Firebase Storage

## Folder structure

```txt
chat_application/
  index.html
  src/
    css/
      styles.css
    js/
      app.js
      modules/
        firebase-config.js
        firebase.js
        auth.js
        store.js
        ui.js
```

## Setup Firebase

1. Create a Firebase project.
2. Enable Authentication -> Email/Password.
3. Create Firestore database (production/test mode as needed).
4. Create Storage bucket.
5. Replace values in `src/js/modules/firebase-config.js`.

## Recommended Firestore rules (starter)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.members;

      match /messages/{messageId} {
        allow read, create: if request.auth != null && request.auth.uid in
          get(/databases/$(database)/documents/conversations/$(conversationId)).data.members;
      }
    }
  }
}
```

## Recommended Storage rules (starter)

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chatFiles/{conversationId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Deploy to GitHub Pages as new repo `chat_application`

From parent directory:

```bash
git init chat_application
git -C chat_application add .
git -C chat_application commit -m "Initial Instagram-style chat app"
git -C chat_application branch -M main
git -C chat_application remote add origin https://github.com/<your-username>/chat_application.git
git -C chat_application push -u origin main
```

Then in GitHub repo settings:
- Pages -> Source: Deploy from branch
- Branch: `main`
- Folder: `/ (root)`

Your app URL will be:
`https://<your-username>.github.io/chat_application/`

## Local quick test

Open `chat_application/index.html` with a static server:

```bash
npx serve chat_application
```

(or any static server)
