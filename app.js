import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  query,
  limitToLast,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "prvlvechat.firebaseapp.com",
  databaseURL: "https://prvlvechat-default-rtdb.firebaseio.com/",
  projectId: "prvlvechat",
  storageBucket: "prvlvechat.firebasestorage.app",
  messagingSenderId: "514369516253",
  appId: "1:514369516253:web:8f78900c6c2017b4ec2134"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -------- Helpers --------

function askRequiredValue(message, defaultValue = "") {
  let value = "";
  while (!value) {
    const answer = window.prompt(message, defaultValue) || "";
    value = answer.trim();
  }
  return value;
}

function normalizeRoomCode(rawCode) {
  return rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// -------- Room Setup --------

const currentUser = askRequiredValue("Enter your name to join the chat:");

const modeRaw = window.prompt(
  "Type J to join with a code, or C to create a new chat code:",
  "J"
);

const mode = (modeRaw || "J").trim().toUpperCase();

let roomCode = "";

if (mode === "C") {
  roomCode = createRoomCode();
  window.alert(`Your new chat code is: ${roomCode}\nShare this code with others.`);
} else {
  roomCode = normalizeRoomCode(
    askRequiredValue("Enter the chat code you want to join:")
  );
}

if (!roomCode) {
  roomCode = createRoomCode();
  window.alert(`Invalid code. You were placed in new chat code: ${roomCode}`);
}

// -------- DOM Elements --------

const welcomeText = document.getElementById("welcomeText");
const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("messageForm");
const inputEl = document.getElementById("messageInput");

welcomeText.textContent = `Signed in as ${currentUser} • Room code: ${roomCode}`;

// -------- Database Reference --------

const messagesRef = ref(db, `rooms/${roomCode}/messages`);

// -------- Render Message --------

function renderMessage(messageData = {}) {
  const item = document.createElement("article");
  item.className = "message-item";

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const name = document.createElement("strong");
  name.textContent = messageData.name || "Unknown";

  const time = document.createElement("span");
  const millis = Number(messageData.timestamp);
  const date = Number.isFinite(millis) ? new Date(millis) : new Date();
  time.textContent = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  meta.append(name, time);

  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = messageData.text || "";

  item.append(meta, text);
  messagesEl.appendChild(item);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// -------- Real-Time Listener --------

onChildAdded(query(messagesRef, limitToLast(100))), (snapshot) => {
  renderMessage(snapshot.val());
};

// -------- Send Message --------

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = inputEl.value.trim();
  if (!text) return;

  await push(messagesRef, {
    name: currentUser,
    text,
    roomCode,
    timestamp: serverTimestamp()
  });

  inputEl.value = "";
  inputEl.focus();
});
