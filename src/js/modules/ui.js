const EMOJIS = ["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??"];

export const el = {
  authScreen: document.getElementById("authScreen"),
  chatScreen: document.getElementById("chatScreen"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  authError: document.getElementById("authError"),
  meName: document.getElementById("meName"),
  logoutBtn: document.getElementById("logoutBtn"),
  conversationList: document.getElementById("conversationList"),
  messageList: document.getElementById("messageList"),
  chatTitle: document.getElementById("chatTitle"),
  composerForm: document.getElementById("composerForm"),
  messageInput: document.getElementById("messageInput"),
  fileInput: document.getElementById("fileInput"),
  attachmentPreview: document.getElementById("attachmentPreview"),
  emojiToggle: document.getElementById("emojiToggle"),
  emojiPanel: document.getElementById("emojiPanel"),
  newChatBtn: document.getElementById("newChatBtn"),
  newGroupBtn: document.getElementById("newGroupBtn"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  groupNameInput: document.getElementById("groupNameInput"),
  userPickerList: document.getElementById("userPickerList"),
  modalCancel: document.getElementById("modalCancel"),
  modalConfirm: document.getElementById("modalConfirm")
};

export function showAuth() {
  el.authScreen.classList.remove("hidden");
  el.chatScreen.classList.add("hidden");
}

export function showChat(user) {
  el.authScreen.classList.add("hidden");
  el.chatScreen.classList.remove("hidden");
  el.meName.textContent = user.displayName;
}

export function setAuthMode(isLogin) {
  el.loginTab.classList.toggle("active", isLogin);
  el.registerTab.classList.toggle("active", !isLogin);
  el.loginForm.classList.toggle("hidden", !isLogin);
  el.registerForm.classList.toggle("hidden", isLogin);
  el.authError.textContent = "";
}

export function renderConversations(conversations, activeId, currentUserId, onClick) {
  el.conversationList.innerHTML = "";

  conversations.forEach((item) => {
    const li = document.createElement("li");
    if (item.id === activeId) li.classList.add("active");

    const name = document.createElement("div");
    name.className = "name";

    let title = item.name || "Conversation";
    if (!item.isGroup && item.memberProfiles) {
      const other = Object.values(item.memberProfiles).find((p) => p.uid !== currentUserId);
      if (other?.displayName) title = other.displayName;
    }

    name.textContent = item.isGroup ? `# ${title}` : title;

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.textContent = item.lastMessage || "No messages yet";

    li.appendChild(name);
    li.appendChild(preview);
    li.onclick = () => onClick(item);
    el.conversationList.appendChild(li);
  });
}

function tsToLocale(value) {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function renderMessages(messages, currentUserId) {
  el.messageList.innerHTML = "";

  messages.forEach((message) => {
    const row = document.createElement("div");
    row.className = `message ${message.senderId === currentUserId ? "mine" : ""}`;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${message.senderName || "User"} • ${tsToLocale(message.createdAt)}`;
    row.appendChild(meta);

    if (message.text) {
      const txt = document.createElement("div");
      txt.textContent = message.text;
      row.appendChild(txt);
    }

    if (message.fileUrl) {
      const img = document.createElement("img");
      img.src = message.fileUrl;
      img.alt = message.fileName || "Attachment";
      row.appendChild(img);
    }

    el.messageList.appendChild(row);
  });

  el.messageList.scrollTop = el.messageList.scrollHeight;
}

export function renderEmojiPanel(onPick) {
  el.emojiPanel.innerHTML = "";
  EMOJIS.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "emoji-chip";
    btn.textContent = emoji;
    btn.onclick = () => onPick(emoji);
    el.emojiPanel.appendChild(btn);
  });
}

export function setChatTitle(title) {
  el.chatTitle.textContent = title || "Select a conversation";
}

export function showAttachment(file) {
  if (!file) {
    el.attachmentPreview.classList.add("hidden");
    el.attachmentPreview.textContent = "";
    return;
  }

  el.attachmentPreview.classList.remove("hidden");
  el.attachmentPreview.textContent = `Attachment ready: ${file.name}`;
}

export function openModal() {
  el.modal.classList.remove("hidden");
}

export function closeModal() {
  el.modal.classList.add("hidden");
}

export function renderUserPicker(users) {
  el.userPickerList.innerHTML = "";

  users.forEach((user) => {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = user.uid;

    const label = document.createElement("label");
    label.textContent = `${user.displayName} (${user.email})`;

    li.appendChild(checkbox);
    li.appendChild(label);
    el.userPickerList.appendChild(li);
  });
}

export function selectedUserIdsFromPicker() {
  return Array.from(el.userPickerList.querySelectorAll("input:checked")).map((n) => n.value);
}
