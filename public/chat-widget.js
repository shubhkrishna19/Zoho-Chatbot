// public/chat-widget.js
(() => {
  // --- STATE MANAGEMENT ---
  window.bluewudHandoffActive = false;

  // --- 1. Inject Zoho SalesIQ Script ---
  const zohoScript = document.createElement('script');
  zohoScript.id = 'zsiqscript';
  zohoScript.src = 'https://salesiq.zohopublic.com/widget?wc=siq4c7716da988d8cbb7d42379d1a02f9650078fd58c1092a23f0ac730cb1be0905';
  zohoScript.defer = true;
  document.head.appendChild(zohoScript);

  window.$zoho = window.$zoho || {};
  window.$zoho.salesiq = window.$zoho.salesiq || { ready: function () { } };

  // --- CRITICAL: Aggressively Hide Zoho Initially ---
  const zohoHideStyle = document.createElement('style');
  zohoHideStyle.id = 'bluewud-zoho-hide';
  zohoHideStyle.textContent = `
    .zsiq_float, #zsiq_float, .zsiq-new-theme { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
  `;
  document.head.appendChild(zohoHideStyle);

  // --- ENFORCER: MutationObserver + Interval ---
  const observer = new MutationObserver((mutations) => {
    if (!window.bluewudHandoffActive) {
      const zohoFloat = document.querySelector('.zsiq_float') || document.getElementById('zsiq_float');
      if (zohoFloat && (zohoFloat.style.display !== 'none' || zohoFloat.style.visibility !== 'hidden')) {
        zohoFloat.setAttribute('style', 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;');
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });

  setInterval(() => {
    if (!window.bluewudHandoffActive) {
      if (!document.getElementById('bluewud-zoho-hide')) {
        document.head.appendChild(zohoHideStyle);
      }
      const zohoElements = document.querySelectorAll('.zsiq_float, #zsiq_float, .zsiq-new-theme');
      zohoElements.forEach(el => {
        el.setAttribute('style', 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;');
      });
    }
  }, 100);


  window.$zoho.salesiq.ready = function () {
    window.$zoho.salesiq.floatbutton.visible('hide');
    window.$zoho.salesiq.theme.basecolor('#0066ff');

    function restoreCustomWidget() {
      window.bluewudHandoffActive = false;
      window.$zoho.salesiq.floatbutton.visible('hide');
      window.$zoho.salesiq.floatwindow.visible('hide');

      if (!document.getElementById('bluewud-zoho-hide')) {
        document.head.appendChild(zohoHideStyle);
      }

      const btn = document.getElementById('bluewud-chat-btn');
      if (btn) {
        btn.style.display = 'flex';
        btn.style.animation = 'pulse 2s infinite';
      }
      const modal = document.getElementById('bluewud-chat-modal');
      if (modal) modal.style.display = 'none';
    }

    window.$zoho.salesiq.floatwindow.close(restoreCustomWidget);
    window.$zoho.salesiq.floatwindow.minimize(restoreCustomWidget);
    window.$zoho.salesiq.chat.close(restoreCustomWidget);
  };

  // --- 2. Custom Widget Styles (Modern V2) ---
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(0, 102, 255, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(0, 102, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 102, 255, 0); } }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    #bluewud-chat-btn { 
      position: fixed; bottom: 30px; right: 30px; 
      background: linear-gradient(135deg, #0066ff, #0044aa); 
      color: #fff; border: none; 
      border-radius: 50%; width: 64px; height: 64px; 
      cursor: pointer; font-size: 28px; 
      z-index: 2147483647; 
      box-shadow: 0 8px 24px rgba(0, 68, 170, 0.3);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex; align-items: center; justify-content: center;
      animation: pulse 2s infinite;
    }
    #bluewud-chat-btn:hover { transform: scale(1.1) rotate(-5deg); box-shadow: 0 12px 32px rgba(0, 68, 170, 0.4); animation: none; }
    
    #bluewud-chat-modal { 
      display: none; position: fixed; bottom: 110px; right: 30px; 
      width: 380px; height: 650px; max-height: 85vh;
      background: #f8f9fa; border: none; border-radius: 24px; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.15); 
      z-index: 2147483647; 
      flex-direction: column; overflow: hidden; 
      font-family: 'Inter', sans-serif; 
      border: 1px solid rgba(0,0,0,0.05);
      animation: slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    
    #bluewud-chat-header { 
      background: linear-gradient(135deg, #0066ff, #0044aa); 
      color: #fff; padding: 24px; 
      position: relative; overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    #bluewud-chat-header::before {
      content: ''; position: absolute; top: -50%; right: -20%;
      width: 200px; height: 200px; background: rgba(255,255,255,0.1);
      border-radius: 50%; pointer-events: none;
    }

    .bluewud-header-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 16px; }
    .bluewud-avatar { 
      width: 48px; height: 48px; background: rgba(255,255,255,0.2); 
      backdrop-filter: blur(4px); border-radius: 50%; 
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: #fff; border: 2px solid rgba(255,255,255,0.3);
    }
    .bluewud-title-area { display: flex; flex-direction: column; }
    .bluewud-title { font-weight: 700; font-size: 20px; letter-spacing: -0.5px; }
    .bluewud-subtitle { font-size: 12px; opacity: 0.85; margin-top: 4px; font-weight: 500; }
    
    #bluewud-chat-controls {
      position: absolute; top: 20px; right: 20px; z-index: 2;
      display: flex; gap: 12px; align-items: center;
    }
    #bluewud-chat-close { cursor: pointer; font-size: 24px; opacity: 0.8; transition: opacity 0.2s; }
    #bluewud-chat-close:hover { opacity: 1; }

    #bluewud-chat-body { 
      flex: 1; padding: 24px; overflow-y: auto; 
      font-size: 14px; background: #fff; 
      display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    
    /* V2 MESSAGES */
    .bluewud-msg { 
      padding: 12px 16px; max-width: 85%; line-height: 1.5; font-size: 14px;
      position: relative; animation: slideIn 0.2s ease-out;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .bluewud-user { 
      align-self: flex-end; 
      background: linear-gradient(135deg, #0066ff, #0052cc); 
      color: #fff; 
      border-radius: 18px 18px 4px 18px; 
    }
    .bluewud-bot { 
      align-self: flex-start; 
      background: #f1f3f5; 
      color: #1c1e21; 
      border-radius: 18px 18px 18px 4px; 
    }

    /* V2 CHIPS */
    .bluewud-chips-container {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
      animation: slideIn 0.3s ease-out;
    }
    .bluewud-chip {
      background: #fff; border: 1px solid #e9ecef; color: #0066ff;
      padding: 8px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .bluewud-chip:hover {
      background: #0066ff; color: #fff; transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,102,255,0.2); border-color: #0066ff;
    }

    /* V2 MENU / ACCORDION */
    .bluewud-menu-card {
      background: #fff; border: 1px solid #e9ecef; border-radius: 16px;
      overflow: hidden; margin-top: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      width: 100%; animation: slideIn 0.3s ease-out;
    }
    .bluewud-menu-item {
      padding: 14px 16px; border-bottom: 1px solid #f1f3f5;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; transition: background 0.2s; font-size: 14px; color: #343a40; font-weight: 500;
    }
    .bluewud-menu-item:hover { background: #f8f9fa; color: #0066ff; }
    .bluewud-menu-item:last-child { border-bottom: none; }
    .bluewud-menu-arrow { font-size: 12px; color: #adb5bd; }

    #bluewud-chat-input-area { 
      padding: 16px; background: #fff; 
      display: flex; align-items: center; gap: 10px;
      border-top: 1px solid #f1f3f5;
    }
    #bluewud-chat-input { 
      flex: 1; padding: 12px 18px; border: 1px solid #e9ecef; 
      background: #f8f9fa;
      border-radius: 24px; outline: none; font-family: inherit; font-size: 14px;
      transition: all 0.2s;
    }
    #bluewud-chat-input:focus { border-color: #0066ff; background: #fff; box-shadow: 0 0 0 3px rgba(0,102,255,0.1); }
    #bluewud-chat-send { 
      background: #0066ff; color: #fff; border: none; 
      width: 40px; height: 40px; border-radius: 50%; 
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, background 0.2s;
      box-shadow: 0 4px 10px rgba(0,102,255,0.2);
    }
    #bluewud-chat-send:hover { background: #0052cc; transform: scale(1.05); }

    .bluewud-typing { font-style: italic; color: #adb5bd; font-size: 12px; margin-left: 14px; margin-bottom: 8px; }
    #bluewud-footer { text-align: center; font-size: 10px; color: #dee2e6; padding-bottom: 8px; background: #fff; }
    
    #bluewud-chat-body::-webkit-scrollbar { width: 5px; }
    #bluewud-chat-body::-webkit-scrollbar-thumb { background: #e9ecef; border-radius: 3px; }
  `;
  document.head.appendChild(style);

  // --- 3. Create Custom Widget UI ---
  const btn = document.createElement('button');
  btn.id = 'bluewud-chat-btn';
  btn.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  document.body.appendChild(btn);

  const modal = document.createElement('div');
  modal.id = 'bluewud-chat-modal';
  modal.innerHTML = `
    <div id="bluewud-chat-header">
      <div id="bluewud-chat-controls">
        <span id="bluewud-chat-close">×</span>
      </div>
      <div class="bluewud-header-content">
        <div class="bluewud-avatar">🤖</div>
        <div class="bluewud-title-area">
          <span class="bluewud-title">BlueBot</span>
          <span class="bluewud-subtitle">For all your furniture needs!</span>
        </div>
      </div>
    </div>
    <div id="bluewud-chat-body"></div>
    <div id="bluewud-chat-input-area">
      <input id="bluewud-chat-input" placeholder="Type a message..." autocomplete="off"/>
      <button id="bluewud-chat-send">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
    <div id="bluewud-footer">Powered by BlueBot</div>
  `;
  document.body.appendChild(modal);

  // --- UI HELPERS ---
  const bodyDiv = document.getElementById('bluewud-chat-body');

  function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `bluewud-msg bluewud-${sender}`;
    msgDiv.innerHTML = text.replace(/\n/g, '<br/>'); // Simple markdown support
    bodyDiv.appendChild(msgDiv);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;
  }

  function appendChips(chips) {
    const container = document.createElement('div');
    container.className = 'bluewud-chips-container';

    chips.forEach(chip => {
      const btn = document.createElement('div');
      btn.className = 'bluewud-chip';
      btn.textContent = chip.label;
      btn.onclick = () => {
        // Disable after click to prevent spam
        // btn.style.pointerEvents = 'none';
        // btn.style.opacity = '0.7';
        sendMessage(chip.query || chip.label);
      };
      container.appendChild(btn);
    });

    bodyDiv.appendChild(container);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;
  }

  function appendMenu(items) {
    const card = document.createElement('div');
    card.className = 'bluewud-menu-card';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'bluewud-menu-item';
      row.innerHTML = `<span>${item.label}</span> <span class="bluewud-menu-arrow">›</span>`;
      row.onclick = () => sendMessage(item.query || item.label);
      card.appendChild(row);
    });
    bodyDiv.appendChild(card);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;
  }

  // --- CUSTOMER RECOGNITION (LOCALSTORAGE) ---
  const LS_KEY = 'bluewud_user_data';

  function safeLocalStorage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function saveCustomerData(data) {
    const storage = safeLocalStorage();
    if (!storage) return;
    const current = JSON.parse(storage.getItem(LS_KEY) || '{}');
    storage.setItem(LS_KEY, JSON.stringify({ ...current, ...data, lastVisit: new Date().toISOString() }));
  }

  function loadCustomerData() {
    const storage = safeLocalStorage();
    if (!storage) return null;
    return JSON.parse(storage.getItem(LS_KEY) || 'null');
  }

  // --- CONTEXT AWARENESS ---
  function getContextGreeting() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('tv-units')) return "Looking for the perfect **TV Unit**? I can help you compare models.";
    if (path.includes('coffee-tables')) return "Need a **Coffee Table** to complete your living room? Ask me anything.";
    if (path.includes('study-tables')) return "Planning your home office? Check out our **Study Tables**.";
    if (path.includes('shoe-racks')) return "Organizing your footwear? Let's find a **Shoe Rack**.";
    return "Hi! Welcome to Bluewud. I'm your furniture expert. How can I help you today?";
  }

  // --- INITIALIZE CHAT ---
  function initChat() {
    bodyDiv.innerHTML = ''; // Clear context

    // 1. Check Previous Customer Data
    const customer = loadCustomerData();
    let greeting = getContextGreeting();

    if (customer && customer.lastOrderId) {
      greeting = `Welcome back! Do you want to check the status of **Order #${customer.lastOrderId}** again?`;
    }

    appendMessage(greeting, 'bot');

    // Quick Action Chips
    const chips = [
      { label: "📦 Track Order", query: "Track my order" },
      { label: "🛡️ Warranty Info", query: "Warranty policy" },
      { label: "↩️ Return Policy", query: "Return policy" },
      { label: "📞 Support", query: "Talk to human agent" }
    ];

    // If returning user, put "Track Order" first and highlight it
    if (customer && customer.lastOrderId) {
      // Already first, but logic could personalize this further
    }

    appendChips(chips);
  }

  // Toggle Modal
  btn.addEventListener('click', () => {
    if (modal.style.display !== 'flex') {
      modal.style.display = 'flex';
      btn.style.display = 'none';
      if (bodyDiv.children.length === 0) initChat();
      document.getElementById('bluewud-chat-input').focus();
    }
  });

  document.getElementById('bluewud-chat-close').addEventListener('click', () => {
    modal.style.display = 'none';
    btn.style.display = 'flex';
  });

  // --- TRACK ORDER LOGIC ---
  async function handleOrderTracking(orderId) {
    appendMessage(orderId, 'user');

    const typingDiv = document.createElement('div');
    typingDiv.className = 'bluewud-typing';
    typingDiv.textContent = 'Checking order status...';
    bodyDiv.appendChild(typingDiv);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;

    try {
      const resp = await fetch('https://bluewud-chatbot.vercel.app/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId })
      });
      const data = await resp.json();

      if (bodyDiv.contains(typingDiv)) bodyDiv.removeChild(typingDiv);

      if (data.found) {
        // SAVE TO LOCALSTORAGE
        saveCustomerData({ lastOrderId: data.orderId });

        const statusHtml = `
                  <div style="background:#f0f9ff; padding:12px; border-radius:8px; border:1px solid #bae6fd;">
                      <strong style="color:#0284c7;">📦 Order #${data.orderId}</strong><br/>
                      <div style="margin-top:8px; font-size:16px;">${data.status}</div>
                      <div style="font-size:12px; color:#64748b; margin-top:4px;">Date: ${data.date}</div>
                  </div>
              `;
        appendMessage(statusHtml, 'bot');
      } else {
        appendMessage(`❌ ${data.message}`, 'bot');
      }

      // Reset Input Mode
      const input = document.getElementById('bluewud-chat-input');
      input.placeholder = "Type a message...";
      input.dataset.mode = "chat";

    } catch (e) {
      if (bodyDiv.contains(typingDiv)) bodyDiv.removeChild(typingDiv);
      appendMessage("⚠️ Connection failed. Please try again.", 'bot');
    }
  }

  // --- COMMUNICATION LOGIC ---
  const apiUrl = 'https://bluewud-chatbot.vercel.app/api/message';

  async function sendMessage(text) {
    const input = document.getElementById('bluewud-chat-input');

    // SPECIAL MODES
    if (input.dataset.mode === 'order_tracking') {
      handleOrderTracking(text);
      input.value = '';
      return;
    }

    if (text === "Track my order" || text === "📦 Track Order") {
      appendMessage(text, 'user');
      setTimeout(() => {
        appendMessage("Please enter your 5-digit **Order ID** (e.g., 12345).", 'bot');
        input.placeholder = "Enter Order ID here...";
        input.dataset.mode = "order_tracking";
        input.focus();
      }, 500);
      return;
    }

    // NORMAL CHAT FLOW
    appendMessage(text, 'user');
    input.value = '';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'bluewud-typing';
    typingDiv.textContent = 'Bluewud is typing...';
    bodyDiv.appendChild(typingDiv);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;

    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await resp.json();

      if (bodyDiv.contains(typingDiv)) bodyDiv.removeChild(typingDiv);

      if (data.action === 'handoff') {
        triggerHandoff(text);
      } else {
        appendMessage(data.reply, 'bot');
      }

    } catch (e) {
      if (bodyDiv.contains(typingDiv)) bodyDiv.removeChild(typingDiv);
      appendMessage('Connection issue. Contact us at +918800609609', 'bot');
    }
  }

  const input = document.getElementById('bluewud-chat-input');
  const sendBtn = document.getElementById('bluewud-chat-send');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) sendMessage(input.value.trim());
  });

  sendBtn.addEventListener('click', () => {
    if (input.value.trim()) sendMessage(input.value.trim());
  });

})();
