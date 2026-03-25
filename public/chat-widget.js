(() => {
  const CHAT_API_URL = 'https://bluewud-chatbot.vercel.app/api/message';
  const ORDER_API_URL = 'https://bluewud-chatbot.vercel.app/api/orders';
  const SUPPORT_PHONE = '+918800609609';
  const SUPPORT_EMAIL = 'care@bluewud.com';
  const LOCAL_STORAGE_KEY = 'bluewud_user_data';
  const BRAND_LOGO_URL =
    'https://www.bluewud.com/cdn/shop/files/Bluewud_Logo_final_2_130x_2x_f579854f-34cb-4a02-b2f1-9b2ecb734e51_1204x630.png?v=1637601553';

  const zohoHideStyle = document.createElement('style');
  zohoHideStyle.id = 'bluewud-zoho-hide';
  zohoHideStyle.textContent = `
    .zsiq_float,
    #zsiq_float,
    .zsiq-new-theme,
    .zls-sptwndw,
    [id^="zsiq"],
    [class*="zsiq"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(zohoHideStyle);

  const widgetStyle = document.createElement('style');
  widgetStyle.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @keyframes bluewud-slide-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes bluewud-pulse {
      0% { box-shadow: 0 0 0 0 rgba(15, 76, 129, 0.35); }
      70% { box-shadow: 0 0 0 12px rgba(15, 76, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(15, 76, 129, 0); }
    }

    #bluewud-chat-btn {
      position: fixed;
      right: 28px;
      bottom: 28px;
      z-index: 2147483647;
      width: 64px;
      height: 64px;
      border: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      background: linear-gradient(135deg, #0f4c81, #0a2f4f);
      box-shadow: 0 12px 30px rgba(10, 47, 79, 0.28);
      animation: bluewud-pulse 2s infinite;
    }

    #bluewud-chat-modal {
      position: fixed;
      right: 28px;
      bottom: 106px;
      z-index: 2147483647;
      width: 380px;
      max-width: calc(100vw - 24px);
      height: 650px;
      max-height: 85vh;
      display: none;
      flex-direction: column;
      overflow: hidden;
      border-radius: 24px;
      background: #f7f8fa;
      box-shadow: 0 24px 64px rgba(11, 23, 38, 0.22);
      border: 1px solid rgba(15, 76, 129, 0.08);
      font-family: 'Inter', sans-serif;
      animation: bluewud-slide-in 0.28s ease-out;
    }

    #bluewud-chat-header {
      padding: 24px;
      color: #fff;
      background: linear-gradient(135deg, #0f4c81, #0a2f4f);
    }

    .bluewud-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .bluewud-header-main {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .bluewud-avatar {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.94);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 7px;
      box-sizing: border-box;
      box-shadow: inset 0 0 0 1px rgba(15, 76, 129, 0.08);
    }

    .bluewud-avatar img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      border-radius: 10px;
    }

    .bluewud-title {
      display: block;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .bluewud-subtitle {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      opacity: 0.86;
    }

    #bluewud-chat-close {
      border: 0;
      background: transparent;
      color: #fff;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
    }

    #bluewud-chat-body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #fff;
    }

    .bluewud-msg {
      max-width: 86%;
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.5;
      font-size: 14px;
      animation: bluewud-slide-in 0.2s ease-out;
      box-shadow: 0 2px 8px rgba(17, 24, 39, 0.04);
      white-space: pre-wrap;
    }

    .bluewud-bot {
      align-self: flex-start;
      color: #18222f;
      background: #f1f4f8;
      border-radius: 18px 18px 18px 6px;
    }

    .bluewud-user {
      align-self: flex-end;
      color: #fff;
      background: linear-gradient(135deg, #0f4c81, #145e99);
      border-radius: 18px 18px 6px 18px;
    }

    .bluewud-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 2px;
    }

    .bluewud-chip {
      border: 1px solid #d7e0ea;
      border-radius: 999px;
      background: #fff;
      color: #0f4c81;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .bluewud-chip:hover {
      color: #fff;
      background: #0f4c81;
      border-color: #0f4c81;
      transform: translateY(-1px);
    }

    .bluewud-typing {
      margin-left: 14px;
      color: #8a94a6;
      font-size: 12px;
      font-style: italic;
    }

    #bluewud-chat-input-area {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 16px;
      border-top: 1px solid #eef2f7;
      background: #fff;
    }

    #bluewud-chat-input {
      flex: 1;
      border: 1px solid #d8e0ea;
      border-radius: 999px;
      padding: 12px 18px;
      background: #f7f8fa;
      font: inherit;
      outline: none;
    }

    #bluewud-chat-input:focus {
      background: #fff;
      border-color: #0f4c81;
      box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.12);
    }

    #bluewud-chat-send {
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      background: #0f4c81;
      box-shadow: 0 8px 20px rgba(15, 76, 129, 0.18);
    }

    #bluewud-footer {
      padding: 0 0 10px;
      text-align: center;
      font-size: 10px;
      color: #b2bcc8;
      background: #fff;
    }

    @media (max-width: 640px) {
      #bluewud-chat-btn {
        right: 18px;
        bottom: 18px;
      }

      #bluewud-chat-modal {
        right: 12px;
        left: 12px;
        bottom: 90px;
        width: auto;
        height: 78vh;
      }
    }
  `;
  document.head.appendChild(widgetStyle);

  const chatButton = document.createElement('button');
  chatButton.id = 'bluewud-chat-btn';
  chatButton.innerHTML = `<img src="${BRAND_LOGO_URL}" alt="Bluewud" style="width:38px;height:38px;object-fit:contain;display:block;" />`;
  document.body.appendChild(chatButton);

  const chatModal = document.createElement('div');
  chatModal.id = 'bluewud-chat-modal';
  chatModal.innerHTML = `
    <div id="bluewud-chat-header">
      <div class="bluewud-header-row">
        <div class="bluewud-header-main">
          <div class="bluewud-avatar">
            <img src="${BRAND_LOGO_URL}" alt="Bluewud logo" />
          </div>
          <div>
            <span class="bluewud-title">BlueBot</span>
            <span class="bluewud-subtitle">Product help, policy guidance, and order support</span>
          </div>
        </div>
        <button id="bluewud-chat-close" aria-label="Close chat">x</button>
      </div>
    </div>
    <div id="bluewud-chat-body"></div>
    <div id="bluewud-chat-input-area">
      <input id="bluewud-chat-input" placeholder="Type a message..." autocomplete="off" />
      <button id="bluewud-chat-send" aria-label="Send message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
    <div id="bluewud-footer">Powered by BlueBot</div>
  `;
  document.body.appendChild(chatModal);

  const bodyDiv = document.getElementById('bluewud-chat-body');
  const input = document.getElementById('bluewud-chat-input');
  const sendButton = document.getElementById('bluewud-chat-send');
  const closeButton = document.getElementById('bluewud-chat-close');

  function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `bluewud-msg bluewud-${sender}`;
    bubble.innerHTML = String(text || '').replace(/\n/g, '<br/>');
    bodyDiv.appendChild(bubble);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;
  }

  function appendChips(chips) {
    if (!Array.isArray(chips) || chips.length === 0) return;
    const container = document.createElement('div');
    container.className = 'bluewud-chips-container';
    chips.forEach((chip) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bluewud-chip';
      button.textContent = chip.label;
      button.addEventListener('click', () => sendMessage(chip.query || chip.label));
      container.appendChild(button);
    });
    bodyDiv.appendChild(container);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;
  }

  function safeLocalStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function loadCustomerData() {
    const storage = safeLocalStorage();
    if (!storage) return null;
    return JSON.parse(storage.getItem(LOCAL_STORAGE_KEY) || 'null');
  }

  function saveCustomerData(data) {
    const storage = safeLocalStorage();
    if (!storage) return;
    const current = JSON.parse(storage.getItem(LOCAL_STORAGE_KEY) || '{}');
    storage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ ...current, ...data, lastVisit: new Date().toISOString() })
    );
  }

  function resetInputMode() {
    input.placeholder = 'Type a message...';
    input.dataset.mode = 'chat';
    delete input.dataset.orderId;
  }

  function normalizeContactPayload(value) {
    const text = String(value || '').trim();
    if (!text) return {};
    if (text.includes('@')) {
      return { email: text.toLowerCase() };
    }
    return { phone: text.replace(/\D/g, '') };
  }

  function getContextGreeting() {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('tv-units')) {
      return 'Looking at TV Units? I can help you compare sizes, collections, and the right fit for your room.';
    }
    if (pathname.includes('coffee-tables')) {
      return 'Need help choosing a coffee table? I can guide you through the collection.';
    }
    if (pathname.includes('study-tables')) {
      return 'Shopping for a desk or study table? I can help you browse the right options.';
    }
    if (pathname.includes('shoe-racks')) {
      return 'Need better shoe storage? I can point you to the best shoe rack options.';
    }
    return 'Hi! I can help you browse products, answer policy questions, and track a placed order.';
  }

  function initChat() {
    bodyDiv.innerHTML = '';
    resetInputMode();

    const customer = loadCustomerData();
    const greeting = customer?.lastOrderId
      ? `Welcome back. Do you want to check Order #${customer.lastOrderId} again, or browse products?`
      : getContextGreeting();

    appendMessage(greeting, 'bot');
    appendChips([
      { label: 'Browse TV Units', query: 'Show me TV Units' },
      { label: 'Browse Study Tables', query: 'Show me Study Tables' },
      { label: 'Track Order', query: 'Track my order' },
      { label: 'Warranty Info', query: 'Warranty policy' },
      { label: 'Talk to Support', query: 'Talk to human agent' },
    ]);
  }

  function openWidget() {
    chatModal.style.display = 'flex';
    chatButton.style.display = 'none';
    if (bodyDiv.children.length === 0) {
      initChat();
    }
    input.focus();
  }

  function closeWidget() {
    chatModal.style.display = 'none';
    chatButton.style.display = 'flex';
    resetInputMode();
  }

  function triggerHandoff(originalText = '') {
    appendMessage(
      `You can reach Bluewud support on ${SUPPORT_PHONE} or ${SUPPORT_EMAIL}. Share your question or order issue there and the team will pick it up.`,
      'bot'
    );
    appendChips([
      { label: 'Track Order', query: 'Track my order' },
      { label: 'Browse TV Units', query: 'Show me TV Units' },
    ]);
  }

  function startOrderTracking() {
    appendMessage('Please enter your Order ID to begin tracking.', 'bot');
    input.placeholder = 'Enter Order ID here...';
    input.dataset.mode = 'order_tracking';
    input.focus();
  }

  function promptOrderVerification(orderId) {
    appendMessage(orderId, 'user');
    appendMessage(
      'Please enter the phone number or email used on that order so I can verify the latest status.',
      'bot'
    );
    input.placeholder = 'Enter phone number or email...';
    input.dataset.mode = 'order_tracking_verify';
    input.dataset.orderId = orderId;
    input.focus();
  }

  async function lookupOrderStatus(orderId, contactValue) {
    appendMessage(contactValue, 'user');

    const typing = document.createElement('div');
    typing.className = 'bluewud-typing';
    typing.textContent = 'Checking order status...';
    bodyDiv.appendChild(typing);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;

    try {
      const payload = { orderId, ...normalizeContactPayload(contactValue) };
      const response = await fetch(ORDER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (bodyDiv.contains(typing)) {
        bodyDiv.removeChild(typing);
      }

      if (data.found) {
        saveCustomerData({ lastOrderId: data.orderId });
        appendMessage(
          `<div style="background:#f0f7ff; border:1px solid #c9def2; border-radius:14px; padding:12px;">
            <strong style="color:#0f4c81;">Order #${data.orderId}</strong><br/>
            <div style="margin-top:8px; font-size:16px;">${data.status}</div>
            <div style="margin-top:4px; font-size:12px; color:#64748b;">Last updated: ${data.date}</div>
          </div>`,
          'bot'
        );
        appendChips([
          { label: 'Track another order', query: 'Track my order' },
          { label: 'Talk to Support', query: 'Talk to human agent' },
        ]);
        resetInputMode();
        return;
      }

      appendMessage(
        data.requiresVerification
          ? data.message
          : `I could not confirm that order yet. ${data.message || 'Please check the details and try again.'}`,
        'bot'
      );
      appendChips([
        { label: 'Track again', query: 'Track my order' },
        { label: 'Talk to Support', query: 'Talk to human agent' },
      ]);
      resetInputMode();
    } catch (error) {
      if (bodyDiv.contains(typing)) {
        bodyDiv.removeChild(typing);
      }
      appendMessage(
        'There was a connection issue while checking that order. Please try again or talk to support.',
        'bot'
      );
      appendChips([
        { label: 'Track again', query: 'Track my order' },
        { label: 'Talk to Support', query: 'Talk to human agent' },
      ]);
      resetInputMode();
    }
  }

  async function sendMessage(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return;

    if (input.dataset.mode === 'order_tracking') {
      input.value = '';
      promptOrderVerification(text);
      return;
    }

    if (input.dataset.mode === 'order_tracking_verify') {
      input.value = '';
      lookupOrderStatus(input.dataset.orderId, text);
      return;
    }

    if (text === 'Track my order' || text === 'Track Order') {
      appendMessage(text, 'user');
      input.value = '';
      window.setTimeout(startOrderTracking, 300);
      return;
    }

    appendMessage(text, 'user');
    input.value = '';

    const typing = document.createElement('div');
    typing.className = 'bluewud-typing';
    typing.textContent = 'BlueBot is typing...';
    bodyDiv.appendChild(typing);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();

      if (bodyDiv.contains(typing)) {
        bodyDiv.removeChild(typing);
      }

      if (data.action === 'handoff') {
        triggerHandoff(text);
        return;
      }

      appendMessage(data.reply, 'bot');
      if (Array.isArray(data.chips) && data.chips.length > 0) {
        appendChips(data.chips);
      }
    } catch (error) {
      if (bodyDiv.contains(typing)) {
        bodyDiv.removeChild(typing);
      }
      appendMessage(
        `There was a connection issue. You can reach us on ${SUPPORT_PHONE} or ${SUPPORT_EMAIL}.`,
        'bot'
      );
      appendChips([{ label: 'Talk to Support', query: 'Talk to human agent' }]);
    }
  }

  chatButton.addEventListener('click', openWidget);
  closeButton.addEventListener('click', closeWidget);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && input.value.trim()) {
      sendMessage(input.value.trim());
    }
  });
  sendButton.addEventListener('click', () => {
    if (input.value.trim()) {
      sendMessage(input.value.trim());
    }
  });
})();
