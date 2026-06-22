/**
 * StartupX Builder Card & RSVP – script.js
 * Comprehensive logic for form navigation, dynamic SVG avatar generation, 
 * Supabase save/retrieve, and html2canvas ticket export.
 */

'use strict';

// =============================================
// SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL = 'https://eaelzwhfxtyhcqzcvhki.supabase.co';
const SUPABASE_ANON = 'sb_publishable_EqGsGjUoJ4Db-T-MMHcGFw_L5W-HiDO';

// =============================================
// STATE & CONSTANTS
// =============================================
let supabaseClient = null;
const attendees = [];
let currentCardData = null;

// Form standard selections
const SKILLS_LIST = [
  { id: 'html_css', name: 'HTML & CSS', icon: 'html5' },
  { id: 'javascript', name: 'JavaScript', icon: 'javascript' },
  { id: 'typescript', name: 'TypeScript', icon: 'typescript' },
  { id: 'react', name: 'React', icon: 'react' },
  { id: 'nextjs', name: 'Next.js', icon: 'nextdotjs' },
  { id: 'nodejs', name: 'Node.js', icon: 'nodedotjs' },
  { id: 'python', name: 'Python', icon: 'python' },
  { id: 'java', name: 'Java', icon: 'openjdk' },
  { id: 'csharp', name: 'C#', icon: 'csharp' },
  { id: 'mobile_dev', name: 'Mobile App Development', icon: 'android' },
  { id: 'uiux_design', name: 'UI/UX Design', icon: 'figma' },
  { id: 'database_dev', name: 'Database Development', icon: 'postgresql' },
  { id: 'ai_ml', name: 'AI / Machine Learning', icon: 'openai' },
  { id: 'data_analytics', name: 'Data Analytics', icon: 'r' },
  { id: 'cloud_tech', name: 'Cloud Technologies', icon: 'googlecloud' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: 'fortinet' }
];

const TOOLS_LIST = [
  { id: 'github', name: 'GitHub', icon: 'github' },
  { id: 'git', name: 'Git', icon: 'git' },
  { id: 'firebase', name: 'Firebase', icon: 'firebase' },
  { id: 'vercel', name: 'Vercel', icon: 'vercel' },
  { id: 'netlify', name: 'Netlify', icon: 'netlify' },
  { id: 'figma', name: 'Figma', icon: 'figma' },
  { id: 'aws', name: 'AWS', icon: 'amazonwebservices' },
  { id: 'azure', name: 'Azure', icon: 'microsoftazure' },
  { id: 'google_cloud', name: 'Google Cloud', icon: 'googlecloud' },
  { id: 'docker', name: 'Docker', icon: 'docker' }
];

const INTERESTS_LIST = [
  { id: 'frontend', name: 'Front-End Development', class: 'tag-frontend' },
  { id: 'backend', name: 'Back-End Development', class: 'tag-backend' },
  { id: 'fullstack', name: 'Full-Stack Development', class: 'tag-full-stack' },
  { id: 'mobile', name: 'Mobile Development', class: 'tag-mobile' },
  { id: 'uiux', name: 'UI/UX Design', class: 'tag-ui-ux' },
  { id: 'ai', name: 'Artificial Intelligence', class: 'tag-ai' },
  { id: 'data', name: 'Data Analytics', class: 'tag-data' },
  { id: 'cloud', name: 'Cloud Computing', class: 'tag-cloud' },
  { id: 'security', name: 'Cybersecurity', class: 'tag-security' },
  { id: 'devops', name: 'DevOps', class: 'tag-devops' }
];

// Simple Icons Color Maps for Skill & Tool logos
const COLOR_MAP = {
  html5: 'E34F26',
  javascript: 'F7DF1E',
  typescript: '3178C6',
  react: '61DAFB',
  nextdotjs: '000000',
  nodedotjs: '5FA04E',
  python: '3776AB',
  openjdk: '007396',
  csharp: '239120',
  android: '3DDC84',
  figma: 'F24E1E',
  postgresql: '4169E1',
  openai: '412991',
  r: '276DC3',
  googlecloud: '4285F4',
  fortinet: 'ED1C24',
  github: '181717',
  git: 'F05032',
  firebase: 'FFCA28',
  vercel: '000000',
  netlify: '00C8C8',
  amazonwebservices: 'FF9900',
  microsoftazure: '0089D6',
  docker: '2496ED'
};

// =============================================
// INIT ON DOM READY
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  /* --- Boot Supabase --- */
  try {
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      console.log('[StartupX] ✅ Supabase connected');
      const dbBadge = document.getElementById('db-status-badge');
      if (dbBadge) { dbBadge.textContent = '🟢 DB Connected'; dbBadge.style.color = '#39c280'; }
    } else {
      console.warn('[StartupX] Supabase SDK not loaded – offline mode');
      const dbBadge = document.getElementById('db-status-badge');
      if (dbBadge) { dbBadge.textContent = '🟡 Offline Mode'; dbBadge.style.color = '#f8c232'; }
    }
  } catch (e) {
    console.error('[StartupX] Supabase init error:', e.message);
    const dbBadge = document.getElementById('db-status-badge');
    if (dbBadge) { dbBadge.textContent = '🔴 DB Error'; dbBadge.style.color = '#ff4a4a'; }
  }


  // Load Form Components
  renderSkillsTable();
  renderInterestsCheckboxes();
  renderToolsCheckboxes();

  /* --- Grab DOM elements --- */
  const form = document.getElementById('rsvp-form');
  const fullNameInput = document.getElementById('fullName');
  const studentNumInput = document.getElementById('studentNumber');
  const emailInput = document.getElementById('email');
  const contactInput = document.getElementById('contactNumber');
  const degreeInput = document.getElementById('qualification');
  const yearSelect = document.getElementById('yearOfStudy');
  const facultyInput = document.getElementById('faculty');
  const quoteInput = document.getElementById('customQuote');

  // Real-time Preview Elements
  const previewAvatarContainer = document.getElementById('preview-avatar-container');
  const previewName = document.getElementById('preview-name');
  const previewTrack = document.getElementById('preview-track');
  const previewId = document.getElementById('preview-id');
  const previewQuote = document.getElementById('preview-quote');

  /* --------------------------------------------------
     DYNAMIC SVG AVATAR GENERATOR (Hashed from Seed)
  -------------------------------------------------- */
  function getHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  function generatePixelAvatar(seedStr) {
    const seed = (seedStr && seedStr.toString().trim()) || 'cob-startupx';
    const hash = getHash(seed);

    // Color definitions
    const skinColors = ['#8B5A2B', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#C68E65', '#8C6239', '#5c3d24'];
    const skinColor = skinColors[hash % skinColors.length];

    const skyGradients = [
      { start: '#ffe3d8', end: '#74ebd5' }, // Sunrise pastel
      { start: '#ffebd3', end: '#a1c4fd' }, // Warm blue
      { start: '#fff0ea', end: '#ffd200' }, // Gold day
      { start: '#e0c3fc', end: '#8ec5fc' }, // Lavender sky
      { start: '#b91d73', end: '#f953c6' }  // Magenta retro
    ];
    const sky = skyGradients[(hash >> 2) % skyGradients.length];

    // Eyes configuration
    const eyeTypes = [
      // Chibi cute shiny eyes
      `<g class="eyes-cute">
         <circle cx="27" cy="27" r="5" fill="#111" />
         <circle cx="37" cy="27" r="5" fill="#111" />
         <circle cx="26" cy="26" r="1.5" fill="#fff" />
         <circle cx="36" cy="26" r="1.5" fill="#fff" />
         <circle cx="28" cy="28.5" r="0.8" fill="#fff" />
         <circle cx="38" cy="28.5" r="0.8" fill="#fff" />
       </g>`,
      // Retro sunglasses
      `<g class="eyes-glasses">
         <rect x="23" y="24" width="8" height="5" fill="#111" rx="1" />
         <rect x="33" y="24" width="8" height="5" fill="#111" rx="1" />
         <rect x="31" y="26" width="2" height="2" fill="#111" />
         <rect x="24" y="25" width="2" height="1" fill="#fff" opacity="0.8" />
         <rect x="34" y="25" width="2" height="1" fill="#fff" opacity="0.8" />
       </g>`,
      // Classic pixel dots
      `<g class="eyes-pixel">
         <rect x="25" y="25" width="3" height="3" fill="#111" />
         <rect x="36" y="25" width="3" height="3" fill="#111" />
       </g>`,
      // Sparkle eyes
      `<g class="eyes-sparkle">
         <rect x="25" y="25" width="4" height="4" fill="#111" />
         <rect x="35" y="25" width="4" height="4" fill="#111" />
         <polygon points="27,24 28,25 27,26 26,25" fill="#fff" />
         <polygon points="37,24 38,25 37,26 36,25" fill="#fff" />
       </g>`
    ];
    const eyes = eyeTypes[(hash >> 4) % eyeTypes.length];

    // Mouth configuration
    const mouthTypes = [
      `<path d="M 28 34 Q 32 37 36 34" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round" />`, // Smile
      `<rect x="29" y="33" width="6" height="4" fill="#111" rx="2" />`, // Open O mouth
      `<path d="M 29 34 L 35 34" stroke="#111" stroke-width="2" stroke-linecap="round" />`, // Neutral straight
      `<path d="M 28 35 Q 32 32 36 35" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round" />` // Worry
    ];
    const mouth = mouthTypes[(hash >> 6) % mouthTypes.length];

    // Accessories
    const accessories = [
      '', // None
      // Red Gaming Cap
      `<path d="M 16 13 L 48 13 L 48 18 L 16 18 Z" fill="#e04040" />
       <path d="M 44 18 L 54 18 L 54 21 L 44 21 Z" fill="#b02020" />`,
      // Golden Crown
      `<path d="M 16 14 L 20 8 L 26 14 L 32 8 L 38 14 L 44 8 L 48 14 L 48 17 L 16 17 Z" fill="#f8c232" stroke="#53433c" stroke-width="1.5" />
       <circle cx="20" cy="7" r="1" fill="#e04040" />
       <circle cx="32" cy="7" r="1" fill="#3080e0" />
       <circle cx="44" cy="7" r="1" fill="#e04040" />`,
      // Builder Bandana
      `<path d="M 16 14 L 48 14 L 48 18 L 16 18 Z" fill="#ff823a" />
       <path d="M 14 16 Q 10 18 12 21" stroke="#ff823a" stroke-width="3" stroke-linecap="round" />`
    ];
    const accessory = accessories[(hash >> 8) % accessories.length];

    // Clouds shape in avatar background
    const cloud1X = (hash % 20) + 5;
    const cloud2X = ((hash >> 1) % 25) + 35;

    return `
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGrad-${hash}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${sky.end}" />
            <stop offset="100%" stop-color="${sky.start}" />
          </linearGradient>
          <clipPath id="avatarClip-${hash}">
            <rect x="0" y="0" width="64" height="64" rx="0" />
          </clipPath>
        </defs>

        <g clip-path="url(#avatarClip-${hash})">
          <!-- Sky Background -->
          <rect x="0" y="0" width="64" height="64" fill="url(#skyGrad-${hash})" />

          <!-- Pixel Clouds -->
          <rect x="${cloud1X}" y="12" width="16" height="5" fill="#ffffff" opacity="0.8" rx="2" />
          <rect x="${cloud1X + 4}" y="9" width="8" height="4" fill="#ffffff" opacity="0.8" rx="2" />
          <rect x="${cloud2X}" y="20" width="20" height="6" fill="#ffffff" opacity="0.7" rx="2" />

          <!-- Sun/Moon Sparkle -->
          <circle cx="48" cy="14" r="3" fill="#ffffff" opacity="0.4" />
          <circle cx="48" cy="14" r="1.5" fill="#ffffff" opacity="0.9" />

          <!-- Grass Ground soil -->
          <rect x="0" y="44" width="64" height="20" fill="#5c4033" />
          <!-- Grass green tops (Pixel stairs) -->
          <rect x="0" y="42" width="64" height="3" fill="#55b848" />
          <rect x="2" y="40" width="8" height="3" fill="#55b848" />
          <rect x="16" y="40" width="12" height="3" fill="#55b848" />
          <rect x="36" y="40" width="6" height="3" fill="#55b848" />
          <rect x="48" y="40" width="14" height="3" fill="#55b848" />
          
          <rect x="6" y="43" width="4" height="3" fill="#7ed96f" />
          <rect x="22" y="43" width="6" height="3" fill="#7ed96f" />
          <rect x="52" y="43" width="6" height="3" fill="#7ed96f" />

          <!-- Brown Square Block Character Body -->
          <rect x="18" y="41" width="28" height="5" fill="#53433c" rx="1" />
          
          <!-- Character Head (Square) -->
          <rect x="16" y="16" width="32" height="27" fill="${skinColor}" stroke="#53433c" stroke-width="2" rx="3" />

          <!-- Cheek Blushes (Pink boxes) -->
          <rect x="19" y="29" width="4" height="2" fill="#ff9999" opacity="0.7" />
          <rect x="41" y="29" width="4" height="2" fill="#ff9999" opacity="0.7" />

          <!-- Eyes -->
          ${eyes}

          <!-- Mouth -->
          ${mouth}

          <!-- Accessory -->
          ${accessory}
        </g>
      </svg>
    `;
  }

  /* --------------------------------------------------
     FORM LIVE PREVIEW – updates screen in real-time
  -------------------------------------------------- */
  function updatePreview() {
    const name = fullNameInput.value.trim() || 'YOUR NAME';
    const id = studentNumInput.value.trim() || '2025XXXXXX';
    const quote = quoteInput.value.trim() || 'Building real products for real startups.';

    // Extract primary track from areas of interest, or default
    const checkedInterests = document.querySelectorAll('input[name="interests"]:checked');
    let primaryTrack = 'Developer Identity';
    if (checkedInterests.length > 0) {
      primaryTrack = checkedInterests[0].nextElementSibling.textContent.trim().toUpperCase();
    }

    previewName.textContent = name.toUpperCase();
    previewTrack.textContent = primaryTrack;
    previewId.textContent = `ID: ${id}`;
    previewQuote.textContent = `"${quote}"`;

    previewAvatarContainer.innerHTML = generatePixelAvatar(id || name);
  }

  fullNameInput.addEventListener('input', updatePreview);
  studentNumInput.addEventListener('input', updatePreview);
  quoteInput.addEventListener('input', updatePreview);

  // Initial update
  updatePreview();

  /* --------------------------------------------------
     DYNAMIC FORM COMPONENT BUILDERS
  -------------------------------------------------- */
  function renderSkillsTable() {
    const tbody = document.getElementById('skills-table-body');
    if (!tbody) return; // Skills table was removed – skip gracefully
    tbody.innerHTML = SKILLS_LIST.map(skill => `
      <tr>
        <td>${skill.name}</td>
        <td class="radio-cell">
          <label>
            <input type="radio" name="skill_${skill.id}" value="Beginner" />
            <span class="pixel-radio-dot"></span>
          </label>
        </td>
        <td class="radio-cell">
          <label>
            <input type="radio" name="skill_${skill.id}" value="Intermediate" />
            <span class="pixel-radio-dot"></span>
          </label>
        </td>
        <td class="radio-cell">
          <label>
            <input type="radio" name="skill_${skill.id}" value="Advanced" />
            <span class="pixel-radio-dot"></span>
          </label>
        </td>
      </tr>
    `).join('');
  }

  function renderInterestsCheckboxes() {
    const container = document.getElementById('interests-container');
    if (!container) return;
    container.innerHTML = INTERESTS_LIST.map(interest => `
      <div class="interest-checkbox">
        <label>
          <input type="checkbox" name="interests" value="${interest.name}" />
          <span class="interest-badge ${interest.class}">${interest.name}</span>
        </label>
      </div>
    `).join('');

    // Update preview when interests are toggled
    container.addEventListener('change', updatePreview);
  }

  function renderToolsCheckboxes() {
    const container = document.getElementById('tools-container');
    if (!container) return;
    container.innerHTML = TOOLS_LIST.map(tool => `
      <div class="tool-checkbox">
        <label>
          <input type="checkbox" name="tools" value="${tool.name}" />
          <span class="tool-badge">
            <img src="https://cdn.simpleicons.org/${tool.icon}/${COLOR_MAP[tool.icon] || '53433C'}" alt="${tool.name} Icon" onerror="this.style.display='none'" />
            ${tool.name}
          </span>
        </label>
      </div>
    `).join('');
  }

  /* --------------------------------------------------
     FORM STEPS NAVIGATION & ACCORDION VALIDATION
  -------------------------------------------------- */
  const stepTabs = document.querySelectorAll('.step-tab');
  const stepContents = document.querySelectorAll('.form-step-content');
  const nextStepButtons = document.querySelectorAll('.btn-next-step');
  const prevStepButtons = document.querySelectorAll('.btn-prev-step');

  function showStep(stepNumber) {
    stepTabs.forEach(tab => {
      if (tab.dataset.step === String(stepNumber)) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    stepContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `step-content-${stepNumber}`) {
        content.classList.add('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  stepTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetStep = parseInt(tab.dataset.step);
      const currentActiveTab = document.querySelector('.step-tab.active');
      const currentStep = currentActiveTab ? parseInt(currentActiveTab.dataset.step) : 1;

      // Let them go backwards freely, or validate if they want to move forwards
      if (targetStep < currentStep) {
        showStep(targetStep);
      } else if (targetStep > currentStep) {
        // Must validate intervening steps
        let valid = true;
        for (let s = currentStep; s < targetStep; s++) {
          if (!validateStep(s)) {
            valid = false;
            showStep(s);
            break;
          }
        }
        if (valid) showStep(targetStep);
      }
    });
  });

  nextStepButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.dataset.next);
      const currentStep = nextStep - 1;
      if (validateStep(currentStep)) {
        showStep(nextStep);
      }
    });
  });

  prevStepButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = parseInt(btn.dataset.prev);
      showStep(prevStep);
    });
  });

  /* --- Validation Helpers --- */
  function showFieldError(fieldId, msg) {
    const el = document.getElementById(`${fieldId}-error`);
    if (el) el.textContent = msg;
  }

  function clearFieldError(fieldId) {
    showFieldError(fieldId, '');
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateStep(stepNum) {
    let valid = true;
    if (stepNum === 1) {
      // Validate Step 1 fields
      const name = fullNameInput.value.trim();
      const studentNum = studentNumInput.value.trim();
      const email = emailInput.value.trim();
      const contact = contactInput.value.trim();
      const degree = degreeInput.value.trim();
      const year = yearSelect.value;
      const faculty = facultyInput.value.trim();
      const quote = quoteInput.value.trim();

      if (!name) {
        showFieldError('fullName', '⚠ Full Name is required.');
        valid = false;
      } else { clearFieldError('fullName'); }

      if (!studentNum) {
        showFieldError('studentNumber', '⚠ Student Number is required.');
        valid = false;
      } else { clearFieldError('studentNumber'); }

      if (!email) {
        showFieldError('email', '⚠ Email Address is required.');
        valid = false;
      } else if (!validateEmail(email)) {
        showFieldError('email', '⚠ Please enter a valid email.');
        valid = false;
      } else { clearFieldError('email'); }

      if (!contact) {
        showFieldError('contactNumber', '⚠ Contact Number is required.');
        valid = false;
      } else { clearFieldError('contactNumber'); }

      if (!degree) {
        showFieldError('qualification', '⚠ Degree programme is required.');
        valid = false;
      } else { clearFieldError('qualification'); }

      if (!year) {
        showFieldError('yearOfStudy', '⚠ Year of Study is required.');
        valid = false;
      } else { clearFieldError('yearOfStudy'); }

      if (!faculty) {
        showFieldError('faculty', '⚠ Faculty is required.');
        valid = false;
      } else { clearFieldError('faculty'); }

      if (!quote) {
        showFieldError('customQuote', '⚠ Card Quote / Tagline is required.');
        valid = false;
      } else { clearFieldError('customQuote'); }

    } else if (stepNum === 2) {
      // Validate Step 2 fields
      const checkedInterests = document.querySelectorAll('input[name="interests"]:checked');
      if (checkedInterests.length === 0) {
        showFieldError('interests', '⚠ Please select at least one area of interest.');
        valid = false;
      } else { clearFieldError('interests'); }
    }
    return valid;
  }

  /* --------------------------------------------------
     TOAST HELPERS
  -------------------------------------------------- */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function showToast(msg, type = 'info') {
    toastEl.textContent = msg;
    toastEl.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3500);
  }

  /* --------------------------------------------------
     SCREEN TABS ROUTING
  -------------------------------------------------- */
  function switchScreen(targetId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('btn-back-to-rsvp').addEventListener('click', () => switchScreen('screen-rsvp'));

  /* --------------------------------------------------
     TICKET GENERATION
  -------------------------------------------------- */
  // Helper to generate tools list HTML inside card
  function generateToolsHtml(data) {
    const selectedTools = [];

    // 1. Standard selected tools
    if (data.tools && data.tools.length > 0) {
      data.tools.forEach(toolName => {
        const found = TOOLS_LIST.find(t => t.name.toLowerCase() === toolName.toLowerCase() || t.id.toLowerCase() === toolName.toLowerCase());
        if (found) {
          selectedTools.push({ name: found.name, icon: found.icon });
        } else {
          selectedTools.push({ name: toolName, icon: null });
        }
      });
    }

    // 2. Add other tools from text field
    if (data.otherTools) {
      const others = data.otherTools.split(',').map(s => s.trim()).filter(Boolean);
      others.forEach(toolName => {
        if (!selectedTools.some(t => t.name.toLowerCase() === toolName.toLowerCase())) {
          selectedTools.push({ name: toolName, icon: null });
        }
      });
    }

    if (selectedTools.length > 0) {
      return `
        <div class="pass-tools-grid">
          ${selectedTools.map(t => {
        const iconColor = COLOR_MAP[t.icon] || 'ff823a';
        const iconImg = t.icon
          ? `<img src="https://cdn.simpleicons.org/${t.icon}/${iconColor}" alt="${t.name}" onerror="this.style.display='none'" />`
          : `<span class="pass-tool-dot">🛠</span>`;
        return `
              <div class="pass-tool-chip">
                ${iconImg}
                <span>${t.name}</span>
              </div>
            `;
      }).join('')}
        </div>
      `;
    } else {
      return `<p style="font-size:0.7rem;color:var(--gray);font-weight:600;margin-top:4px;text-align:center;">No tools selected.</p>`;
    }
  }

  function generateCardMarkup(data) {
    const cardNumFormatted = '#SX' + String(data.cardNumber).padStart(3, '0');
    const avatarSvg = generatePixelAvatar(data.studentNumber || data.fullName);
    const toolsHtml = generateToolsHtml(data);

    const GRAD_CAP_SVG = `
      <svg class="pass-info-icon-svg" width="22" height="22" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 6l7-3.5L15 6L8 8.5L1 6z" fill="#53433c" />
        <path d="M3.5 7.5v3.5c0 1.5 2 2.5 4.5 2.5s4.5-1 4.5-2.5V7.5" fill="#53433c" />
        <path d="M12.5 6v3.5l1.5.75V7" stroke="#ff823a" stroke-width="1.5" stroke-linecap="square" />
        <rect x="13" y="10" width="2" height="2" fill="#f8c232" />
      </svg>
    `;

    const UNIV_BUILDING_SVG = `
      <svg class="pass-info-icon-svg" width="22" height="22" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5.5L8 2l7 3.5v1H1v-1z" fill="#53433c" />
        <rect x="2" y="7.5" width="12" height="1.5" fill="#53433c" />
        <rect x="3" y="10" width="1.5" height="4" fill="#53433c" />
        <rect x="7.25" y="10" width="1.5" height="4" fill="#53433c" />
        <rect x="11.5" y="10" width="1.5" height="4" fill="#53433c" />
        <rect x="1" y="14" width="14" height="1.5" fill="#53433c" />
      </svg>
    `;

    const ID_BADGE_SVG = `
      <svg class="pass-info-icon-svg" width="22" height="22" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2.5" width="14" height="11" rx="1.5" fill="#3080e0" stroke="#53433c" stroke-width="1.5" />
        <rect x="3" y="5" width="3.5" height="4.5" fill="#ffffff" />
        <rect x="8" y="5.5" width="4.5" height="1.5" fill="#ffffff" />
        <rect x="8" y="8" width="4.5" height="1.5" fill="#ffffff" />
        <rect x="6.5" y="1" width="3" height="1.5" fill="#53433c" />
      </svg>
    `;

    const GOLD_SHIELD_SVG = `
      <svg class="pass-shield-svg" width="36" height="40" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1.5h14v7c0 4-3 7-7 8-4-1-7-4-7-8v-7z" fill="#f8c232" stroke="#53433c" stroke-width="1.75" stroke-linejoin="miter" />
        <path d="M4.5 4.5l3.5 3.5 3.5-3.5M4.5 11.5l3.5-3.5 3.5 3.5" stroke="#53433c" stroke-width="1.75" stroke-linecap="square" />
      </svg>
    `;

    const PICKAXE_SVG = `
      <svg width="36" height="36" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="1" width="6" height="2" fill="#8b827e" />
        <rect x="14" y="3" width="2" height="2" fill="#8b827e" />
        <rect x="7" y="0" width="2" height="2" fill="#a0a0a0" />
        <rect x="12" y="3" width="2" height="2" fill="#3080e0" />
        <rect x="8" y="8" width="1" height="1" fill="#8B4513" />
        <rect x="7" y="9" width="1" height="1" fill="#8B4513" />
        <rect x="6" y="10" width="1" height="1" fill="#8B4513" />
        <rect x="5" y="11" width="1" height="1" fill="#8B4513" />
        <rect x="4" y="12" width="1" height="1" fill="#8B4513" />
        <rect x="3" y="13" width="1" height="1" fill="#8B4513" />
        <rect x="2" y="14" width="1" height="1" fill="#5c4033" />
        <rect x="1" y="15" width="1" height="1" fill="#5c4033" />
      </svg>
    `;

    // Check attendance state
    const attendingActive = data.attending !== false; // defaults to true/attending
    const attendingClass = attendingActive ? 'active-attending' : '';
    const notAttendingClass = !attendingActive ? 'active-not-attending' : '';

    const passWrapper = document.getElementById('pass-wrapper');
    passWrapper.innerHTML = `
      <!-- THE EXPORTABLE CARD COMPONENT (matching Image 1) -->
      <div class="builder-pass" id="builder-pass-card">
        
        <!-- ── PASS HEADER ── -->
        <div class="pass-header">
          <div class="brand-cob">
            <span class="brand-c-icon">C</span>
            <div class="brand-cob-text">
              <span class="brand-name-top">CREATEONBASE</span>
              <span class="brand-tag-top">BREATH LIFE TO YOUR CODING SKILLS</span>
            </div>
          </div>
          <div class="partner-x">✕</div>
          <div class="brand-startupx">
            <span class="brand-name-sx">Startup<span class="orange-x">X</span></span>
            <span class="brand-tag-sx">BUILD. LAUNCH. GROW</span>
          </div>
        </div>

        <div class="pass-banner-title-box-wrap">
          <div class="pass-banner-title-box">
            <h1 class="pass-pixel-banner-title">STARTUPX BUILDER CARD</h1>
          </div>
        </div>

        <!-- ── CENTERED PROFILE SECTION ── -->
        <div class="pass-centered-profile">
          <div class="pass-avatar-frame">
            <div class="pass-avatar-content">
              ${avatarSvg}
            </div>
          </div>
          <h3 class="pass-builder-name">${escapeHtml(data.fullName)}</h3>
          <p class="pass-builder-title">${escapeHtml(data.interests[0] || 'Developer Identity')}</p>
          <div class="pass-quote-box">
            "${escapeHtml(data.customQuote)}"
          </div>
        </div>

        <!-- ── MAIN BODY COLUMNS ── -->
        <div class="pass-details-columns">
          
          <!-- LEFT COLUMN (ACADEMIC DETAILS) -->
          <div class="pass-details-col-left">
            <div class="pass-info-card">
              <div class="pass-info-icon-box">${GRAD_CAP_SVG}</div>
              <div class="pass-info-text-box">
                <span class="pass-info-lbl">YEAR OF STUDY</span>
                <span class="pass-info-val">${escapeHtml(data.yearOfStudy)}</span>
              </div>
            </div>
            <div class="pass-info-card">
              <div class="pass-info-icon-box">${UNIV_BUILDING_SVG}</div>
              <div class="pass-info-text-box">
                <span class="pass-info-lbl">FACULTY</span>
                <span class="pass-info-val">${escapeHtml(data.faculty)}</span>
              </div>
            </div>
            <div class="pass-info-card">
              <div class="pass-info-icon-box">${ID_BADGE_SVG}</div>
              <div class="pass-info-text-box">
                <span class="pass-info-lbl">STUDENT ID</span>
                <span class="pass-info-val">${escapeHtml(data.studentNumber)}</span>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN (TOOLS & PLATFORMS) -->
          <div class="pass-details-col-right">
            <div class="pass-tools-header">TOOLS & PLATFORMS</div>
            ${toolsHtml}
          </div>
        </div>

        <!-- ── SEPARATOR LINE WITH NOTCHES AND SHIELD ── -->
        <div class="pass-separator-line-wrap">
          <div class="pass-separator-line"></div>
          <div class="pass-separator-shield">
            ${GOLD_SHIELD_SVG}
          </div>
        </div>

        <!-- ── COMPACT TICKET FOOTER ── -->
        <div class="pass-footer-section-compact">
          <div class="pass-footer-branding-compact">
            <div class="pass-footer-left">
              <div class="pass-shield-wrap">
                ${GOLD_SHIELD_SVG}
              </div>
              <div class="pass-identity-tag-compact">
                <span class="pass-id-lbl-compact">CARD NO.</span>
                <span class="pass-id-num-compact">${cardNumFormatted}</span>
                <span class="pass-id-sub-compact">BUILDER IDENTITY</span>
              </div>
            </div>
            <div class="pass-footer-pickaxe-compact">
              ${PICKAXE_SVG}
            </div>
          </div>
        </div>

      </div>

      <div class="pass-wrapper-interactive-under">
        <!-- RSVP Interactive Buttons -->
        <div class="pass-attendance-box">
          <button type="button" class="attendance-opt ${attendingClass}" id="btn-pass-attend">
            <span>✔</span> I'M ATTENDING
          </button>
          <button type="button" class="attendance-opt ${notAttendingClass}" id="btn-pass-absent">
            <span>✕</span> I'M NOT ATTENDING
          </button>
        </div>

        <!-- Action Row Below Card -->
        <div class="ticket-actions-row">
          <button class="pixel-btn" id="btn-download-pass" type="button">
            📤 SHARE &amp; DOWNLOAD PASS
          </button>
        </div>

        <p class="pass-tip">
          ✦ Present this digital pass at the entrance venue door 🚪 ✦
        </p>
      </div>
    `;

    // Attach Event Listeners inside new elements
    document.getElementById('btn-download-pass').addEventListener('click', () => shareCard(data));
    document.getElementById('btn-pass-attend').addEventListener('click', () => updateRsvpStatus(data, true));
    document.getElementById('btn-pass-absent').addEventListener('click', () => updateRsvpStatus(data, false));
  }

  function formatExternalUrl(url) {
    if (!url) return '';
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = 'https://' + target;
    }
    return target;
  }

  /* --------------------------------------------------
     DATABASE COMMUNICATIONS (SUPABASE)
  -------------------------------------------------- */
  async function saveToSupabase(data) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.from('attendees').insert([{
        full_name: data.fullName,
        student_number: data.studentNumber,
        email: data.email,
        contact_number: data.contactNumber,
        qualification: data.qualification,
        year_of_study: data.yearOfStudy,
        faculty: data.faculty,
        custom_quote: data.customQuote,
        skills: data.skills,
        tools: data.tools,
        other_skills: data.otherSkills || null,
        other_tools: data.otherTools || null,
        interests: data.interests,
        experience: data.experience,
        portfolio: data.portfolio,
        challenge_availability: data.challengeAvailability,
        attending: data.attending !== false,
        career_track: data.interests[0] || 'Developer',   // keep for legacy compat
        card_number: data.cardNumber,
        created_at: new Date().toISOString(),
      }]);

      if (error) {
        console.error('[StartupX] Supabase write error:', error.message);
        showToast('❌ DB save failed – your card is still ready!', 'error');
      } else {
        console.log('[StartupX] ✅ Registration saved to database');
      }
    } catch (e) {
      console.error('[StartupX] Supabase error:', e.message);
    }
  }

  async function updateRsvpStatus(data, isAttending) {
    data.attending = isAttending;
    currentCardData = data;
    generateCardMarkup(data);
    showToast(isAttending ? '🎉 Marked as attending! Can\'t wait.' : 'ℹ️ Marked as not attending.', 'success');

    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient
        .from('attendees')
        .update({ attending: isAttending, updated_at: new Date().toISOString() })
        .eq('student_number', data.studentNumber);

      if (error) console.error('[StartupX] RSVP update error:', error.message);
      else console.log('[StartupX] ✅ RSVP status updated in Supabase');
    } catch (e) {
      console.error('[StartupX] DB update failed:', e.message);
    }
  }

  /* --------------------------------------------------
     RETRIEVE PASS BY STUDENT NUMBER (LOOKUP)
  -------------------------------------------------- */
  const btnLookup = document.getElementById('btn-lookup');
  const lookupInput = document.getElementById('lookup-student-id');

  async function handleLookup() {
    const studentId = lookupInput.value.trim();
    if (!studentId) {
      showToast('⚠ Please enter your student number.', 'error');
      return;
    }

    btnLookup.disabled = true;
    const originalText = btnLookup.textContent;
    btnLookup.textContent = 'Searching…';

    try {
      if (supabaseClient) {
        const { data, error } = await supabaseClient
          .from('attendees')
          .select('full_name, student_number, email, contact_number, qualification, year_of_study, faculty, custom_quote, skills, tools, interests, experience, portfolio, challenge_availability, attending, career_track, card_number')
          .eq('student_number', studentId)
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const row = data[0];
          // Build from dedicated columns; fall back to legacy career_track JSON for old records
          let parsedData = null;
          const hasNewCols = row.qualification !== null && row.qualification !== undefined;
          if (hasNewCols) {
            parsedData = {
              fullName: row.full_name,
              studentNumber: row.student_number,
              email: row.email,
              contactNumber: row.contact_number || '',
              qualification: row.qualification || '',
              yearOfStudy: row.year_of_study || '',
              faculty: row.faculty || '',
              customQuote: row.custom_quote || 'Building real products for real startups.',
              skills: row.skills || {},
              tools: row.tools || [],
              interests: row.interests || [],
              experience: row.experience || { website: 'No', mobile: 'No', project: 'No', team: 'No', client: 'No' },
              portfolio: row.portfolio || {},
              challengeAvailability: row.challenge_availability || 'No',
              attending: row.attending !== false,
              cardNumber: row.card_number,
            };
          } else {
            // Legacy: try JSON parse from career_track
            try {
              parsedData = JSON.parse(row.career_track);
            } catch (_) {
              parsedData = {
                fullName: row.full_name, studentNumber: row.student_number, email: row.email,
                qualification: '', yearOfStudy: '', faculty: '',
                customQuote: 'Building real products for real startups.',
                contactNumber: '', interests: [row.career_track || 'Developer'],
                skills: {}, tools: [],
                experience: { website: 'No', mobile: 'No', project: 'No', team: 'No', client: 'No' },
                portfolio: {}, challengeAvailability: 'No',
                attending: true, cardNumber: row.card_number,
              };
            }
          }

          currentCardData = parsedData;
          generateCardMarkup(parsedData);
          switchScreen('screen-card');
          showToast(`👋 Welcome back, ${parsedData.fullName}! Loaded pass successfully.`, 'success');
          lookupInput.value = '';
          btnLookup.disabled = false;
          btnLookup.textContent = originalText;
          return;
        }
      }

      // Check local cache
      const localFound = attendees.find(a => a.studentNumber === studentId);
      if (localFound) {
        currentCardData = localFound;
        generateCardMarkup(localFound);
        switchScreen('screen-card');
        showToast(`👋 Loaded card from memory, ${localFound.fullName}!`, 'success');
        lookupInput.value = '';
      } else {
        showToast('❌ Student ID not found in database.', 'error');
      }

    } catch (err) {
      console.error('[StartupX] Lookup failed:', err.message);
      showToast('❌ Database connection error.', 'error');
    } finally {
      btnLookup.disabled = false;
      btnLookup.textContent = originalText;
    }
  }

  btnLookup.addEventListener('click', handleLookup);
  lookupInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLookup();
  });

  /* --------------------------------------------------
     FORM SUBMIT & PASS CREATION
  -------------------------------------------------- */
  const btnGenerate = document.getElementById('btn-generate');

  async function handleSubmit(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Double check step validations
    if (!validateStep(1)) { showStep(1); return; }
    if (!validateStep(2)) { showStep(2); return; }

    btnGenerate.disabled = true;
    const origBtnHTML = btnGenerate.innerHTML;
    btnGenerate.innerHTML = 'Generating Digipass…';

    const name = fullNameInput.value.trim();
    const studNum = studentNumInput.value.trim();
    const email = emailInput.value.trim();
    const contact = contactInput.value.trim();
    const qualification = degreeInput.value.trim();
    const year = yearSelect.value;
    const faculty = facultyInput.value.trim();
    const quote = quoteInput.value.trim();

    // Map Skills Matrix Values
    const skillsValues = {};
    SKILLS_LIST.forEach(s => {
      const radio = document.querySelector(`input[name="skill_${s.id}"]:checked`);
      skillsValues[s.id] = radio ? radio.value : 'None';
    });

    // Map Interests
    const checkedInterests = document.querySelectorAll('input[name="interests"]:checked');
    const interests = Array.from(checkedInterests).map(c => c.value);

    // Map Tools
    const checkedTools = document.querySelectorAll('input[name="tools"]:checked');
    const tools = Array.from(checkedTools).map(c => c.value);
    const otherTools = document.getElementById('otherTools').value.trim();
    const otherSkills = document.getElementById('otherSkills').value.trim();

    // Map Project Exp Toggles
    const getRadioVal = (name) => {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : 'No';
    };

    const experience = {
      website: getRadioVal('expWebsite'),
      mobile: getRadioVal('expMobile'),
      project: getRadioVal('expProject'),
      team: getRadioVal('expTeam'),
      client: getRadioVal('expClient')
    };

    // Portfolio links
    const portfolio = {
      github: document.getElementById('linkGithub').value.trim(),
      linkedin: document.getElementById('linkLinkedin').value.trim(),
      website: document.getElementById('linkWebsite').value.trim(),
      projects: document.getElementById('linkProjects').value.trim()
    };

    // Availability
    const challengeAvailability = document.getElementById('challengeAvailability').checked ? 'Yes' : 'No';

    // Fast Check Student Number exist
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('attendees')
          .select('student_number')
          .eq('student_number', studNum)
          .limit(1);

        if (!error && data && data.length > 0) {
          showToast('⚠ This Student ID is already registered! Retrieving existing card...', 'info');
          lookupInput.value = studNum;
          await handleLookup();
          btnGenerate.disabled = false;
          btnGenerate.innerHTML = origBtnHTML;
          return;
        }
      } catch (_) { /* bypass error to fallback */ }
    }

    /* ── Fetch Real Card Number count from DB ── */
    let cardNumber = attendees.length + 1; // local offline fallback
    if (supabaseClient) {
      try {
        const { count, error } = await supabaseClient
          .from('attendees')
          .select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') {
          cardNumber = count + 1;
        }
      } catch (_) { /* fallback exists */ }
    }

    // Build central data record object
    const studentData = {
      fullName: name,
      studentNumber: studNum,
      email: email,
      contactNumber: contact,
      qualification: qualification,
      yearOfStudy: year,
      faculty: faculty,
      customQuote: quote,
      skills: skillsValues,
      interests: interests,
      tools: tools,
      otherSkills: otherSkills || null,
      otherTools: otherTools || null,
      experience: experience,
      portfolio: portfolio,
      challengeAvailability: challengeAvailability,
      cardNumber: cardNumber,
      attending: true
    };

    attendees.push(studentData);
    currentCardData = studentData;

    // Send payload to Supabase
    saveToSupabase(studentData);

    // Render pass
    generateCardMarkup(studentData);

    // Reset Form fields and tabs
    form.reset();
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    showStep(1);
    updatePreview();

    // Route view
    switchScreen('screen-card');
    showToast(`🎉 Digipass successfully generated, welcome ${studentData.fullName}!`, 'success');

    btnGenerate.disabled = false;
    btnGenerate.innerHTML = origBtnHTML;
  }

  btnGenerate.addEventListener('click', handleSubmit);

  /* --------------------------------------------------
     SHARE & DOWNLOAD PASS IMAGE (html2canvas)
  -------------------------------------------------- */
  async function shareCard(data) {
    const cardEl = document.getElementById('builder-pass-card');
    const downloadBtn = document.getElementById('btn-download-pass');
    if (!cardEl || !downloadBtn) return;

    const originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = `<span>⏳</span> RASTERISING PASS IMAGE...`;
    downloadBtn.disabled = true;

    // Grab SVG avatars inside the card wrapper
    const svgElements = cardEl.querySelectorAll('svg');
    const svgReplacements = [];

    try {
      // ── WORKAROUND: Rasterise inline SVGs to canvas URLs so html2canvas renders them accurately ──
      for (let i = 0; i < svgElements.length; i++) {
        const svg = svgElements[i];

        // Skip pickaxe footer icon decoration if not critical, but rasterising all is safest
        const xml = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(svgBlob);

        const pngUrl = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // Support 2x scale crispness
            const rect = svg.getBoundingClientRect();
            const width = (rect.width || 120) * 2;
            const height = (rect.height || 120) * 2;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            URL.revokeObjectURL(blobUrl);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = (e) => {
            URL.revokeObjectURL(blobUrl);
            reject(e);
          };
          img.src = blobUrl;
        });

        // Hide SVG element and add img element right next to it
        const replacementImg = document.createElement('img');
        replacementImg.src = pngUrl;
        replacementImg.style.width = svg.style.width || '100%';
        replacementImg.style.height = svg.style.height || 'auto';
        replacementImg.className = svg.className.baseVal + ' raster-temp-replace';

        svg.style.display = 'none';
        svg.parentNode.insertBefore(replacementImg, svg);

        svgReplacements.push({ svg: svg, img: replacementImg });
      }

      // Small delay to let images draw fully in DOM
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capture card canvas
      const canvas = await html2canvas(cardEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#121214',
        logging: false
      });

      const pngDataUrl = canvas.toDataURL('image/png');

      // Trigger standard file download
      const safeName = (data.fullName || 'builder-pass')
        .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const link = document.createElement('a');
      link.download = `startupx-pass-${safeName}.png`;
      link.href = pngDataUrl;
      link.click();

      // Show congratulations sharing modal overlay
      showInviteModal(data, pngDataUrl);

    } catch (error) {
      console.error('[StartupX] Download rasterise failed:', error);
      showToast('❌ Image export failed. Try again.', 'error');
    } finally {
      // Restore SVGs and remove temporary rasterised images
      svgReplacements.forEach(item => {
        item.svg.style.display = '';
        if (item.img.parentNode) {
          item.img.parentNode.removeChild(item.img);
        }
      });

      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
    }
  }

  /* --- Congrats share modal rendering --- */
  function showInviteModal(data, pngDataUrl) {
    document.getElementById('invite-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'invite-modal';
    overlay.className = 'invite-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const firstName = data.fullName.split(' ')[0];

    overlay.innerHTML = `
      <div class="invite-modal">
        <button class="invite-close" id="invite-close">✕</button>
        <div class="invite-confetti">🎉 🎊 ✨ 🎈 👾</div>
        <h3 class="invite-title">Ticket Downloaded! 📥</h3>
        <p class="invite-sub">
          Awesome <strong>${escapeHtml(firstName)}</strong>, your StartupX Builder Card pass is saved.<br/>
          Share it with friends and invite them to register!
        </p>
        <div class="invite-preview">
          <img src="${pngDataUrl}" alt="Builder Pass Preview" class="invite-card-thumb" />
        </div>
        <div class="invite-friend-tip">
          📲 Tell your team members to RSVP and get their unique digital badge entry pass too!
        </div>
        <button class="pixel-btn" id="invite-done" style="width:100%">Quest Done ✓</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.add('invite-leaving');
      setTimeout(() => overlay.remove(), 300);
    };

    document.getElementById('invite-close').addEventListener('click', close);
    document.getElementById('invite-done').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    requestAnimationFrame(() => overlay.classList.add('invite-visible'));
  }

});

// =============================================
// HELPER FUNCTIONS
// =============================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
