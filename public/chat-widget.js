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

  // Initialize Zoho object & Configuration
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
  // 1. MutationObserver for immediate reaction
  const observer = new MutationObserver((mutations) => {
    if (!window.bluewudHandoffActive) {
      const zohoFloat = document.querySelector('.zsiq_float') || document.getElementById('zsiq_float');
      if (zohoFloat && (zohoFloat.style.display !== 'none' || zohoFloat.style.visibility !== 'hidden')) {
        zohoFloat.setAttribute('style', 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;');
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });

  // 2. Interval Backup (Every 100ms) - To catch anything the observer misses or race conditions
  setInterval(() => {
    if (!window.bluewudHandoffActive) {
      // Ensure Style Tag Exists
      if (!document.getElementById('bluewud-zoho-hide')) {
        document.head.appendChild(zohoHideStyle);
      }
      // Force Inline Styles on Zoho Elements
      const zohoElements = document.querySelectorAll('.zsiq_float, #zsiq_float, .zsiq-new-theme');
      zohoElements.forEach(el => {
        el.setAttribute('style', 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;');
      });
    }
  }, 100);


  window.$zoho.salesiq.ready = function () {
    window.$zoho.salesiq.floatbutton.visible('hide');
    window.$zoho.salesiq.theme.basecolor('#0066ff');

    // --- HANDLE ZOHO EXIT / MINIMIZE ---
    function restoreCustomWidget() {
      // Reset Flag
      window.bluewudHandoffActive = false;

      // 1. Force Hide Zoho
      window.$zoho.salesiq.floatbutton.visible('hide');
      window.$zoho.salesiq.floatwindow.visible('hide');

      // 2. Re-apply aggressive CSS hiding
      if (!document.getElementById('bluewud-zoho-hide')) {
        document.head.appendChild(zohoHideStyle);
      }

      // 3. Restore Custom Widget Button
      const btn = document.getElementById('bluewud-chat-btn');
      if (btn) {
        btn.style.display = 'flex';
        btn.style.animation = 'pulse 2s infinite';
      }

      // 4. Reset Custom Widget Modal
      const modal = document.getElementById('bluewud-chat-modal');
      if (modal) modal.style.display = 'none';
    }

    // Listen for ALL close/minimize events
    window.$zoho.salesiq.floatwindow.close(restoreCustomWidget);
    window.$zoho.salesiq.floatwindow.minimize(restoreCustomWidget);
    window.$zoho.salesiq.chat.close(restoreCustomWidget);
  };

  // --- 2. Custom Widget Styles (Modern & Badass) ---
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    /* Animations */
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(0, 102, 255, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(0, 102, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 102, 255, 0); } }
    
    #bluewud-chat-btn { 
      position: fixed; bottom: 30px; right: 30px; 
      background: linear-gradient(135deg, #0066ff, #0044aa); 
      color: #fff; border: none; 
      border-radius: 50%; width: 64px; height: 64px; 
      cursor: pointer; font-size: 28px; 
      z-index: 2147483647; /* MAX Z-INDEX */
      box-shadow: 0 8px 24px rgba(0, 68, 170, 0.3);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex; align-items: center; justify-content: center;
      animation: pulse 2s infinite;
    }
    #bluewud-chat-btn:hover { transform: scale(1.1) rotate(-5deg); box-shadow: 0 12px 32px rgba(0, 68, 170, 0.4); animation: none; }
    
    #bluewud-chat-modal { 
      display: none; position: fixed; bottom: 110px; right: 30px; 
      width: 380px; height: 600px; max-height: 80vh;
      background: #fff; border: none; border-radius: 24px; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.15); 
      z-index: 2147483647; /* MAX Z-INDEX */
      flex-direction: column; overflow: hidden; 
      font-family: 'Inter', sans-serif; 
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
    
    #bluewud-chat-agent {
      font-size: 11px; background: rgba(255,255,255,0.15); 
      padding: 6px 12px; border-radius: 20px; cursor: pointer;
      border: 1px solid rgba(255,255,255,0.3);
      font-weight: 600; transition: background 0.2s;
      backdrop-filter: blur(4px);
    }
    #bluewud-chat-agent:hover { background: rgba(255,255,255,0.25); }

    #bluewud-chat-close { cursor: pointer; font-size: 24px; opacity: 0.8; transition: opacity 0.2s; }
    #bluewud-chat-close:hover { opacity: 1; }

    #bluewud-chat-body { 
      flex: 1; padding: 24px; overflow-y: auto; 
      font-size: 15px; background: #f8f9fa; 
      display: flex; flex-direction: column; gap: 16px;
      scroll-behavior: smooth;
    }
    
    #bluewud-chat-input-area { 
      padding: 20px; background: #fff; 
      display: flex; align-items: center; gap: 12px;
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    #bluewud-chat-input { 
      flex: 1; padding: 14px 20px; border: 1px solid #eef0f2; 
      background: #f8f9fa;
      border-radius: 30px; outline: none; font-family: inherit; font-size: 15px;
      transition: all 0.2s;
    }
    #bluewud-chat-input:focus { border-color: #0066ff; background: #fff; box-shadow: 0 0 0 4px rgba(0,102,255,0.1); }
    #bluewud-chat-send { 
      background: #0066ff; color: #fff; border: none; 
      width: 44px; height: 44px; border-radius: 50%; 
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, background 0.2s;
      box-shadow: 0 4px 12px rgba(0,102,255,0.2);
    }
    #bluewud-chat-send:hover { background: #0052cc; transform: scale(1.05); }
    
    .bluewud-msg { 
      padding: 14px 18px; max-width: 80%; line-height: 1.5; font-size: 15px;
      position: relative; animation: slideIn 0.2s ease-out;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .bluewud-user { 
      align-self: flex-end; 
      background: linear-gradient(135deg, #0066ff, #0052cc); 
      color: #fff; 
      border-radius: 20px 20px 4px 20px; 
    }
    .bluewud-bot { 
      align-self: flex-start; 
      background: #fff; 
      color: #1c1e21; 
      border-radius: 20px 20px 20px 4px; 
      border: 1px solid rgba(0,0,0,0.05);
    }
    .bluewud-typing { 
      font-style: italic; color: #888; font-size: 13px; margin-left: 12px; 
      display: flex; align-items: center; gap: 4px;
    }
    .bluewud-typing::after { content: '...'; animation: pulse 1s infinite; }
    
    #bluewud-footer {
      text-align: center; font-size: 11px; color: #adb5bd; padding-bottom: 12px; background: #fff;
    }
    
    /* Scrollbar */
    #bluewud-chat-body::-webkit-scrollbar { width: 6px; }
    #bluewud-chat-body::-webkit-scrollbar-track { background: transparent; }
    #bluewud-chat-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
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
        <span id="bluewud-chat-agent">🎧 Support</span>
        <span id="bluewud-chat-close">×</span>
      </div>
      <div class="bluewud-header-content">
        <div class="bluewud-avatar">🤖</div>
        <div class="bluewud-title-area">
          <span class="bluewud-title">Bluewud</span>
          <span class="bluewud-subtitle">Premium Furniture Assistant</span>
        </div>
      </div>
    </div>
    <div id="bluewud-chat-body">
      <div class="bluewud-msg bluewud-bot">Hi! How can I help you with your furniture today?</div>
    </div>
    <div id="bluewud-chat-input-area">
      <input id="bluewud-chat-input" placeholder="Type a message..." autocomplete="off"/>
      <button id="bluewud-chat-send">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
    <div id="bluewud-footer">Powered by Bluewud AI</div>
  `;
  document.body.appendChild(modal);

  // Toggle Modal
  btn.addEventListener('click', () => {
    modal.style.display = 'flex';
    btn.style.display = 'none';
    document.getElementById('bluewud-chat-input').focus();
  });

  document.getElementById('bluewud-chat-close').addEventListener('click', () => {
    modal.style.display = 'none';
    btn.style.display = 'flex';
  });

  // Manual Handoff Button
  document.getElementById('bluewud-chat-agent').addEventListener('click', () => {
    triggerHandoff("I would like to speak to a support agent.");
  });

  // --- 4. Communication Logic ---
  const apiUrl = 'https://bluewud-chatbot.vercel.app/api/message';

  function appendMessage(text, sender) {
    const bodyDiv = document.getElementById('bluewud-chat-body');
    const msgDiv = document.createElement('div');
    msgDiv.className = `bluewud-msg bluewud-${sender}`;
    msgDiv.textContent = text;
    bodyDiv.appendChild(msgDiv);
    bodyDiv.scrollTop = bodyDiv.scrollHeight;
  }

  function triggerHandoff(contextMessage) {
    appendMessage("Connecting you to a live agent...", 'bot');

    // Set Flag to Allow Zoho
    window.bluewudHandoffActive = true;

    setTimeout(() => {
      // Hide Custom UI
      modal.style.display = 'none';
      btn.style.display = 'none';

      // Remove Aggressive Hide Style
      if (document.getElementById('bluewud-zoho-hide')) {
        document.getElementById('bluewud-zoho-hide').remove();
      }

      // Show Zoho
      if (window.$zoho && window.$zoho.salesiq) {
        window.$zoho.salesiq.visitor.question(contextMessage);
        window.$zoho.salesiq.floatwindow.visible('show');
        window.$zoho.salesiq.chat.start();
      } else {
        alert("Connecting to agent... (Please wait for Zoho to load)");
        // Fallback
        setTimeout(() => {
          if (window.$zoho && window.$zoho.salesiq) {
            window.$zoho.salesiq.visitor.question(contextMessage);
            window.$zoho.salesiq.floatwindow.visible('show');
            window.$zoho.salesiq.chat.start();
          }
        }, 2000);
      }
    }, 1000);
  }

  async function sendMessage(text) {
    appendMessage(text, 'user');
    const input = document.getElementById('bluewud-chat-input');
    input.value = '';

    const bodyDiv = document.getElementById('bluewud-chat-body');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bluewud-typing';
    typingDiv.textContent = 'Bluewud is typing';
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
      appendMessage('Sorry, something went wrong. Please try again.', 'bot');
    }
  }

  const input = document.getElementById('bluewud-chat-input');
  const sendBtn = document.getElementById('bluewud-chat-send');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      sendMessage(input.value.trim());
    }
  });

  sendBtn.addEventListener('click', () => {
    if (input.value.trim()) {
      sendMessage(input.value.trim());
    }
  });

})();
