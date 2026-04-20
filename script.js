/**
 * Cobby Card – script.js
 * COB Meet & Greet 2026 Digital Pass Application
 * Fixed: chip selection, form submit, navigation, avatar generation
 */

'use strict';

// =============================================
// SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL  = 'https://eaelzwhfxtyhcqzcvhki.supabase.co';
const SUPABASE_ANON = 'sb_publishable_EqGsGjUoJ4Db-T-MMHcGFw_L5W-HiDO';

// =============================================
// STATE
// =============================================
let supabaseClient = null;
const attendees    = [];
let selectedTrack  = '';
let currentCardData = null;

// =============================================
// INIT ON DOM READY
// =============================================
document.addEventListener('DOMContentLoaded', () => {

  /* --- Boot Supabase --- */
  try {
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      console.log('[Cobby Card] ✅ Supabase connected');
    } else {
      console.warn('[Cobby Card] Supabase SDK not loaded – offline mode');
    }
  } catch (e) {
    console.error('[Cobby Card] Supabase init error:', e.message);
  }

  /* --- Grab DOM refs --- */
  const form            = document.getElementById('rsvp-form');
  const fullNameInput   = document.getElementById('fullName');
  const studentNumInput = document.getElementById('studentNumber');
  const emailInput      = document.getElementById('email');
  const chips           = document.querySelectorAll('.chip');
  const previewAvatar   = document.getElementById('preview-avatar');
  const previewName     = document.getElementById('preview-name');
  const previewTrack    = document.getElementById('preview-track');
  const previewId       = document.getElementById('preview-id');

  /* --------------------------------------------------
     AVATAR URL BUILDER
     Uses DiceBear adventurer-neutral with student seed
  -------------------------------------------------- */
  function avatarUrl(seed) {
    const s = encodeURIComponent((seed && seed.toString().trim()) || 'cobby-default');
    return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${s}`;
  }

  /* --------------------------------------------------
     LIVE PREVIEW  – updates in real-time as user types
  -------------------------------------------------- */
  function updatePreview() {
    const name  = fullNameInput.value.trim() || 'Your Name';
    const id    = studentNumInput.value.trim();
    const track = selectedTrack || 'Pick a track';

    previewName.textContent  = name;
    previewTrack.textContent = track;
    previewId.textContent    = id ? `ID: ${id}` : 'ID: —';

    previewAvatar.src = id.length >= 3 ? avatarUrl(id) : avatarUrl('cobby-default');
  }

  fullNameInput.addEventListener('input',   updatePreview);
  studentNumInput.addEventListener('input', updatePreview);

  updatePreview(); // Initial render

  /* --------------------------------------------------
     CHIP SELECTION
     Each chip stores its display text as data-track
  -------------------------------------------------- */
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();                       // Never trigger form submit
      chips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedTrack = chip.dataset.track;       // stored plain text (no HTML entities)
      clearFieldError('track');
      updatePreview();
    });
  });

  /* --------------------------------------------------
     CHIP TRACK → CSS COLOR CLASS MAP
  -------------------------------------------------- */
  const trackColorMap = {
    'web':      'chip--blue',
    'data':     'chip--purple',
    'security': 'chip--red',
    'ui':       'chip--pink',
    'not':      'chip--gray',
  };

  function trackChipClass(track) {
    const key = (track || '').toLowerCase().split(' ').find(w => trackColorMap[w]);
    return trackColorMap[key] || 'chip--gray';
  }

  /* --------------------------------------------------
     ERROR HELPERS
  -------------------------------------------------- */
  function showFieldError(fieldId, msg) {
    const el = document.getElementById(`${fieldId}-error`);
    if (el) el.textContent = msg;
  }
  function clearFieldError(fieldId) {
    showFieldError(fieldId, '');
  }
  function clearAllErrors() {
    ['fullName', 'studentNumber', 'email', 'track'].forEach(clearFieldError);
  }

  /* --------------------------------------------------
     TOAST NOTIFICATIONS
  -------------------------------------------------- */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function showToast(msg, type = 'info') {
    toastEl.textContent = msg;
    toastEl.className   = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3500);
  }

  /* --------------------------------------------------
     NAVIGATION
  -------------------------------------------------- */
  function switchScreen(targetId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    const matchingTab = document.querySelector(`.nav-tab[data-screen="${targetId}"]`);
    if (matchingTab) matchingTab.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('tab-rsvp').addEventListener('click', () => switchScreen('screen-rsvp'));
  document.getElementById('tab-card').addEventListener('click', () => switchScreen('screen-card'));

  /* --------------------------------------------------
     FORMAT CARD NUMBER  e.g. #001
  -------------------------------------------------- */
  function formatCardNum(n) {
    return '#' + String(n).padStart(3, '0');
  }

  /* --------------------------------------------------
     GENERATE & RENDER THE DIGITAL PASS
     Layout (top → bottom):
       1. CREATEONBASE logo (centered)
       2. Dashed divider
       3. Name · ID · Track chip
       4. Dashed divider
       5. Date · Time
       6. Large centered avatar
       7. Footer: card number + "show at door"
  -------------------------------------------------- */
  function generateCard(attendee) {
    const avatar    = avatarUrl(attendee.studentNumber);
    const chipClass = trackChipClass(attendee.track);
    const cardNum   = formatCardNum(attendee.cardNumber);

    const passWrapper = document.getElementById('pass-wrapper');
    passWrapper.innerHTML = `
      <div class="cobby-pass" id="cobby-pass" data-card="${attendee.cardNumber}">

        <!-- ── TOP LOGO ── -->
        <div class="pass-logo-header">
          <div class="pass-logo-icon" aria-label="CreateOnBase Logo">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" fill="#1a8fe3" stroke="#fff" stroke-width="2"/>
              <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
              <text x="32" y="42" text-anchor="middle" font-family="Arial Black, sans-serif"
                    font-size="28" font-weight="900" fill="#fff">C</text>
            </svg>
          </div>
          <p class="pass-logo-name">CREATEONBASE</p>
          <p class="pass-logo-tagline">BREATH LIFE TO YOUR CODING SKILLS</p>
        </div>

        <hr class="pass-divider" />

        <!-- ── STUDENT INFO ── -->
        <div class="pass-body">
          <h2 class="pass-name">${escapeHtml(attendee.name.toUpperCase())}</h2>

          <div class="pass-student-id">
            <span class="id-badge">ID</span>
            <span>${escapeHtml(attendee.studentNumber)}</span>
          </div>

          <div class="pass-track">
            <span class="pass-track-chip ${chipClass}">${escapeHtml(attendee.track)}</span>
          </div>

          <hr class="pass-divider" />

          <!-- Date & Time (no venue to keep it clean like the reference) -->
          <div class="pass-details">
            <div class="pass-detail-row"><span class="detail-icon">📅</span><span>2 May 2026</span></div>
            <div class="pass-detail-row"><span class="detail-icon">🕙</span><span>10:00 AM</span></div>
          </div>

          <!-- ── AVATAR (large, centered) ── -->
          <div class="pass-avatar-center-wrap">
            <img
              src="${avatar}"
              alt="Avatar for ${escapeHtml(attendee.name)}"
              class="pass-avatar-center"
              width="160" height="160"
            />
          </div>
        </div>

        <!-- ── FOOTER ── -->
        <div class="pass-footer">
          <div>
            <p class="pass-card-num-label">CARD NO.</p>
            <p class="pass-card-num">${cardNum}</p>
          </div>
          <div style="text-align:right;">
            <p class="pass-stars-inline">★ ★ ★</p>
            <p style="font-size:0.72rem;color:var(--text-light);">✦ Show this card</p>
            <p style="font-size:0.72rem;color:var(--text-light);">at the door 🚪 ✦</p>
          </div>
        </div>

      </div>

      <!-- SHARE BUTTON -->
      <button class="btn-share" id="btn-share" type="button">
        <span>📤</span>
        <span>
          Share your card!
          <span class="btn-share-sub">Invite your friends →</span>
        </span>
      </button>
      <p class="pass-tip">✦ Show this card at the door on the day ✦</p>
    `;

    /* Attach share handler to newly created button */
    document.getElementById('btn-share').addEventListener('click', () => shareCard(attendee));
  }


  /* --------------------------------------------------
     SHARE CARD → Download as PNG image
  -------------------------------------------------- */
  async function shareCard(attendee) {
    const cardEl = document.getElementById('cobby-pass');
    const shareBtn = document.getElementById('btn-share');

    if (!cardEl) return;

    /* Show loading state on button */
    const originalHTML = shareBtn.innerHTML;
    shareBtn.innerHTML = `<span>⏳</span><span>Preparing download…</span>`;
    shareBtn.disabled = true;

    try {
      /* Wait for avatar image to fully load before capturing */
      const avatarImg = cardEl.querySelector('.pass-avatar-center');
      if (avatarImg && !avatarImg.complete) {
        await new Promise(resolve => {
          avatarImg.onload  = resolve;
          avatarImg.onerror = resolve; // continue even if image failed
        });
      }

      /* Render card to canvas at 2× resolution for crisp PNG */
      const canvas = await html2canvas(cardEl, {
        scale:       2,
        useCORS:     true,     // allow DiceBear cross-origin SVGs
        allowTaint:  false,
        backgroundColor: null, // preserve transparent areas
        logging:     false,
      });

      /* Trigger download */
      const link     = document.createElement('a');
      const safeName = (attendee.name || 'cobby-card')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      link.download  = `cobby-card-${safeName}-${attendee.studentNumber}.png`;
      link.href      = canvas.toDataURL('image/png');
      link.click();

      showToast('📥 Card downloaded!', 'success');
    } catch (err) {
      console.error('[Cobby Card] Download failed:', err);
      showToast('❌ Download failed – try again.', 'error');
    } finally {
      /* Restore button */
      shareBtn.innerHTML = originalHTML;
      shareBtn.disabled  = false;
      /* Re-attach click listener lost when innerHTML was swapped */
      shareBtn.addEventListener('click', () => shareCard(attendee));
    }
  }


  /* --------------------------------------------------
     SAVE TO SUPABASE
  -------------------------------------------------- */
  async function saveToSupabase(attendee) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.from('attendees').insert([{
        full_name:      attendee.name,
        student_number: attendee.studentNumber,
        email:          attendee.email,
        career_track:   attendee.track,
        card_number:    attendee.cardNumber,
        created_at:     new Date().toISOString(),
      }]);
      if (error) console.error('[Cobby Card] Supabase insert error:', error.message);
      else        console.log('[Cobby Card] ✅ RSVP saved to Supabase');
    } catch (e) {
      console.error('[Cobby Card] Supabase error:', e.message);
    }
  }

  /* --------------------------------------------------
     VALIDATE EMAIL
  -------------------------------------------------- */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* --------------------------------------------------
     FORM SUBMIT – Generate Card
  -------------------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    clearAllErrors();

    const name    = fullNameInput.value.trim();
    const studNum = studentNumInput.value.trim();
    const email   = emailInput.value.trim();
    const track   = selectedTrack;

    let valid = true;

    if (!name) {
      showFieldError('fullName', '⚠ Please enter your full name.');
      valid = false;
    }
    if (!studNum) {
      showFieldError('studentNumber', '⚠ Please enter your student number.');
      valid = false;
    } else if (attendees.some(a => a.studentNumber === studNum)) {
      // In-memory fast check (same session)
      showFieldError('studentNumber', '⚠ This student number is already registered!');
      showToast('⚠ That student number already exists!', 'error');
      valid = false;
    } else if (supabaseClient) {
      // Cross-session check against database → if found, show their existing card
      try {
        const { data, error } = await supabaseClient
          .from('attendees')
          .select('full_name, student_number, email, career_track, card_number')
          .eq('student_number', studNum)
          .limit(1);
        if (!error && data && data.length > 0) {
          // Rebuild the card from stored data and send them to it
          const existing = data[0];
          const existingAttendee = {
            name:          existing.full_name,
            studentNumber: existing.student_number,
            email:         existing.email,
            track:         existing.career_track,
            cardNumber:    existing.card_number,
          };
          currentCardData = existingAttendee;
          generateCard(existingAttendee);
          switchScreen('screen-card');
          showToast(`👋 Welcome back, ${existing.full_name}! Here's your existing card.`, 'info');
          return; // stop – don't create a duplicate
        }
      } catch (_) { /* silently fall through */ }
    }
    if (!email) {
      showFieldError('email', '⚠ Please enter your email address.');
      valid = false;
    } else if (!validateEmail(email)) {
      showFieldError('email', '⚠ Please enter a valid email.');
      valid = false;
    }
    if (!track) {
      showFieldError('track', '⚠ Please select a career track.');
      valid = false;
    }

    if (!valid) return;

    /* ── Get real card number from DB row count ── */
    let cardNumber = attendees.length + 1; // fallback (offline)
    if (supabaseClient) {
      try {
        const { count, error } = await supabaseClient
          .from('attendees')
          .select('*', { count: 'exact', head: true }); // head:true = no rows returned
        if (!error && typeof count === 'number') {
          cardNumber = count + 1;
          console.log(`[Cobby Card] DB has ${count} attendees → card #${cardNumber}`);
        }
      } catch (_) { /* fallback already set */ }
    }

    /* Build attendee record */
    const attendee = {
      name,
      studentNumber: studNum,
      email,
      track,
      cardNumber,
      timestamp:  new Date().toISOString(),
    };

    attendees.push(attendee);
    currentCardData = attendee;

    /* Save to DB (non-blocking) */
    saveToSupabase(attendee);

    /* Render card */
    generateCard(attendee);

    /* Reset form & chips */
    form.reset();
    chips.forEach(c => c.classList.remove('selected'));
    selectedTrack = '';
    updatePreview();

    /* Navigate to My Card */
    switchScreen('screen-card');
    showToast(`🎉 Your Cobby Card is ready, ${name}!`, 'success');

    console.log('[Cobby Card] New attendee:', attendee);
  }

  /* Use 'click' on the button instead of 'submit' on the form
     to avoid any browser default submit behaviour */
  const generateBtn = document.getElementById('btn-generate');
  generateBtn.addEventListener('click', handleSubmit);

  /* Also keep submit as fallback (for enter-key users) */
  form.addEventListener('submit', handleSubmit);

  console.log('[Cobby Card] 🎟️ App ready');
});

/* --------------------------------------------------
   XSS HELPER
-------------------------------------------------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}
