// Import Firebase SDK modules directly from the official CDN.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
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
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// 2) Prompt for the user's display name as soon as they open the page.
let currentUser = window.prompt('Enter your name to join the chat:') || '';
currentUser = currentUser.trim();
if (!currentUser) {
  currentUser = `Guest-${Math.floor(Math.random() * 10000)}`;
}

const welcomeText = document.getElementById('welcomeText');
const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('messageForm');
const inputEl = document.getElementById('messageInput');
welcomeText.textContent = `Signed in as ${currentUser}`;

// 3) Initialize Firebase and point to the "messages" collection in Realtime Database.
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, 'messages');

// 4) Helper to render each message in the scrollable message list.
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

// 5) Listen for new messages in real time.
// limitToLast(100) keeps the UI lightweight on free hosting.
onChildAdded(query(messagesRef, limitToLast(100)), (snapshot) => {
  renderMessage(snapshot.val());
});

// 6) Send a new message to Realtime Database on form submit.
formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = inputEl.value.trim();
  if (!text) {
    return;
  }

  await push(messagesRef, {
    name: currentUser,
    text,
    // Using serverTimestamp ensures consistent ordering across users/time zones.
    timestamp: serverTimestamp(),
  });

  inputEl.value = '';
  inputEl.focus();
});
