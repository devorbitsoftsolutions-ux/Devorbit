(function () {
  'use strict';

  var DevOrbitBot = {
    config: {
      databaseUrl: 'database.json',
      siteName: 'DevOrbit',
      greeting: '\u{1F44B} Hi there! Welcome to DevOrbit.\nNeed help with our services, pricing, technologies, or project consultation? I\u2019m here to help!',
      robotGifUrl: 'robo.png',
      primaryColor: '#3F72AF',
      darkNavy: '#112D4E',
      threshold: 0.35,
      feedbackEnabled: true,
    },

    qa: [],
    history: [],

    init: function (opts) {
      if (opts) {
        for (var k in opts) {
          if (opts.hasOwnProperty(k)) this.config[k] = opts[k];
        }
      }
      var self = this;
      // Fetch docbot URL dynamically so it works regardless of port changes
      fetch('/api/docbot-url')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && data.url) {
            self.config.docbotUrl = data.url;
          }
        })
        .catch(function () { /* use default */ });
      this._injectStyles();
      this._buildDOM();
      this._loadDatabase();
      if (this.config.feedbackEnabled) this._loadFeedback();
      setInterval(function (self) { self._refreshQA(); }, 300000, this);
    },

    // ---------- Q&A Matching ----------

    _tokenize: function (text) {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(Boolean);
    },

    _vectorize: function (tokens, vocab) {
      var vec = new Array(vocab.length).fill(0);
      for (var i = 0; i < tokens.length; i++) {
        var idx = vocab.indexOf(tokens[i]);
        if (idx !== -1) vec[idx]++;
      }
      return vec;
    },

    _cosineSimilarity: function (a, b) {
      var dot = 0, magA = 0, magB = 0;
      for (var i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
      }
      if (magA === 0 || magB === 0) return 0;
      return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    },

    _findBestMatch: function (input) {
      var inputTokens = this._tokenize(input);
      if (inputTokens.length === 0) return null;

      // Check for greeting / chit-chat first
      var greetingKeywords = ['hi', 'hello', 'hey', 'howdy', 'greetings', 'sup', 'yo'];
      var isGreeting = inputTokens.every(function (t) { return greetingKeywords.indexOf(t) !== -1 || t === 'there'; });
      if (isGreeting && inputTokens.length <= 3) {
        return { answer: 'Hey there! How can I assist you today? 😊', confidence: 100, isProjectInterest: false };
      }

      // Check for "how are you" variations
      var howAreYouMatch = inputTokens.some(function(t) { return t === 'how'; }) &&
                           inputTokens.some(function(t) { return t === 'are' || t === 'doing'; }) &&
                           inputTokens.some(function(t) { return t === 'you'; });
      if (howAreYouMatch) {
        return { answer: "I'm doing great, thanks for asking! How can I help you today?", confidence: 100, isProjectInterest: false };
      }

      // Check for thank you
      var thankYouWords = ['thank', 'thanks', 'thankyou', 'ty'];
      if (inputTokens.some(function (t) { return thankYouWords.indexOf(t) !== -1; }) && inputTokens.length <= 3) {
        return { answer: "You're welcome! 😊 Feel free to ask if you have any other questions.", confidence: 100, isProjectInterest: false };
      }

      // Check for bye/goodbye
      var byeWords = ['bye', 'goodbye', 'see', 'later', 'cya'];
      if (inputTokens.some(function (t) { return byeWords.indexOf(t) !== -1; }) && inputTokens.length <= 3) {
        return { answer: "Goodbye! Feel free to come back anytime. Have a great day! 😊", confidence: 100, isProjectInterest: false };
      }

      // Check for project interest keywords
      var projectKeywords = ['project', 'start', 'build', 'create', 'develop', 'make', 'quote', 'estimate', 'consultation', 'hire', 'team', 'partner'];
      var hasProjectInterest = inputTokens.some(function (t) { return projectKeywords.indexOf(t) !== -1; });
      if (hasProjectInterest) return { answer: null, isProjectInterest: true };

      // Topic boost: if input has topic-specific keywords, prefer matching entries
      var pricingKeywords = ['price', 'prices', 'pricing', 'cost', 'costs', 'rate', 'rates', 'expensive', 'budget', 'charge', 'charges', 'cheap', 'afford'];
      var serviceKeywords = ['service', 'services', 'offer', 'offers', 'provide', 'provides'];
      var contactKeywords = ['contact', 'email', 'phone', 'reach', 'whatsapp', 'call'];
      var inputHasPricing = inputTokens.some(function (t) { return pricingKeywords.indexOf(t) !== -1; });
      var inputHasService = inputTokens.some(function (t) { return serviceKeywords.indexOf(t) !== -1; });
      var inputHasContact = inputTokens.some(function (t) { return contactKeywords.indexOf(t) !== -1; });

      var best = { score: 0, idx: -1 };

      for (var i = 0; i < this.qa.length; i++) {
        var qTokens = this._tokenize(this.qa[i].question);
        var vocab = Array.from(new Set(inputTokens.concat(qTokens)));
        var v1 = this._vectorize(inputTokens, vocab);
        var v2 = this._vectorize(qTokens, vocab);
        var sim = this._cosineSimilarity(v1, v2);

        var overlap = inputTokens.filter(function (t) { return qTokens.indexOf(t) !== -1; }).length;
        var keywordBonus = overlap / Math.max(inputTokens.length, qTokens.length) * 0.2;

        var topicBonus = 0;
        if (inputHasPricing && qTokens.some(function (t) { return pricingKeywords.indexOf(t) !== -1; })) topicBonus = 0.05;
        else if (inputHasService && qTokens.some(function (t) { return serviceKeywords.indexOf(t) !== -1; })) topicBonus = 0.05;
        else if (inputHasContact && qTokens.some(function (t) { return contactKeywords.indexOf(t) !== -1; })) topicBonus = 0.05;

        var score = sim + keywordBonus + topicBonus;

        if (score > best.score) {
          best = { score: Math.min(score, 1), idx: i };
        }
      }

      if (best.score >= this.config.threshold) {
        return {
          answer: this.qa[best.idx].answer,
          question: this.qa[best.idx].question,
          confidence: Math.round(best.score * 100),
          isProjectInterest: false,
        };
      }
      return null;
    },

    // ---------- Database Loading ----------

    _loadDatabase: function () {
      var self = this;
      self._fetchQA('/api/chatbot/qa', function (qa) {
        if (qa && qa.length > 0) {
          self.qa = qa;
          console.log('[DevOrbitBot] Loaded ' + qa.length + ' Q&A pairs from /api/chatbot/qa');
        } else {
          self._fetchQA(self.config.databaseUrl, function (fallback) {
            if (fallback) self.qa = fallback;
            console.log('[DevOrbitBot] Loaded ' + (self.qa ? self.qa.length : 0) + ' Q&A pairs from ' + self.config.databaseUrl);
          });
        }
      });
    },

    _fetchQA: function (url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (Array.isArray(data)) {
              callback(data);
              return;
            }
          } catch (e) {}
        }
        callback(null);
      };
      xhr.onerror = function () { callback(null); };
      xhr.send();
    },

    _refreshQA: function () {
      var self = this;
      self._fetchQA('/api/chatbot/qa/refresh', function (result) {
        if (result) {
          self._fetchQA('/api/chatbot/qa', function (qa) {
            if (qa && qa.length > 0) {
              self.qa = qa;
              console.log('[DevOrbitBot] Refreshed Q&A cache: ' + qa.length + ' pairs');
            }
          });
        }
      });
    },

    // ---------- Feedback ----------

    _loadFeedback: function () {
      var stored = localStorage.getItem('devorbit_feedback');
      if (stored) {
        try { this.feedbackLog = JSON.parse(stored); } catch (e) { this.feedbackLog = []; }
      } else {
        this.feedbackLog = [];
      }
    },

    _saveFeedback: function (question, answer, helpful) {
      var entry = {
        question: question,
        answer: answer,
        helpful: helpful,
        timestamp: new Date().toISOString(),
      };
      this.feedbackLog.push(entry);
      localStorage.setItem('devorbit_feedback', JSON.stringify(this.feedbackLog));
      console.log('[DevOrbitBot Feedback]', entry);
    },

    // ---------- DOM & UI ----------

    _injectStyles: function () {
      if (document.getElementById('devorbit-styles')) return;
      var css = document.createElement('style');
      css.id = 'devorbit-styles';
      css.textContent = [
        '#devorbit-widget * { box-sizing: border-box; margin: 0; padding: 0; }',
        '#devorbit-widget { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',

        '/* Robot Button */',
'#devorbit-btn {',
'  position: fixed; bottom: 24px; right: 24px; z-index: 999999;',
'  border: none; background: transparent; padding: 0; margin: 0;',
'  cursor: pointer; display: block; line-height: 0;',
'  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);',
'  animation: devorbit-bounce 2.5s ease-in-out infinite;',
'  max-width: 80px;',
'}',
'#devorbit-btn:hover { transform: scale(1.12); animation: none; }',
'#devorbit-btn:active { transform: scale(0.95); }',
'#devorbit-btn img { width: 100%; height: auto; display: block; }',

'@keyframes devorbit-bounce {',
'  0%, 100% { transform: translateY(0); }',
'  50% { transform: translateY(-8px); }',
'}',

        '/* Speech Bubble */',
        '#devorbit-bubble {',
        '  position: fixed; bottom: 100px; right: 24px; z-index: 999998;',
        '  background: #F9F7F7; border-radius: 14px; padding: 10px 14px;',
        '  box-shadow: 0 4px 20px rgba(17,45,78,0.1); max-width: 240px;',
        '  font-size: 12.5px; color: #112D4E; line-height: 1.5;',
        '  opacity: 0; transform: translateY(12px) scale(0.95); pointer-events: none;',
        '  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);',
        '  border: 1px solid #3F72AF;',
        '}',
        '#devorbit-bubble.show { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }',
        '#devorbit-bubble::after {',
        '  content: ""; position: absolute; bottom: -6px; right: 22px;',
        '  width: 10px; height: 10px; background: #F9F7F7;',
        '  border-right: 1px solid #3F72AF; border-bottom: 1px solid #3F72AF;',
        '  transform: rotate(45deg); border-radius: 0 0 2px 0;',
        '}',
        '#devorbit-bubble .bubble-close {',
        '  position: absolute; top: 3px; right: 6px; background: none; border: none;',
        '  font-size: 14px; cursor: pointer; color: #3F72AF; line-height: 1;',
        '  padding: 1px 3px; transition: color 0.2s; border-radius: 4px;',
        '}',
        '#devorbit-bubble .bubble-close:hover { color: #F9F7F7; background: ' + this.config.primaryColor + '; }',

        '/* Chat Panel */',
        '#devorbit-chat {',
        '  position: fixed; bottom: 24px; right: 24px; z-index: 999997;',
        '  width: 400px; height: 600px; max-height: calc(100vh - 48px);',
        '  background: #F9F7F7; border-radius: 24px;',
        '  box-shadow: 0 12px 60px rgba(17,45,78,0.18);',
        '  display: flex; flex-direction: column; overflow: hidden;',
        '  opacity: 0; transform: translateY(30px) scale(0.92); pointer-events: none;',
        '  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);',
        '  border: 1px solid #3F72AF;',
        '}',
        '#devorbit-chat.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }',

        '/* Chat Header */',
        '#devorbit-chat .chat-header {',
        '  padding: 18px 20px;',
        '  background: linear-gradient(135deg, ' + this.config.primaryColor + ', #3F72AF);',
        '  color: #F9F7F7; display: flex; align-items: center; gap: 14px;',
        '  cursor: pointer; user-select: none; flex-shrink: 0;',
        '}',
        '#devorbit-chat .chat-header .header-logo {',
        '  width: 40px; height: 40px; border-radius: 10px; background: rgba(252,248,242,0.2);',
        '  display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800;',
        '  flex-shrink: 0;',
        '}',
        '#devorbit-chat .chat-header .info { flex: 1; }',
        '#devorbit-chat .chat-header .info h3 { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }',
        '#devorbit-chat .chat-header .info p { font-size: 11px; opacity: 0.8; margin-top: 1px; }',
        '#devorbit-chat .chat-header .header-actions { display: flex; gap: 6px; }',
        '#devorbit-chat .chat-header .header-btn {',
        '  background: rgba(252,248,242,0.18); border: none; color: #F9F7F7;',
        '  width: 30px; height: 30px; border-radius: 8px; cursor: pointer;',
        '  font-size: 16px; display: flex; align-items: center; justify-content: center;',
        '  transition: background 0.2s;',
        '}',
        '#devorbit-chat .chat-header .header-btn:hover { background: rgba(252,248,242,0.3); }',

        '/* Messages */',
        '#devorbit-chat .chat-messages {',
        '  flex: 1; overflow-y: auto; padding: 16px 12px;',
        '  scroll-behavior: smooth; background: #F9F7F7;',
        '}',
        '#devorbit-chat .chat-messages::-webkit-scrollbar { width: 4px; }',
        '#devorbit-chat .chat-messages::-webkit-scrollbar-thumb { background: #3F72AF; border-radius: 4px; }',

        '.devorbit-msg { margin-bottom: 10px; display: flex; gap: 8px; animation: devorbit-fadeIn 0.3s ease; max-width: 85%; min-width: 0; }',
        '@keyframes devorbit-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }',

        '.devorbit-msg.bot { align-items: flex-end; margin-right: auto; }',
        '.devorbit-msg.user { flex-direction: row-reverse; align-items: flex-end; margin-left: auto; }',

        '.devorbit-msg .avatar {',
        '  width: 28px; height: 28px; border-radius: 50%; display: flex;',
        '  align-items: center; justify-content: center; font-size: 12px; font-weight: 700;',
        '  flex-shrink: 0; overflow: hidden; margin-bottom: 2px;',
        '}',
        '.devorbit-msg.bot .avatar { background: rgba(63, 114, 175, 0.1); }',
        '.devorbit-msg.bot .avatar img { width: 100%; height: 100%; object-fit: cover; }',
        '.devorbit-msg.user .avatar {',
        '  background: ' + this.config.primaryColor + '; color: #F9F7F7;',
        '  font-size: 11px; font-weight: 600;',
        '}',

        '.devorbit-msg .bubble {',
        '  max-width: 100%; min-width: 0; padding: 12px 16px; border-radius: 18px;',
        '  font-size: 14px; line-height: 1.6; overflow-wrap: break-word; word-break: break-word;',
        '  overflow: visible;',
        '}',
        '.devorbit-msg.bot .bubble {',
        '  background: #F9F7F7; color: #112D4E;',
        '  border-bottom-left-radius: 4px;',
        '  box-shadow: 0 1px 3px rgba(17,45,78,0.08);',
        '  border: 1px solid #3F72AF;',
        '}',
        '.devorbit-msg.user .bubble {',
        '  background: ' + this.config.primaryColor + '; color: #F9F7F7;',
        '  border-bottom-right-radius: 4px;',
        '  box-shadow: 0 2px 8px rgba(63, 114, 175, 0.2);',
        '}',

        '.devorbit-msg .confidence {',
        '  display: inline-block; font-size: 10px; margin-top: 6px;',
        '  padding: 2px 8px; border-radius: 10px; font-weight: 500;',
        '}',
        '.devorbit-msg .confidence.high { background: #F9F7F7; color: #3F72AF; }',
        '.devorbit-msg .confidence.medium { background: rgba(114, 136, 174, 0.15); color: #3F72AF; }',
        '.devorbit-msg .confidence.low { background: rgba(114, 136, 174, 0.15); color: #3F72AF; }',

        '/* Lead generation */',
        '.devorbit-lead {',
        '  margin-top: 10px; padding: 14px 16px; background: rgba(63, 114, 175, 0.06);',
        '  border: 1px solid rgba(63, 114, 175, 0.15); border-radius: 14px;',
        '  font-size: 13px; color: #112D4E; line-height: 1.5;',
        '}',
        '.devorbit-lead .lead-btn {',
        '  display: inline-block; margin-top: 10px; padding: 8px 20px;',
        '  background: ' + this.config.primaryColor + '; color: #F9F7F7; border: none;',
        '  border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;',
        '  transition: background 0.2s;',
        '}',
        '.devorbit-lead .lead-btn:hover { background: #3F72AF; }',

        '/* Typing */',
        '.devorbit-typing { display: flex; gap: 5px; padding: 8px 4px; align-items: center; }',
        '.devorbit-typing span {',
        '  width: 8px; height: 8px; border-radius: 50%; background: #3F72AF;',
        '  animation: devorbit-typing 1.4s infinite ease-in-out;',
        '}',
        '.devorbit-typing span:nth-child(2) { animation-delay: 0.2s; }',
        '.devorbit-typing span:nth-child(3) { animation-delay: 0.4s; }',
        '@keyframes devorbit-typing {',
        '  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }',
        '  40% { transform: scale(1); opacity: 1; }',
        '}',

        '/* Quick Actions */',
        '.devorbit-quick-actions {',
        '  padding: 10px 12px 6px; display: flex; flex-wrap: wrap; gap: 5px;',
        '  border-bottom: 1px solid #3F72AF; background: #F9F7F7;',
        '}',
        '.devorbit-quick-actions button {',
        '  padding: 5px 12px; border: 1px solid #3F72AF; border-radius: 16px;',
        '  background: #F9F7F7; font-size: 11px; cursor: pointer;',
        '  transition: all 0.2s; color: #3F72AF; font-weight: 500;',
        '  white-space: nowrap; line-height: 1.4;',
        '}',
        '.devorbit-quick-actions button:hover {',
        '  border-color: ' + this.config.primaryColor + '; color: ' + this.config.primaryColor + ';',
        '  background: rgba(63, 114, 175, 0.06);',
        '}',

        '/* Feedback */',
        '.devorbit-feedback {',
        '  display: flex; align-items: center; gap: 4px; margin-top: 6px;',
        '  padding: 4px 8px; background: rgba(63,114,175,0.06); border-radius: 8px;',
        '  font-size: 10px; color: #3F72AF; width: fit-content;',
        '}',
        '.devorbit-feedback button {',
        '  background: none; border: none; cursor: pointer; font-size: 13px;',
        '  padding: 1px 3px; transition: transform 0.15s; opacity: 0.5; line-height: 1;',
        '}',
        '.devorbit-feedback button:hover { transform: scale(1.25); opacity: 1; }',
        '.devorbit-feedback .feedback-thanks { color: #3F72AF; font-weight: 500; font-size: 11px; }',

        '/* Input */',
        '#devorbit-chat .chat-input {',
        '  padding: 10px 12px; border-top: 1px solid #3F72AF;',
        '  display: flex; gap: 8px; background: #F9F7F7; flex-shrink: 0;',
        '}',
        '#devorbit-chat .chat-input input {',
        '  flex: 1; border: 1px solid #3F72AF; border-radius: 20px;',
        '  padding: 9px 16px; font-size: 13.5px; outline: none;',
        '  transition: border-color 0.2s; font-family: inherit; background: #F9F7F7;',
        '}',
        '#devorbit-chat .chat-input input:focus { border-color: ' + this.config.primaryColor + '; background: #F9F7F7; box-shadow: 0 0 0 3px rgba(63,114,175,0.08); }',
        '#devorbit-chat .chat-input input::placeholder { color: #3F72AF; }',
        '#devorbit-chat .chat-input button {',
        '  width: 38px; height: 38px; border-radius: 50%; border: none;',
        '  background: ' + this.config.primaryColor + '; color: #F9F7F7; cursor: pointer;',
        '  display: flex; align-items: center; justify-content: center;',
        '  transition: background 0.2s; flex-shrink: 0;',
        '  font-size: 16px; align-self: flex-end;',
        '}',
        '#devorbit-chat .chat-input button:hover { background: #3F72AF; }',
        '#devorbit-chat .chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }',

        '/* Responsive */',
        '@media (max-width: 480px) {',
        '  #devorbit-chat {',
        '    width: calc(100vw - 16px); right: 8px; bottom: 8px;',
        '    height: calc(100vh - 16px); max-height: calc(100vh - 16px);',
        '    border-radius: 18px;',
        '  }',
        '  #devorbit-btn { bottom: 16px; right: 16px; width: 60px; height: 60px; }',
        '  #devorbit-bubble { right: 16px; bottom: 88px; max-width: calc(100vw - 32px); }',
        '}',
      ].join('\n');
      document.head.appendChild(css);
    },

    _buildDOM: function () {
      var self = this;

      var container = document.createElement('div');
      container.id = 'devorbit-widget';

      // Speech Bubble (greeting popup)
      var bubble = document.createElement('div');
      bubble.id = 'devorbit-bubble';
      bubble.innerHTML = [
        '<button class="bubble-close" id="devorbit-bubble-close">&times;</button>',
        '<div style="padding-right:14px">',
        '  <span id="devorbit-greeting">' + self._escapeHtml(self.config.greeting).replace(/\n/g, '<br>') + '</span>',
        '</div>',
      ].join('');
      container.appendChild(bubble);

      // Robot Button with GIF
      var btn = document.createElement('button');
      btn.id = 'devorbit-btn';
      btn.setAttribute('aria-label', 'Open DevOrbit AI Assistant');
      btn.innerHTML = '<img src="' + self._escapeHtml(self.config.robotGifUrl) + '" alt="DevOrbit AI Assistant" draggable="false">';
      container.appendChild(btn);

      // Quick Actions
      var quickActions = [
        { label: '\uD83D\uDE80 Our Services', value: 'What services does DevOrbit offer?' },
        { label: '\uD83D\uDCB0 Pricing', value: 'How much does DevOrbit charge for a website?' },
        { label: '\uD83C\uDF10 Web Development', value: 'What is DevOrbit\'s tech stack for web development?' },
        { label: '\uD83D\uDCF1 Mobile Apps', value: 'Does DevOrbit build mobile apps?' },
        { label: '\uD83E\uDD16 AI Solutions', value: 'What AI solutions does DevOrbit provide?' },
        { label: '\uD83D\uDCDE Contact Us', value: 'How can I contact DevOrbit?' },
        { label: '\uD83D\uDCC2 Portfolio', value: 'Can I see DevOrbit\'s portfolio?' },
      ];

      // Chat Panel
      var chat = document.createElement('div');
      chat.id = 'devorbit-chat';
      chat.innerHTML = [
        '<div class="chat-header" id="devorbit-chat-header">',
        '  <div class="header-logo">D</div>',
        '  <div class="info">',
        '    <h3>DevOrbit AI Assistant</h3>',
        '    <p id="devorbit-status">Online \u2014 Typically replies instantly</p>',
        '  </div>',
        '  <div class="header-actions">',
        '    <button class="header-btn" id="devorbit-chat-minimize" title="Minimize">\u2013</button>',
        '    <button class="header-btn" id="devorbit-chat-close" title="Close">&times;</button>',
        '  </div>',
        '</div>',
        '<div class="devorbit-quick-actions" id="devorbit-quick-actions">',
        quickActions.map(function (qa) {
          return '<button data-value="' + self._escapeHtml(qa.value) + '">' + qa.label + '</button>';
        }).join(''),
        '</div>',
        '<div class="chat-messages" id="devorbit-chat-messages"></div>',
        '<div class="chat-input">',
        '  <input type="text" id="devorbit-input" placeholder="Ask me about DevOrbit..." />',
        '  <button id="devorbit-send">\u27A4</button>',
        '</div>',
      ].join('');
      container.appendChild(chat);

      document.body.appendChild(container);

      // Refs
      self.btn = btn;
      self.bubble = bubble;
      self.chat = chat;
      self.messagesEl = document.getElementById('devorbit-chat-messages');
      self.inputEl = document.getElementById('devorbit-input');
      self.sendBtn = document.getElementById('devorbit-send');
      self.statusEl = document.getElementById('devorbit-status');
      self.quickActionsEl = document.getElementById('devorbit-quick-actions');

      // Greeting bubble: show after 3-5s on every page load
      var delay = 3000 + Math.random() * 2000;
      setTimeout(function () {
        bubble.classList.add('show');
      }, delay);

      // Restore chat history from session storage
      self._restoreHistory();

      // Events
      btn.addEventListener('click', function () { self.openChat(); });

      document.getElementById('devorbit-chat-minimize').addEventListener('click', function (e) {
        e.stopPropagation();
        self.closeChat();
      });
      document.getElementById('devorbit-chat-close').addEventListener('click', function (e) {
        e.stopPropagation();
        self.closeChat();
        // Clear greeted flag so greeting shows next session
        sessionStorage.removeItem('devorbit_greeted');
      });

      document.getElementById('devorbit-bubble-close').addEventListener('click', function (e) {
        e.stopPropagation();
        bubble.classList.remove('show');
      });

      self.sendBtn.addEventListener('click', function () { self.sendMessage(); });
      self.inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); self.sendMessage(); }
      });

      // Quick action buttons
      self.quickActionsEl.addEventListener('click', function (e) {
        var btnEl = e.target.closest('button');
        if (!btnEl) return;
        var val = btnEl.getAttribute('data-value');
        if (val) {
          self.inputEl.value = val;
          self.sendMessage();
        }
      });

      // Hide bubble when chat opens
      var observer = new MutationObserver(function () {
        if (chat.classList.contains('open')) {
          bubble.classList.remove('show');
        }
      });
      observer.observe(chat, { attributes: true, attributeFilter: ['class'] });
    },

    // ---------- Chat Logic ----------

    openChat: function () {
      // Restore history if previously saved
      this._restoreHistory();

      this.chat.classList.add('open');
      this.bubble.classList.remove('show');
      this.btn.style.display = 'none';

      if (this.messagesEl.children.length === 0) {
        this._addBotMessage(this.config.greeting);
      }

      setTimeout(function (self) {
        self.inputEl.focus();
      }, 400, this);

      this._scrollToBottom();
    },

    closeChat: function () {
      // Save history to session storage
      this._saveHistory();
      this.chat.classList.remove('open');
      this.btn.style.display = 'block';
    },

    sendMessage: function () {
      var text = this.inputEl.value.trim();
      if (!text) return;
      this.inputEl.value = '';
      this._addUserMessage(text);
      this._processQuestion(text);
    },

    _addUserMessage: function (text) {
      var div = document.createElement('div');
      div.className = 'devorbit-msg user';
      div.innerHTML = '<div class="avatar">U</div><div class="bubble">' + this._escapeHtml(text) + '</div>';
      this.messagesEl.appendChild(div);
      this._saveHistory();
      this._scrollToBottom();
    },

    _addBotMessage: function (text, confidence) {
      var div = document.createElement('div');
      div.className = 'devorbit-msg bot';

      var avatarHtml = '<div class="avatar"><img src="' + this._escapeHtml(this.config.robotGifUrl) + '" alt="Bot"></div>';
      var bubble = '<div class="bubble">' + this._escapeHtml(text).replace(/\n/g, '<br>');

      if (confidence !== undefined) {
        var cls = confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low';
        bubble += '<div class="confidence ' + cls + '">' + confidence + '% match</div>';
      }

      bubble += '</div>';
      div.innerHTML = avatarHtml + bubble;
      this.messagesEl.appendChild(div);
      this._saveHistory();
      this._scrollToBottom();
    },

    _addLeadGeneration: function () {
      var self = this;
      var div = document.createElement('div');
      div.className = 'devorbit-msg bot';
      div.innerHTML = [
        '<div class="avatar"><img src="' + this._escapeHtml(this.config.robotGifUrl) + '" alt="Bot"></div>',
        '<div class="bubble">',
        '  <div class="devorbit-lead">',
        '    <strong>Would you like to share your project requirements?</strong>',
        '    Our team can provide a free consultation and custom quote tailored to your needs.',
        '    <br><br>',
        '    <button class="lead-btn" id="devorbit-lead-btn">Get Free Consultation \u2192</button>',
        '  </div>',
        '</div>',
      ].join('');
      this.messagesEl.appendChild(div);
      this._saveHistory();
      this._scrollToBottom();

      setTimeout(function () {
        var leadBtn = document.getElementById('devorbit-lead-btn');
        if (leadBtn) {
          leadBtn.addEventListener('click', function () {
            self._addBotMessage('Great! You can reach us at hello@devorbit.com or call +1 (555) 123-4567. Our team typically responds within 24 hours. You can also schedule a free consultation directly through our Calendly link.');
          });
        }
      }, 100);
    },

    _addTypingIndicator: function () {
      var div = document.createElement('div');
      div.className = 'devorbit-msg bot';
      div.id = 'devorbit-typing-indicator';
      div.innerHTML = [
        '<div class="avatar"><img src="' + this._escapeHtml(this.config.robotGifUrl) + '" alt="Bot"></div>',
        '<div class="bubble devorbit-typing"><span></span><span></span><span></span></div>',
      ].join('');
      this.messagesEl.appendChild(div);
      this._scrollToBottom();
    },

    _removeTypingIndicator: function () {
      var el = document.getElementById('devorbit-typing-indicator');
      if (el) el.remove();
    },

    _addFeedback: function (question, answer) {
      var self = this;
      var div = document.createElement('div');
      div.className = 'devorbit-msg bot';
      var feedbackId = 'devorbit-fb-' + Date.now();
      div.innerHTML = [
        '<div class="avatar"></div>',
        '<div class="bubble">',
        '  <div class="devorbit-feedback" id="' + feedbackId + '">',
        '    <span>Helpful?</span>',
        '    <button data-value="yes" title="Yes">\u{1F44D}</button>',
        '    <button data-value="no" title="No">\u{1F44E}</button>',
        '  </div>',
        '</div>',
      ].join('');
      this.messagesEl.appendChild(div);
      this._scrollToBottom();

      setTimeout(function () {
        var fb = document.getElementById(feedbackId);
        if (!fb) return;
        var buttons = fb.querySelectorAll('button');
        buttons.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var val = btn.getAttribute('data-value');
            self._saveFeedback(question, answer, val === 'yes');
            fb.innerHTML = '<span class="feedback-thanks">Thanks for your feedback!</span>';
            buttons.forEach(function (b) { b.disabled = true; });
          });
        });
      }, 100);
    },

    _processQuestion: function (text) {
      var self = this;
      self._addTypingIndicator();
      self.statusEl.textContent = 'Thinking...';

      self._tryChatAPI(text);
    },

    _isFallbackResponse: function (answer) {
      var lower = (answer || '').toLowerCase();
      var fallbackPhrases = [
        "couldn't find that information",
        "could not find that information",
        "don't have information about that",
        "contact our support team",
        "contact the devorbit team",
        "not in our knowledge base",
        "not in our documents",
      ];
      for (var i = 0; i < fallbackPhrases.length; i++) {
        if (lower.indexOf(fallbackPhrases[i]) !== -1) return true;
      }
      return false;
    },

    _tryChatAPI: function (text) {
      var self = this;

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, user_id: 'web-visitor' }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Chat API unavailable');
          return res.json();
        })
        .then(function (data) {
          self._removeTypingIndicator();
          self.statusEl.textContent = 'Online \u2014 Typically replies instantly';
          self.history.push({ role: 'user', content: text });
          self.history.push({ role: 'assistant', content: data.reply || data.answer });
          self._addBotMessage(data.reply || data.answer);
          if (self.config.feedbackEnabled) {
            self._addFeedback(text, data.reply || data.answer);
          }
          self._scrollToBottom();
        })
        .catch(function () {
          self._tryDocBot(text);
        });
    },

    _tryDocBot: function (text) {
      var self = this;
      var docBotUrl = self.config.docbotUrl || 'http://localhost:8000';

      fetch(docBotUrl + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: self.history }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('DocBot unavailable');
          return res.json();
        })
        .then(function (data) {
          if (self._isFallbackResponse(data.answer)) {
            throw new Error('DocBot returned fallback');
          }
          self._removeTypingIndicator();
          self.statusEl.textContent = 'Online \u2014 Typically replies instantly';
          self.history.push({ role: 'user', content: text });
          self.history.push({ role: 'assistant', content: data.answer });
          self._addBotMessage(data.answer);
          if (self.config.feedbackEnabled) {
            self._addFeedback(text, data.answer);
          }
          self._scrollToBottom();
        })
        .catch(function () {
          self._fallbackToLocal(text);
        });
    },

    _fallbackToLocal: function (text) {
      var self = this;
      self.statusEl.textContent = 'Online \u2014 Typically replies instantly';

      self._removeTypingIndicator();

      var match = self._findBestMatch(text);

      if (match && match.isProjectInterest) {
        self._addBotMessage('I see you\u2019re interested in starting a project with DevOrbit! That\u2019s exciting. We\u2019d love to learn more about your idea.');
        self._addLeadGeneration();
      } else if (match) {
        self._addBotMessage(match.answer, match.confidence);
        if (self.config.feedbackEnabled) {
          self._addFeedback(text, match.answer);
        }
      } else {
        var fallbackText = 'I couldn\u2019t find that information. Please contact us at devorbitsoftsolutions@gmail.com or reach out on WhatsApp for assistance.';
        self._addBotMessage(fallbackText);
      }
      self._scrollToBottom();
    },

    // ---------- Session History ----------

    _saveHistory: function () {
      var self = this;
      var messages = [];
      var els = self.messagesEl.querySelectorAll('.devorbit-msg');
      els.forEach(function (el) {
        var isBot = el.classList.contains('bot');
        var bubble = el.querySelector('.bubble');
        if (!bubble) return;
        // Get text content, remove confidence badge text
        var text = bubble.childNodes[0] ? (bubble.childNodes[0].textContent || bubble.textContent) : bubble.textContent;
        messages.push({ role: isBot ? 'bot' : 'user', text: text.trim() });
      });
      try {
        sessionStorage.setItem('devorbit_history', JSON.stringify(messages));
      } catch (e) {}
    },

    _restoreHistory: function () {
      var self = this;
      try {
        var stored = sessionStorage.getItem('devorbit_history');
        if (!stored) return;
        var messages = JSON.parse(stored);
        if (!Array.isArray(messages)) return;
        // Clear any existing messages
        self.messagesEl.innerHTML = '';
        messages.forEach(function (msg) {
          if (msg.role === 'user') {
            self._addUserMessage(msg.text);
          } else if (msg.role === 'bot') {
            self._addBotMessage(msg.text);
          }
        });
      } catch (e) {
        // ignore parse errors
      }
    },

    _scrollToBottom: function () {
      var self = this;
      requestAnimationFrame(function () {
        self.messagesEl.scrollTop = self.messagesEl.scrollHeight;
      });
    },

    _escapeHtml: function (text) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(text));
      return div.innerHTML;
    },
  };

  // Auto-init
  if (window.DevOrbitBotConfig) {
    DevOrbitBot.init(window.DevOrbitBotConfig);
  } else {
    var script = document.currentScript;
    if (script) {
      var config = {};
      var db = script.getAttribute('data-db');
      if (db) config.databaseUrl = db;
      var site = script.getAttribute('data-site');
      if (site) config.siteName = site;
      var gif = script.getAttribute('data-gif');
      if (gif) config.robotGifUrl = gif;
      var color = script.getAttribute('data-color');
      if (color) config.primaryColor = color;
      DevOrbitBot.init(Object.keys(config).length ? config : undefined);
    } else {
      DevOrbitBot.init();
    }
  }

  window.DevOrbitBot = DevOrbitBot;
})();
