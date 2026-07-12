(function () {
  const SVGS = {
    MUTE: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
    UNMUTE: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12"></path><path d="M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 11a6.9 6.9 0 0 1-1.18 3.82"></path><path d="M19.07 13.41A7 7 0 0 1 5 12v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
    SHARE: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    SCREEN: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    CAM: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2 2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`
  };

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Web Audio Context for PTT Synthesized sound effects
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playPTTOnSound() {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.error('Failed to play PTT ON sound:', e);
    }
  }

  function playPTTOffSound() {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error('Failed to play PTT OFF sound:', e);
    }
  }

  // Simple and secure markdown parser
  function parseMarkdown(text) {
    if (!text) return '';
    let escaped = escapeHTML(text);
    
    // Code blocks: ```code```
    escaped = escaped.replace(/```([\s\S]+?)```/g, '<pre class="chat-code-block"><code>$1</code></pre>');
    
    // Inline code: `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
    
    // Bold: **text**
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text*
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    return escaped;
  }

  function showLobbyError(message) {
    const container = document.querySelector('.join-container');
    if (!container) return;

    let errorBox = container.querySelector('.custom-lobby-error');
    if (!errorBox) {
      errorBox = document.createElement('div');
      errorBox.className = 'custom-lobby-error';
      errorBox.style.border = '1px solid #ff4444';
      errorBox.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
      errorBox.style.padding = '10px';
      errorBox.style.marginBottom = '15px';
      errorBox.style.fontSize = '11px';
      errorBox.style.color = '#ff4444';
      errorBox.style.letterSpacing = '1px';
      errorBox.style.fontWeight = '700';
      errorBox.style.fontFamily = 'var(--font-mono)';
      container.insertBefore(errorBox, container.firstChild);
    }
    errorBox.textContent = '! ' + message.toUpperCase();
    errorBox.style.display = 'block';
  }

  function hideLobbyError() {
    const errorBox = document.querySelector('.custom-lobby-error');
    if (errorBox) {
      errorBox.style.display = 'none';
    }
  }

  // Open Image Lightbox
  function openLightbox(src) {
    let lightbox = document.getElementById('chat-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'chat-lightbox';
      lightbox.innerHTML = `
        <div class="lightbox-close">&times;</div>
        <img class="lightbox-content" src="" alt="Lightbox View">
      `;
      document.body.appendChild(lightbox);
      lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
      });
    }
    const img = lightbox.querySelector('.lightbox-content');
    img.src = src;
    lightbox.classList.add('active');
  }

  let livekitListenersAttached = false;
  let unreadMessageCount = 0;

  // Helper: is participant's microphone muted?
  function isParticipantMuted(participant) {
    if (!participant) return false;
    if (typeof participant.isMicrophoneEnabled === 'boolean') {
      return !participant.isMicrophoneEnabled;
    }
    if (participant.audioTrackPublications) {
      for (const [, pub] of participant.audioTrackPublications) {
        if (pub.isMuted) return true;
      }
      return false;
    }
    if (typeof participant.isMuted === 'boolean') return participant.isMuted;
    return false;
  }

  // Setup LiveKit speaking/mute event listeners
  function setupLivekitSpeakingListeners() {
    const room = window.livekitRoom;
    if (!room || livekitListenersAttached) return;
    livekitListenersAttached = true;

    const local = room.localParticipant;

    // Local participant speaking
    local.on('isSpeakingChanged', (speaking) => {
      updateDot(local.identity, speaking, isParticipantMuted(local));
    });

    // Local participant mute/unmute
    local.on('trackMuted', (pub) => {
      if (pub && pub.kind !== 'audio') return;
      updateDot(local.identity, false, true);
      updateHeaderStatus();
      playPTTOffSound();
    });

    local.on('trackUnmuted', (pub) => {
      if (pub && pub.kind !== 'audio') return;
      updateDot(local.identity, local.isSpeaking || false, false);
      updateHeaderStatus();
      playPTTOnSound();
    });

    local.on('localTrackPublished', () => {
      updateDot(local.identity, local.isSpeaking || false, isParticipantMuted(local));
      updateHeaderStatus();
    });

    // Remote participants
    const attachRemote = (participant) => {
      participant.on('isSpeakingChanged', (speaking) => {
        updateDot(participant.identity, speaking, isParticipantMuted(participant));
      });
      participant.on('trackMuted', (pub) => {
        if (pub && pub.kind !== 'audio') return;
        updateDot(participant.identity, false, true);
      });
      participant.on('trackUnmuted', (pub) => {
        if (pub && pub.kind !== 'audio') return;
        updateDot(participant.identity, participant.isSpeaking || false, false);
      });
    };

    room.on('participantConnected', attachRemote);

    const remotes = room.remoteParticipants || room.participants;
    if (remotes) {
      if (typeof remotes.forEach === 'function') {
        remotes.forEach(attachRemote);
      } else if (remotes instanceof Map) {
        remotes.forEach(attachRemote);
      }
    }
  }

  function updateDot(identity, isSpeaking, isMuted) {
    const dot = document.querySelector(`[data-identity="${identity}"] .status-dot`);
    if (!dot) return;
    dot.className = 'status-dot';
    
    if (isMuted) {
      dot.classList.add('muted');
    } else if (isSpeaking) {
      dot.classList.add('speaking');
    } else {
      dot.classList.add('idle');
    }

    // Highlight active speaker item in user list
    const userItem = document.querySelector(`.participant-item[data-identity="${identity}"]`);
    if (userItem) {
      if (isSpeaking && !isMuted) {
        userItem.classList.add('speaking-active');
      } else {
        userItem.classList.remove('speaking-active');
      }
    }

    // Highlight active speaker tile in video stream grid
    const videoEl = document.querySelector(`.stream-video[data-participant="${identity}"]`);
    if (videoEl) {
      const tile = videoEl.closest('.video-tile');
      if (tile) {
        if (isSpeaking && !isMuted) {
          tile.classList.add('speaking-active');
        } else {
          tile.classList.remove('speaking-active');
        }
      }
    }
  }

  // Update participant items DOM structures and map identity attributes
  function updateCustomSpeakingDots() {
    const room = window.livekitRoom;
    if (!room) return;

    setupLivekitSpeakingListeners();

    const items = document.querySelectorAll('.participant-item');
    items.forEach(item => {
      item.querySelectorAll('.speaking-indicator, .muted-indicator, .speaking-waveform').forEach(el => {
        el.style.display = 'none';
      });

      const nameSpan = item.querySelector('.participant-name');
      if (!nameSpan) return;

      const nameText = nameSpan.textContent.toUpperCase();

      let participant = null;
      if (nameText.includes('(YOU)')) {
        participant = room.localParticipant;
      } else {
        const remotes = room.remoteParticipants || room.participants;
        if (remotes) {
          remotes.forEach(p => {
            if (nameText.includes((p.identity || '').toUpperCase())) {
              participant = p;
            }
          });
        }
      }

      if (participant) {
        if (item.getAttribute('data-identity') !== participant.identity) {
          item.setAttribute('data-identity', participant.identity);
        }

        let dot = item.querySelector('.status-dot');
        if (!dot) {
          dot = document.createElement('span');
          dot.className = 'status-dot idle';
          nameSpan.parentNode.insertBefore(dot, nameSpan);
        }

        const muted = isParticipantMuted(participant);
        updateDot(participant.identity, participant.isSpeaking || false, muted);
      }
    });
  }

  // Header connection status container and pills
  function updateHeaderStatus() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let statusContainer = header.querySelector('.header-status-container');
    if (!statusContainer) {
      statusContainer = document.createElement('div');
      statusContainer.className = 'header-status-container';
      header.appendChild(statusContainer);
    }

    const inRoom = !!document.querySelector('.room-layout');
    const room = window.livekitRoom;
    const isConnected = inRoom && room && room.state === 'connected';
    const roomName = isConnected ? escapeHTML(room.name.toUpperCase()) : 'NO ROOM';

    const isMuted = isConnected && room.localParticipant ? isParticipantMuted(room.localParticipant) : false;
    const muteText = isConnected ? (isMuted ? 'MUTED' : 'UNMUTED') : 'MUTED';
    const muteClass = isConnected ? (isMuted ? 'status-pill muted-pill' : 'status-pill unmuted-pill') : 'status-pill muted-pill';

    const connState = isConnected ? 'CONNECTED' : 'DISCONNECTED';
    const connClass = isConnected ? 'status-pill conn-pill connected' : 'status-pill conn-pill disconnected';

    let latencyHtml = '';
    if (isConnected) {
      let rtt = null;
      try {
        rtt = room.engine && room.engine.client && room.engine.client.rtt;
        if (!rtt) {
          const remotes = room.remoteParticipants || room.participants;
          if (remotes) {
            remotes.forEach(p => {
              if (!rtt && p.connectionQuality) {
                const q = p.connectionQuality;
                if (q === 'excellent') rtt = 20;
                else if (q === 'good') rtt = 60;
                else if (q === 'poor') rtt = 150;
              }
            });
          }
        }
      } catch (e) { }
      const latencyText = rtt ? `LATENCY: ${Math.round(rtt)}ms` : 'LATENCY: --';
      latencyHtml = `<div class="status-pill latency-pill">${latencyText}</div>`;
    }

    statusContainer.innerHTML = `
      <div class="status-pill room-pill">ROOM: ${roomName}</div>
      <div class="${muteClass}">
        <span class="status-dot">●</span> ${muteText}
      </div>
      ${latencyHtml}
      <div class="${connClass}">
        <span class="status-dot">●</span> ${connState}
      </div>
    `;
  }

  // Update notification badges for Chat/Streams on bottom bar
  function updateNotificationBadges() {
    const nav = document.querySelector('.mobile-nav-bar');
    if (!nav) return;

    const chatTab = nav.querySelector('.nav-tab[data-target="chat"]');
    if (chatTab) {
      let badge = chatTab.querySelector('.nav-badge');
      if (unreadMessageCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'nav-badge chat-badge';
          chatTab.appendChild(badge);
        }
        badge.textContent = unreadMessageCount;
      } else if (badge) {
        badge.remove();
      }
    }

    const streamsTab = nav.querySelector('.nav-tab[data-target="streams"]');
    if (streamsTab) {
      let badge = streamsTab.querySelector('.nav-badge');
      const videos = document.querySelectorAll('.stream-video');
      const streamsCount = videos.length;

      if (streamsCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'nav-badge streams-badge-red';
          streamsTab.appendChild(badge);
        }
        badge.textContent = streamsCount;
      } else if (badge) {
        badge.remove();
      }
    }
  }

  // Mobile Bottom Navigation Bar
  function initMobileNav() {
    if (document.querySelector('.mobile-nav-bar')) return;

    const nav = document.createElement('div');
    nav.className = 'mobile-nav-bar';
    nav.innerHTML = `
      <button class="nav-tab active" data-target="voice">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        <span>VOICE</span>
      </button>
      <button class="nav-tab" data-target="streams">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
        <span>STREAMS</span>
      </button>
      <button class="nav-tab" data-target="chat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <span>CHAT</span>
      </button>
    `;

    document.body.appendChild(nav);

    const tabs = nav.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.getAttribute('data-target');
        document.body.setAttribute('data-active-tab', target);

        if (target === 'chat') {
          unreadMessageCount = 0;
        }
        updateNotificationBadges();
      });
    });

    document.body.setAttribute('data-active-tab', 'voice');
    updateNotificationBadges();
  }

  // Format Control buttons with SVGs
  function enhanceVoiceControls() {
    const controls = document.querySelector('.controls-bar.compact');
    if (!controls) return;

    const btns = controls.querySelectorAll('.control-btn');
    btns.forEach(btn => {
      if (btn.classList.contains('formatted-btn')) return;

      const txt = btn.textContent.trim().toUpperCase();
      if (txt === 'MUTE' || txt === 'UNMUTE') {
        btn.classList.add('formatted-btn', 'btn-mute');
        btn.innerHTML = `${txt === 'MUTE' ? SVGS.UNMUTE : SVGS.MUTE}<span class="btn-label">${txt}</span>`;
      } else if (txt === 'SHARE') {
        btn.classList.add('formatted-btn', 'btn-share');
        btn.innerHTML = `${SVGS.SHARE}<span class="btn-label">INVITE</span>`;
      } else if (txt === 'SCREEN') {
        btn.classList.add('formatted-btn', 'btn-screen');
        btn.innerHTML = `${SVGS.SCREEN}<span class="btn-label">SCREEN</span>`;
      } else if (txt === 'CAM') {
        btn.classList.add('formatted-btn', 'btn-cam');
        btn.innerHTML = `${SVGS.CAM}<span class="btn-label">CAM</span>`;
      }
    });
  }

  // Video Grid and Overlay Titles
  function wrapVideos() {
    const container = document.getElementById('streams-container');
    if (!container) return;

    const videos = container.querySelectorAll('.stream-video:not(.wrapped)');
    videos.forEach(video => {
      video.classList.add('wrapped');

      const wrapper = document.createElement('div');
      wrapper.className = 'video-tile';
      const isScreenShare = video.getAttribute('data-source') === 'screen_share';
      if (isScreenShare) {
        wrapper.classList.add('screen-share-tile');
      }

      video.parentNode.insertBefore(wrapper, video);
      wrapper.appendChild(video);

      const label = document.createElement('div');
      label.className = 'video-label';
      const participantName = video.getAttribute('data-participant') || 'USER';
      if (isScreenShare) {
        label.innerHTML = `${escapeHTML(participantName.toUpperCase())} <span class="video-label-badge">SCREEN</span>`;
      } else {
        label.textContent = participantName.toUpperCase();
      }
      wrapper.appendChild(label);

      wrapper.addEventListener('click', () => {
        container.querySelectorAll('.video-tile').forEach(tile => {
          if (tile !== wrapper) {
            tile.classList.remove('active-tile');
          }
        });
        wrapper.classList.toggle('active-tile');
      });
    });

    const wrappers = container.querySelectorAll('.video-tile');
    wrappers.forEach(wrapper => {
      if (!wrapper.querySelector('.stream-video')) {
        wrapper.remove();
      }
    });
  }

  // Update Streams Count Badge
  function updateStreamsCount() {
    const container = document.getElementById('streams-container');
    const cardHeader = document.querySelector('.streams-card .card-header');
    if (!container || !cardHeader) return;

    const videos = container.querySelectorAll('.stream-video');
    let badge = cardHeader.querySelector('.streams-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'streams-badge';
      cardHeader.appendChild(badge);
    }
    badge.textContent = `STREAMS: ${videos.length}`;

    const placeholder = document.getElementById('stream-placeholder');
    if (placeholder) {
      if (videos.length > 0) {
        placeholder.style.setProperty('display', 'none', 'important');
      } else {
        placeholder.style.setProperty('display', '', '');
      }
    }
  }

  // Character Counter & Hints
  function initInputEnhancements(form) {
    const existingHints = form.parentNode.querySelectorAll('.chat-input-hint');
    existingHints.forEach(h => h.remove());
    
    const existingCounters = form.parentNode.querySelectorAll('.chat-char-counter');
    existingCounters.forEach(c => c.remove());

    const input = form.querySelector('.chat-input');
    if (!input) return;

    const hint = document.createElement('div');
    hint.className = 'chat-input-hint';
    hint.textContent = 'ENTER TO SEND, SHIFT+ENTER FOR NEW LINE';
    form.parentNode.appendChild(hint);

    const counter = document.createElement('div');
    counter.className = 'chat-char-counter';
    form.parentNode.appendChild(counter);

    input.addEventListener('input', () => {
      const len = input.value.length;
      if (len > 400) {
        counter.textContent = `${len} / 500`;
        counter.classList.add('visible');
        if (len >= 500) {
          counter.classList.add('limit-reached');
        } else {
          counter.classList.remove('limit-reached');
        }
      } else {
        counter.classList.remove('visible');
      }
    });
  }

  // File Upload Button Injection & File Handler
  function initUploadButton(form) {
    if (form.querySelector('.upload-btn')) return;

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'upload-btn';
    uploadBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
      </svg>
    `;
    uploadBtn.title = 'Upload Image or File';

    form.insertBefore(uploadBtn, form.firstChild);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.accept = 'image/*,application/pdf,text/plain,text/markdown,application/zip,audio/*,video/*';
    document.body.appendChild(fileInput);

    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      uploadBtn.disabled = true;
      uploadBtn.classList.add('uploading');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload failed');
        }

        const data = await res.json();
        const chatInput = form.querySelector('.chat-input');
        if (chatInput) {
          chatInput.value = `UPLOADED_FILE: ${data.url}`;

          const tracker = chatInput._valueTracker;
          if (tracker) {
            tracker.setValue('');
          }
          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      } catch (err) {
        alert('Upload Error: ' + err.message);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.classList.remove('uploading');
        fileInput.value = '';
      }
    });
  }

  // Dynamic Password Input injection on Lobby Screen
  function injectPasswordInput() {
    const form = document.querySelector('.lobby-form');
    if (!form || form.querySelector('#password-input')) return;

    const roomInputWrapper = form.querySelector('.input-wrapper:nth-child(2)');
    if (!roomInputWrapper) return;

    const passwordWrapper = document.createElement('div');
    passwordWrapper.className = 'input-wrapper password-input-wrapper';
    passwordWrapper.style.marginTop = '15px';
    passwordWrapper.style.marginBottom = '15px';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'password-input';
    passwordInput.placeholder = 'ROOM PASSWORD (OPTIONAL)';
    passwordInput.style.width = '100%';
    
    passwordWrapper.appendChild(passwordInput);

    // Insert it cleanly before the room input wrapper
    form.insertBefore(passwordWrapper, roomInputWrapper);
  }

  // Process and style Chat Messages (Local/Remote borders, Lightbox, Clean attachments)
  function processMessages() {
    // 1. Convert UPLOADED_FILE text to custom previews
    const messageTexts = document.querySelectorAll('.message-text:not(.processed)');
    messageTexts.forEach(el => {
      const text = el.textContent || '';
      if (text.startsWith('UPLOADED_FILE: ')) {
        el.classList.add('processed');
        const fileUrl = text.replace('UPLOADED_FILE: ', '').trim();
        const filename = fileUrl.split('/').pop();

        const cleanName = filename.replace(/-[0-9]+-[0-9]+(\.[a-z0-9]+)$/i, '$1');
        const ext = filename.split('.').pop().toLowerCase();
        const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
        const isAudio = ['mp3', 'wav', 'ogg', 'aac'].includes(ext);
        const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);

        const container = document.createElement('div');
        container.className = 'file-preview-container';

        if (isImage) {
          const img = document.createElement('img');
          img.src = fileUrl;
          img.alt = cleanName;
          img.className = 'chat-preview-image';
          img.title = 'Click to open fullscreen';
          img.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightbox(fileUrl);
          });
          container.appendChild(img);
        } else if (isAudio) {
          const audio = document.createElement('audio');
          audio.src = fileUrl;
          audio.controls = true;
          audio.className = 'chat-preview-audio';
          container.appendChild(audio);
        } else if (isVideo) {
          const video = document.createElement('video');
          video.src = fileUrl;
          video.controls = true;
          video.className = 'chat-preview-video';
          container.appendChild(video);
        } else {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.target = '_blank';
          link.className = 'chat-preview-file-link';
          link.innerHTML = `
            <span class="file-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </span>
            <span class="file-name"></span>
            <span class="file-download-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="8 17 12 21 16 17"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.88 18.04A5.9 5.9 0 0 0 18 17H6a5.9 5.9 0 0 0-2.88 1.04"></path>
              </svg>
            </span>
          `;
          const fileNameSpan = link.querySelector('.file-name');
          fileNameSpan.textContent = cleanName;
          fileNameSpan.title = cleanName;
          link.addEventListener('click', (e) => {
            e.stopPropagation();
          });
          container.appendChild(link);
        }

        el.textContent = '';
        el.appendChild(container);
      }
    });

    // 2. Add classes for local vs remote messages and count unread messages
    const activeTab = document.body.getAttribute('data-active-tab');
    const messages = document.querySelectorAll('.message-item');
    messages.forEach(msg => {
      let isLocal = msg.classList.contains('message-local');

      if (msg.classList.contains('styled-msg') && !isLocal) {
        const senderSpan = msg.querySelector('.message-sender');
        if (senderSpan) {
          const senderText = senderSpan.textContent.trim().replace(/:$/, '').toUpperCase();
          const room = window.livekitRoom;
          if (room && room.localParticipant && room.localParticipant.identity) {
            const localIdentity = room.localParticipant.identity.toUpperCase();
            if (senderText === localIdentity) {
              msg.classList.remove('message-remote');
              msg.classList.add('message-local');
              isLocal = true;
            }
          }
        }
        return;
      }

      if (msg.classList.contains('styled-msg')) return;
      msg.classList.add('styled-msg');

      const senderSpan = msg.querySelector('.message-sender');
      if (senderSpan) {
        const senderText = senderSpan.textContent.trim().replace(/:$/, '').toUpperCase();
        if (senderText.includes('YOU')) {
          isLocal = true;
        }
        const room = window.livekitRoom;
        if (room && room.localParticipant && room.localParticipant.identity) {
          const localIdentity = room.localParticipant.identity.toUpperCase();
          if (senderText === localIdentity) {
            isLocal = true;
          }
        }

        if (isLocal) {
          msg.classList.add('message-local');
        } else {
          msg.classList.add('message-remote');
        }
      }

      if (!isLocal && activeTab !== 'chat') {
        unreadMessageCount++;
      }
    });

    // 3. Process and clean reply/quote blocks safely
    const replyPreviews = document.querySelectorAll('.reply-preview:not(.processed)');
    replyPreviews.forEach(el => {
      el.classList.add('processed');

      const rawText = el.textContent || '';
      const match = rawText.match(/^@([^:]+):\s*(.*)$/);
      if (match) {
        const sender = match[1];
        let replyText = match[2].trim();

        let fileUrl = '';
        let hasFileAttachment = false;
        if (replyText.includes('UPLOADED_FILE:')) {
          const cleanTextToFind = replyText.replace('UPLOADED_FILE: ', '').replace('...', '').trim();
          const originalMsg = Array.from(document.querySelectorAll('.message-text')).find(orig => {
            const txt = orig.textContent || '';
            return txt.includes('UPLOADED_FILE:') && txt.includes(cleanTextToFind);
          });

          if (originalMsg) {
            const img = originalMsg.querySelector('.chat-preview-image');
            if (img) fileUrl = img.src;
          }

          if (fileUrl) {
            replyText = 'Image Attachment';
          } else {
            hasFileAttachment = true;
            replyText = 'File Attachment';
          }
        }

        if (replyText.length > 40) {
          replyText = replyText.substring(0, 40) + '...';
        }

        el.innerHTML = '';
        
        const senderSpan = document.createElement('span');
        senderSpan.className = 'reply-sender';
        senderSpan.textContent = `@${sender}`;
        
        const separatorNode = document.createTextNode(': ');
        
        const bodySpan = document.createElement('span');
        bodySpan.className = 'reply-body-text';
        bodySpan.textContent = replyText;
        
        el.appendChild(senderSpan);
        el.appendChild(separatorNode);
        el.appendChild(bodySpan);

        if (fileUrl) {
          const img = document.createElement('img');
          img.src = fileUrl;
          img.style.maxHeight = '20px';
          img.style.maxWidth = '40px';
          img.style.objectFit = 'contain';
          img.style.verticalAlign = 'middle';
          img.style.marginLeft = '6px';
          img.style.borderRadius = '2px';
          img.style.border = '1px solid var(--border-color)';
          el.appendChild(img);
        } else if (hasFileAttachment) {
          const fileIconSpan = document.createElement('span');
          fileIconSpan.style.verticalAlign = 'middle';
          fileIconSpan.style.marginLeft = '4px';
          fileIconSpan.style.display = 'inline-flex';
          fileIconSpan.style.alignItems = 'center';
          fileIconSpan.style.color = 'var(--accent-color)';
          fileIconSpan.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
          el.appendChild(fileIconSpan);
        }
      }
    });

    // 4. Securely render markdown messages
    const plainMessageTexts = document.querySelectorAll('.message-text:not(.processed):not(.md-processed)');
    plainMessageTexts.forEach(el => {
      const text = el.textContent || '';
      if (!text.startsWith('UPLOADED_FILE: ')) {
        el.classList.add('md-processed');
        el.innerHTML = parseMarkdown(text);
      }
    });
  }

  // Observe DOM modifications to inject hooks safely
  const observer = new MutationObserver(() => {
    observer.disconnect();

    try {
      const form = document.querySelector('.chat-input-wrapper');
      const inRoom = !!document.querySelector('.room-layout');

      if (inRoom) {
        document.body.classList.add('in-room');
        initMobileNav();
        updateHeaderStatus();
        wrapVideos();
        updateStreamsCount();
        enhanceVoiceControls();
        updateCustomSpeakingDots();
        updateNotificationBadges();

        if (form) {
          initUploadButton(form);
          initInputEnhancements(form);
        }
      } else {
        document.body.classList.remove('in-room');
        document.body.removeAttribute('data-active-tab');
        const nav = document.querySelector('.mobile-nav-bar');
        if (nav) nav.remove();
        injectPasswordInput();
        updateHeaderStatus();

        const lobbyForm = document.querySelector('.lobby-form');
        if (lobbyForm && !lobbyForm.hasAttribute('data-pwd-hook')) {
          lobbyForm.setAttribute('data-pwd-hook', 'true');
          
          let verificationInFlight = false;
          let isVerified = false;

          lobbyForm.addEventListener('submit', async (e) => {
            if (isVerified) {
              return; // Let React submit handle it
            }

            e.preventDefault();
            e.stopPropagation();

            if (verificationInFlight) return;

            const roomInput = lobbyForm.querySelector('#room-input');
            const nameInput = lobbyForm.querySelector('#name-input');
            const pwdInput = lobbyForm.querySelector('#password-input');
            const submitBtn = lobbyForm.querySelector('#join-btn');

            if (!roomInput || !nameInput || !submitBtn) return;

            const roomVal = roomInput.value.trim();
            const nameVal = nameInput.value.trim();
            const pwdVal = pwdInput ? pwdInput.value : '';

            if (!roomVal || !nameVal) {
              showLobbyError('FIELDS CANNOT BE EMPTY.');
              return;
            }

            let cleanRoom = roomVal;
            try {
              if (cleanRoom.startsWith('http')) {
                const pathPart = new URL(cleanRoom).pathname.split('/').filter(Boolean).pop();
                if (pathPart) cleanRoom = pathPart;
              }
            } catch (err) {}

            hideLobbyError();
            verificationInFlight = true;
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.textContent || '+';
            submitBtn.textContent = '...';

            try {
              const res = await fetch(`/api/token?room=${encodeURIComponent(cleanRoom)}&identity=${encodeURIComponent(nameVal)}&password=${encodeURIComponent(pwdVal)}`);
              
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to authenticate room.');
              }

              sessionStorage.setItem('room_pwd_' + cleanRoom, pwdVal);
              isVerified = true;
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
              
              // Programmatically trigger React submit
              lobbyForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            } catch (err) {
              showLobbyError(err.message);
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
              verificationInFlight = false;
            }
          });
        }
      }
      processMessages();
    } catch (e) {
      console.error("Error in MaltasConnect observer callback:", e);
    } finally {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  document.addEventListener('click', (e) => {
    const leaveBtn = e.target.closest('.back-btn');
    if (leaveBtn) {
      const roomName = window.livekitRoom ? window.livekitRoom.name : null;
      if (roomName) {
        sessionStorage.removeItem('room_pwd_' + roomName);
      } else {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('room_pwd_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
    }
  });

  setInterval(() => {
    const inRoom = !!document.querySelector('.room-layout');
    if (inRoom) {
      updateHeaderStatus();
    }
  }, 5000);

})();