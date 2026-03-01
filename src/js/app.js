import { listenAuthState, login, logout, register } from "./modules/auth.js";
import {
  createGroupConversation,
  createOrGetDirectConversation,
  listUsers,
  listenConversations,
  listenMessages,
  sendMessage
} from "./modules/store.js";
import {
  closeModal,
  el,
  openModal,
  renderConversations,
  renderEmojiPanel,
  renderMessages,
  renderUserPicker,
  selectedUserIdsFromPicker,
  setAuthMode,
  setChatTitle,
  showAttachment,
  showAuth,
  showChat
} from "./modules/ui.js";

const state = {
  me: null,
  users: [],
  conversations: [],
  activeConversation: null,
  unsubConversations: null,
  unsubMessages: null
};

function getConversationTitle(conversation) {
  if (!conversation) return "Select a conversation";
  if (conversation.isGroup) return `# ${conversation.name || "Group"}`;
  const other = Object.values(conversation.memberProfiles || {}).find((p) => p.uid !== state.me.uid);
  return other?.displayName || "Direct message";
}

async function refreshUsers() {
  state.users = await listUsers(state.me.uid);
}

function resetChatSubscriptions() {
  if (state.unsubMessages) {
    state.unsubMessages();
    state.unsubMessages = null;
  }
  if (state.unsubConversations) {
    state.unsubConversations();
    state.unsubConversations = null;
  }
}

function openConversation(conversation) {
  state.activeConversation = conversation;
  setChatTitle(getConversationTitle(conversation));

  if (state.unsubMessages) state.unsubMessages();
  state.unsubMessages = listenMessages(conversation.id, (messages) => {
    renderMessages(messages, state.me.uid);
  });

  renderConversations(state.conversations, conversation.id, state.me.uid, openConversation);
}

function startConversationListener() {
  if (state.unsubConversations) state.unsubConversations();

  state.unsubConversations = listenConversations(state.me.uid, (conversations) => {
    state.conversations = conversations;
    const activeId = state.activeConversation?.id || null;

    renderConversations(state.conversations, activeId, state.me.uid, openConversation);

    if (!state.activeConversation && state.conversations.length > 0) {
      openConversation(state.conversations[0]);
      return;
    }

    if (activeId) {
      const refreshed = state.conversations.find((c) => c.id === activeId);
      if (refreshed) {
        state.activeConversation = refreshed;
        setChatTitle(getConversationTitle(refreshed));
      }
    }
  });
}

async function handleNewChat() {
  await refreshUsers();
  if (state.users.length === 0) {
    window.alert("No other users found. Ask a friend to register first.");
    return;
  }

  const choices = state.users.map((u, idx) => `${idx + 1}. ${u.displayName} (${u.email})`).join("\n");
  const input = window.prompt(`Start chat with:\n${choices}\n\nType number:`);
  const index = Number(input) - 1;

  if (Number.isNaN(index) || index < 0 || index >= state.users.length) return;

  const target = state.users[index];
  const conversationId = await createOrGetDirectConversation(state.me, target);
  const conversation = state.conversations.find((c) => c.id === conversationId);

  if (conversation) openConversation(conversation);
}

async function handleGroupCreate() {
  await refreshUsers();
  renderUserPicker(state.users);
  el.groupNameInput.value = "";
  openModal();
}

async function initChatSession(user) {
  state.me = user;
  showChat(user);
  await refreshUsers();
  startConversationListener();
}

function bindAuth() {
  setAuthMode(true);

  el.loginTab.onclick = () => setAuthMode(true);
  el.registerTab.onclick = () => setAuthMode(false);

  el.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.authError.textContent = "";

    try {
      await login({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value
      });
    } catch (error) {
      el.authError.textContent = error.message;
    }
  });

  el.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    el.authError.textContent = "";

    try {
      await register({
        displayName: document.getElementById("registerName").value.trim(),
        email: document.getElementById("registerEmail").value.trim(),
        password: document.getElementById("registerPassword").value
      });
    } catch (error) {
      el.authError.textContent = error.message;
    }
  });
}

function bindComposer() {
  el.fileInput.addEventListener("change", () => {
    showAttachment(el.fileInput.files[0] || null);
  });

  el.emojiToggle.onclick = () => {
    el.emojiPanel.classList.toggle("hidden");
  };

  renderEmojiPanel((emoji) => {
    el.messageInput.value += emoji;
    el.messageInput.focus();
  });

  el.composerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!state.activeConversation) return;

    const text = el.messageInput.value.trim();
    const file = el.fileInput.files[0] || null;

    if (!text && !file) return;

    try {
      await sendMessage({
        conversationId: state.activeConversation.id,
        user: state.me,
        text,
        file
      });

      el.messageInput.value = "";
      el.fileInput.value = "";
      showAttachment(null);
      el.emojiPanel.classList.add("hidden");
    } catch (error) {
      window.alert(error.message);
    }
  });
}

function bindModalsAndActions() {
  el.logoutBtn.onclick = async () => {
    await logout();
  };

  el.newChatBtn.onclick = handleNewChat;
  el.newGroupBtn.onclick = handleGroupCreate;

  el.modalCancel.onclick = closeModal;

  el.modalConfirm.onclick = async () => {
    const groupName = el.groupNameInput.value.trim();
    const ids = selectedUserIdsFromPicker();
    if (!groupName) {
      window.alert("Group name is required.");
      return;
    }
    if (ids.length < 1) {
      window.alert("Select at least one member.");
      return;
    }

    const selectedUsers = state.users.filter((u) => ids.includes(u.uid));
    const id = await createGroupConversation(state.me, groupName, selectedUsers);
    closeModal();

    const found = state.conversations.find((c) => c.id === id);
    if (found) openConversation(found);
  };
}

function bootstrap() {
  bindAuth();
  bindComposer();
  bindModalsAndActions();

  listenAuthState(async (user) => {
    if (!user) {
      resetChatSubscriptions();
      state.me = null;
      state.users = [];
      state.conversations = [];
      state.activeConversation = null;
      showAuth();
      setChatTitle("Select a conversation");
      renderMessages([], "");
      renderConversations([], null, "", () => {});
      return;
    }

    await initChatSession(user);
  });
}

bootstrap();
