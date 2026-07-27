const nav = document.getElementById('nav');
const scrollTopBtn = document.getElementById('scroll-top');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scrollFrame = null;
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    scrollFrame = null;
  });
}, { passive: true });

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if (reducedMotion.matches) {
  revealEls.forEach(el => el.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => observer.observe(el));
}

// Copy buttons
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const pre = document.getElementById(targetId);
    if (!pre) return;
    const text = pre.innerText || pre.textContent;
    navigator.clipboard.writeText(text.trim()).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {});
  });
});

// Fetch latest release and wire up OS picker
const dlAssets = { win: null, lin: null };

(async () => {
  try {
    const res = await fetch('https://api.github.com/repos/AumGupta/abyss-jellyfin/releases/latest');
    if (!res.ok) return;
    const data = await res.json();
    dlAssets.lin = (data.assets || []).find(a => a.name.endsWith('.sh')) || null;
    dlAssets.win = (data.assets || []).find(a => a.name.endsWith('.exe')) || null;
    // Auto-detect platform and pre-select
    autoSelectOS();
  } catch (e) { }
})();

function autoSelectOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) selectOS('windows');
  else if (ua.includes('Mac')) selectOS('macos');
  else selectOS('linux');
}

function selectOS(os) {
  const btnActive = document.getElementById('download-btn-active');
  const labelActive = document.getElementById('download-label-active');
  const noteActive = document.getElementById('install-note-active');
  if (!btnActive || !labelActive) return;

  document.querySelectorAll('.os-card').forEach(c => {
    c.classList.toggle('active', c.dataset.os === os);
    c.setAttribute('aria-pressed', c.dataset.os === os);
  });

  const isWin = os === 'windows';
  const asset = isWin ? dlAssets.win : dlAssets.lin;
  const fallback = 'https://github.com/AumGupta/abyss-jellyfin/releases/latest';
  const ext = isWin ? '.exe' : '.sh';
  const platform = os === 'windows' ? 'Windows' : os === 'macos' ? 'macOS' : 'Linux';
  const runNote = isWin
    ? 'For Windows &middot; Requires Jellyfin admin credentials'
    : `For ${platform} &middot; Run with: <code>sudo bash ${asset ? asset.name : 'abyss-setup.sh'}</code>`;

  btnActive.href = asset ? asset.browser_download_url : fallback;
  labelActive.textContent = asset ? `Download ${asset.name}` : `Download Installer ${ext}`;
  noteActive.innerHTML = runNote;
}

// OS card click handlers
document.querySelectorAll('.os-card').forEach(card => {
  card.addEventListener('click', () => selectOS(card.dataset.os));
});

// Hamburger menu
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('nav-mobile');
const mobileQuery = window.matchMedia('(max-width: 768px)');

function closeMobileMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
}

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});
mobileQuery.addEventListener('change', event => { if (!event.matches) closeMobileMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobileMenu(); });

// Scroll to top button
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
});

// Load the YouTube player only after the visitor requests playback.
document.querySelectorAll('.video-facade').forEach(facade => {
  facade.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    const videoId = facade.dataset.videoId;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`;
    iframe.title = 'Abyss theme for Jellyfin';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    facade.replaceWith(iframe);
  }, { once: true });
});

// Accent swatch - update code block on click
const swatches = document.querySelectorAll('.swatch');
const accentValEl = document.querySelector('.accent-val');

swatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    swatches.forEach(s => {
      s.classList.remove('active');
      s.setAttribute('aria-pressed', 'false');
    });
    swatch.classList.add('active');
    swatch.setAttribute('aria-pressed', 'true');

    if (accentValEl) {
      const val = swatch.getAttribute('data-val');
      const rgb = swatch.style.getPropertyValue('--c');
      accentValEl.textContent = val;
      accentValEl.style.color = `rgb(${rgb})`;
      setTimeout(() => { accentValEl.style.color = ''; }, 600);

      const navActive = document.getElementById('prev-nav-active');
      const listIcon = document.getElementById('prev-listitem-icon');
      const playBtn = document.getElementById('prev-play-btn');
      const progress = document.getElementById('prev-card-progress');
      const rgbStr = `rgb(${rgb})`;
      const rgbDim = `rgba(${rgb}, 0.15)`;

      if (navActive) { navActive.style.background = rgbStr; navActive.style.color = '#121212'; }
      if (listIcon) { listIcon.style.background = rgbDim; listIcon.style.color = rgbStr; }
      if (playBtn) { playBtn.style.color = rgbStr; }
      if (progress) { progress.style.background = rgbStr; }
    }
  });
});

// Radius slider
const SNAP_STOPS = [0, 4, 8, 12, 16, 18, 20, 24];
const SNAP_RADIUS = 1.5;

const slider = document.getElementById('radius-slider');
const radiusValEl = document.querySelector('.radius-val');
const radiusDisplay = document.querySelector('.radius-display');
const stopLabels = document.querySelectorAll('.radius-stops button');

function updateRadiusUI(val) {
  const px = `${val}px`;

  if (radiusValEl) radiusValEl.textContent = px;
  if (radiusDisplay) radiusDisplay.textContent = px;
  if (slider) slider.setAttribute('aria-valuenow', val);

  stopLabels.forEach(label => {
    label.classList.toggle('active', parseInt(label.dataset.val) === val);
  });

  if (slider) {
    const pct = (val / 24) * 100;
    slider.style.background = `linear-gradient(to right,
      rgba(245,245,247,0.7) 0%,
      rgba(245,245,247,0.7) ${pct}%,
      rgba(255,255,255,0.08) ${pct}%,
      rgba(255,255,255,0.08) 100%)`;
  }

  const card = document.getElementById('prev-card');
  const playBtn = document.getElementById('prev-play-btn');
  if (card) card.style.borderRadius = px;
  if (playBtn) playBtn.style.borderRadius = px;
}

function snapValue(raw) {
  for (const stop of SNAP_STOPS) {
    if (Math.abs(raw - stop) <= SNAP_RADIUS) return stop;
  }
  return raw;
}

if (slider) {
  slider.addEventListener('input', () => {
    const snapped = snapValue(parseInt(slider.value));
    slider.value = snapped;
    updateRadiusUI(snapped);
  });

  stopLabels.forEach(label => {
    label.addEventListener('click', () => {
      const val = parseInt(label.dataset.val);
      slider.value = val;
      updateRadiusUI(val);
    });
  });

  updateRadiusUI(parseInt(slider.value));
}
