// Import Firebase SDK modules directly from the official CDN.
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
  getDatabase,
  push,
  ref,
  serverTimestamp,
  onChildAdded,
  query,
  limitToLast,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

// 1) Firebase project configuration.
// Replace these values with keys from your Firebase project's Web App settings.
const firebaseConfig = {
  apiKey: "AIzaSyAc2vndvSvkZlt-VcBxFw8Ptj8CMH2gZT0",
  authDomain: "prvlvechat.firebaseapp.com",
  projectId: "prvlvechat",
  storageBucket: "prvlvechat.firebasestorage.app",
  messagingSenderId: "514369516253",
  appId: "1:514369516253:web:8f78900c6c2017b4ec2134",
  measurementId: "G-40RVF0GCK4"
};

// 2) Small helpers for collecting required inputs.
function askRequiredValue(message, defaultValue = '') {
  let value = '';

  while (!value) {
    const answer = window.prompt(message, defaultValue) || '';
    value = answer.trim();
  }

  return value;
}

function normalizeRoomCode(rawCode) {
  return rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function createRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

// 3) Ask for name + require chat code workflow (join existing or create new).
const currentUser = askRequiredValue('Enter your name to join the chat:');

const modeRaw = window.prompt(
  'Type J to join with a code, or C to create a new chat code:',
  'J',
);
const mode = (modeRaw || 'J').trim().toUpperCase();

let roomCode = '';
if (mode === 'C') {
  roomCode = createRoomCode();
  window.alert(`Your new chat code is: ${roomCode}\nShare this code with others to join.`);
} else {
  roomCode = normalizeRoomCode(
    askRequiredValue('Enter the chat code you want to join:'),
  );
}

if (!roomCode) {
  roomCode = createRoomCode();
  window.alert(`Invalid code entered. You were placed in new chat code: ${roomCode}`);
}

const welcomeText = document.getElementById('welcomeText');
const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('messageForm');
const inputEl = document.getElementById('messageInput');
welcomeText.textContent = `Signed in as ${currentUser} • Room code: ${roomCode}`;

// 4) Initialize Firebase and point to room-specific messages in Realtime Database.
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, `rooms/${roomCode}/messages`);

// 5) Helper to render each message in the scrollable message list.
function renderMessage(messageData = {}) {
  const item = document.createElement('article');
  item.className = 'message-item';

  const meta = document.createElement('div');
  meta.className = 'message-meta';

  const name = document.createElement('strong');
  name.textContent = messageData.name || 'Unknown';

  const time = document.createElement('span');
  const millis = Number(messageData.timestamp);
  const date = Number.isFinite(millis) ? new Date(millis) : new Date();
  time.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  meta.append(name, time);

  const text = document.createElement('p');
  text.className = 'message-text';
  text.textContent = messageData.text || '';

  item.append(meta, text);
  messagesEl.appendChild(item);

  // Auto-scroll to newest message for real-time chat behavior.
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// 6) Listen for new messages in real time for this room only.
// limitToLast(100) keeps the UI lightweight on free hosting.
onChildAdded(query(messagesRef, limitToLast(100)), (snapshot) => {
  renderMessage(snapshot.val());
});

// 7) Send a new message to this room on form submit.
formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = inputEl.value.trim();
  if (!text) {
    return;
  }

  await push(messagesRef, {
    name: currentUser,
    text,
    roomCode,
    // Using serverTimestamp ensures consistent ordering across users/time zones.
    timestamp: serverTimestamp(),
  });

  inputEl.value = '';
  inputEl.focus();
});
