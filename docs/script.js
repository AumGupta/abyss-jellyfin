const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => observer.observe(el));

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
    });
  });
});

// Fetch latest release from GitHub API and update download button
(async () => {
  const btn = document.getElementById('download-btn');
  const label = document.getElementById('download-label');
  if (!btn || !label) return;

  try {
    const res = await fetch('https://api.github.com/repos/AumGupta/abyss-jellyfin/releases/latest');
    if (!res.ok) return;
    const data = await res.json();

    const tag = data.tag_name || '';
    const asset = (data.assets || []).find(a => a.name.endsWith('.exe'));

    if (asset) {
      btn.href = asset.browser_download_url;
      label.textContent = `Download ${asset.name}`;
    } else {
      btn.href = data.html_url || btn.href;
      if (tag) label.textContent = `Download Installer ${tag}`;
    }
  } catch (e) {
    // Silently fall back to releases/latest link already set in href
  }
})();

// Hamburger menu
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('nav-mobile');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

// Scroll to top button
const scrollTopBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
const stopLabels = document.querySelectorAll('.radius-stops span');

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

// Smooth anchor scroll with fixed nav offset
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY + 10;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => {
      const refined = target.getBoundingClientRect().top + window.scrollY + 10;
      if (Math.abs(refined - window.scrollY) > 10) {
        window.scrollTo({ top: refined, behavior: 'smooth' });
      }
    }, 600);
  });
});