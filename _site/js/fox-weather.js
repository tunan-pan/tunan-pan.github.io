// fox-weather.js
// Fetches current Seattle weather from Open-Meteo (no API key needed)
// and renders an animated sky behind the fox.
// Falls back silently to the CSS purple if anything fails.
// Requires fox-motion.js to be loaded first.
//
// TESTING — open browser console and call:
//   setWeatherState('sunny')
//   setWeatherState('cloudy')
//   setWeatherState('rainy')
//   setWeatherState('snowy')
//   setWeatherState('night-clear')
//   setWeatherState('night-cloudy')
//   setWeatherState('night-rainy')
//   setWeatherState('night-snowy')
//   setWeatherState('auto')

(async () => {

  const foxContainer = document.querySelector('.fox-container');
  if (!foxContainer) return;

  // -----------------------------------------------------------------------
  // Shared mutable state
  // -----------------------------------------------------------------------

  const state = {
    weather: 'sunny',
    isSnow: false,
    clouds: [],
    particles: [],
    get motionEnabled() { return window.FoxMotion.enabled; },
  };

  // -----------------------------------------------------------------------
  // Canvas
  // -----------------------------------------------------------------------

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  `;
  foxContainer.insertBefore(canvas, foxContainer.firstChild);

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let firstFrame = true;

  function resize() {
    const rect = foxContainer.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
    rebuildClouds();
    rebuildParticles();
  }
  window.addEventListener('resize', () => {
    resize();
    applyNavTheme(state.weather);
  });

  window.addEventListener('scroll', () => applyNavTheme(state.weather));


  // -----------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------

  const SAFE_TOP = 130;

  // Night states share a dark sky; day states have their own
  const GRADIENTS = {
    'sunny': { top: '#BCF3FF', mid: '#A2CAFF', bottom: '#F0E2FF' }, //top: '#87CEEB', mid: '#C9E8F5', horizon: '#FFD9B0', bottom: '#FFE8CC'
    'cloudy': { top: '#EFF5FF', horizon: '#3984AB', bottom: '#88739B' },
    'rainy': { top: '#D9E7FA', horizon: '#045070', bottom: '#3a274f' }, //top: '#D9E7FA', horizon: '#2586B0', bottom: '#9182A0' 
    'snowy': { top: '#00265C', horizon: '#22B0E0', bottom: '#FFE3D8' },
    'night-clear': { top: '#220029', horizon: '#06244A', bottom: '#3F2C7F' },
    'night-cloudy': { top: '#220029', horizon: '#06244A', bottom: '#3F2C7F' }, //top: '#0D1B3E', bottom: '#1A2F5E'
    'night-rainy': { top: '#220029', horizon: '#06244A', bottom: '#3F2C7F' }, //top: '#080F1F', bottom: '#0F1E38'
    'night-snowy': { top: '#220029', horizon: '#06244A', bottom: '#3F2C7F' }, //top: '#111828', bottom: '#1C2A42'
  };

  const CLOUD_COLORS = {
    'sunny': 'rgba(255,255,255,0.75)',
    'cloudy': 'rgba(222, 228, 233, 0.9)',
    //'rainy': 'rgba(160,170,180,0.75)',
    //'snowy': 'rgba(220,228,238,0.80)',
    //'night-clear': 'rgba(255,255,255,0.12)',
    'night-cloudy': 'rgba(36, 55, 100, 0.85)',
    //'night-rainy': 'rgba(40,55,85,0.90)',
    //'night-snowy': 'rgba(80,95,130,0.80)',
  };

  // Use ?? 2 not || 2 so that 0 is respected (0 is falsy, nullish coalescing fixes this)
  const CLOUD_COUNTS = {
    'sunny': 2,
    'cloudy': 16,
    'rainy': 0,
    'snowy': 0,
    'night-clear': 0,
    'night-cloudy': 16,
    'night-rainy': 0,
    'night-snowy': 0,
  };

  const CONDITION_LABELS = {
    'sunny': 'sunny',
    'cloudy': 'cloudy',
    'rainy': 'rainy',
    'snowy': 'snowy',
    'night-clear': 'clear',
    'night-cloudy': 'cloudy',
    'night-rainy': 'rainy',
    'night-snowy': 'snowy',
  };

  function isNightState(w) { return w.startsWith('night'); }

  // -----------------------------------------------------------------------
  // Clouds
  // -----------------------------------------------------------------------

  function rebuildClouds() {
    const count = CLOUD_COUNTS[state.weather] ?? 2;
    state.clouds = [];
    for (let i = 0; i < count; i++) {
      state.clouds.push({
        x: Math.random() * W,
        y: SAFE_TOP + 10 + Math.random() * (H * 0.35),
        speed: 0.12 + Math.random() * 0.18,
        scale: 1 + Math.random() * 1.2,
      });
    }
  }

  function drawCloud(x, y, scale, color) {
    ctx.fillStyle = color;
    const r = 28 * scale;  // base radius, scaled so clouds can be different sizes

    const puffs = [
      [-r * 1.7, 4 * scale, r * 0.3], // far left puff, slightly down, smallest
      [-r * 1.1, 6 * scale, r * 0.6], // left puff, slightly up, smaller

      [0, 0, r],        // centre puff

      [r * 1.1, 2.5 * scale, r * 0.75], // right puff, slightly up, slightly smaller
      [r * 2, 4 * scale, r * 0.40], // far right puff, slightly down, smaller
    ];

    ctx.beginPath();
    for (const [dx, dy, pr] of puffs) {
      ctx.moveTo(x + dx + pr, y + dy); // move to the right edge of this circle
      ctx.arc(x + dx, y + dy, pr, 0, Math.PI * 2); // draw the full circle
    }
    ctx.fill(); // fill all circles at once as one shape
  }

  // -----------------------------------------------------------------------
  // Particles
  // -----------------------------------------------------------------------

  const PARTICLE_COUNT = 80;

  function rebuildParticles() {
    state.particles = [];
    const w = state.weather;
    if (w === 'rainy' || w === 'snowy' || w === 'night-rainy' || w === 'night-snowy') {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        state.particles.push(makeParticle(true));
      }
    }
  }

  function makeParticle(randomY) {
    const snow = state.isSnow;
    return {
      x: Math.random() * W,
      y: randomY ? SAFE_TOP + Math.random() * (H - SAFE_TOP) : SAFE_TOP,
      speed: snow ? 1 + Math.random() * 1.5 : 6 + Math.random() * 6,
      drift: snow ? (Math.random() - 0.5) * 0.8 : 1.5,
      len: snow ? 0 : 8 + Math.random() * 8,
      alpha: 0.3 + Math.random() * 0.4,
    };
  }

  function drawParticles() {
    for (const p of state.particles) {
      if (state.isSnow) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); // 3rd is size of snow
        ctx.fillStyle = `rgba(220,235,255,${p.alpha})`;
        ctx.fill();
      } else {
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = 'rgba(180,210,240,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.drift, p.y + p.len);
        ctx.stroke();
      }
      p.x += p.drift;
      p.y += p.speed;
      if (p.y > H + 10) { p.x = Math.random() * W; p.y = SAFE_TOP; }
    }
    ctx.globalAlpha = 1;
  }

  // -----------------------------------------------------------------------
  // Sun
  // -----------------------------------------------------------------------

  function drawSun(t) {
    const x = W * 0.75;
    const y = SAFE_TOP + 60;
    const r = 36;

    ctx.save();
    ctx.translate(x, y);
    if (state.motionEnabled) ctx.rotate(t * 0.0002);
    ctx.strokeStyle = 'rgba(255,180,30,1)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6));
      ctx.lineTo(Math.cos(a) * (r + 18), Math.sin(a) * (r + 18));
      ctx.stroke();
    }
    ctx.restore();

    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,180,30,1)');
    grd.addColorStop(0.7, 'rgba(255,180,30,1)');
    grd.addColorStop(1, 'rgba(255,180,30,0.9)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  // -----------------------------------------------------------------------
  // Moon
  // -----------------------------------------------------------------------

  function drawMoon() {
    const x = W * 0.75;
    const y = SAFE_TOP + 55;
    const r = 28;

    const off = document.createElement('canvas');
    off.width = off.height = r * 4;
    const oc = off.getContext('2d');
    const cx = r * 2, cy = r * 2;

    oc.beginPath();
    oc.arc(cx, cy, r, 0, Math.PI * 2);
    oc.fillStyle = 'rgba(220,230,255,0.95)';
    oc.fill();

    oc.globalCompositeOperation = 'destination-out';
    oc.beginPath();
    oc.arc(cx + 11, cy - 4, r * 0.84, 0, Math.PI * 2);
    oc.fillStyle = 'rgba(0,0,0,1)';
    oc.fill();
    oc.globalCompositeOperation = 'source-over';

    ctx.drawImage(off, x - r * 2, y - r * 2);
  }

  // -----------------------------------------------------------------------
  // Stars
  // -----------------------------------------------------------------------

  const STARS = Array.from({ length: 28 }, () => ({
    tx: Math.random(), ty: Math.random(),
    r: 0.8 + Math.random() * 1.4,
    a: 0.4 + Math.random() * 0.6,
  }));

  function drawStars(t) {
    for (const s of STARS) {
      const sx = s.tx * W;
      const sy = SAFE_TOP + s.ty * (H - SAFE_TOP);
      const twinkle = state.motionEnabled
        ? s.a * (0.7 + 0.3 * Math.sin(t * 0.001 + s.tx * 99))
        : s.a;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${twinkle.toFixed(3)})`;
      ctx.fill();
    }
  }

  // -----------------------------------------------------------------------
  // Nav night mode
  // -----------------------------------------------------------------------
  /* 
  To add another state that needs white text — say you add a dusk state — you'd just change the night condition:
      const needsWhite = isNightState(weather) || weather === 'dusk';
  then use needsWhite everywhere instead of night 
  */

  // Inject a style block for hamburger lines (pseudo-elements can't be targeted with inline styles)
  const nightNavStyle = document.createElement('style');
  nightNavStyle.id = 'fox-night-nav-style';
  document.head.appendChild(nightNavStyle);

  function applyNavTheme(weather) {
    const needsWhite = isNightState(weather) || weather === 'snowy';
    const mobile = window.innerWidth <= 768;
    const scrolled = document.querySelector('.site-header')?.classList.contains('scrolled');
    const menuOpen = document.querySelector('.mobile-menu-toggle')?.classList.contains('active');

    // Once scrolled, header has white bg — always use dark text regardless of weather
    const useWhite = needsWhite && !scrolled;

    // Logo: white at all sizes (but not when scrolled)
    const logo = document.querySelector('.logo span');
    if (logo) logo.style.color = useWhite ? '#fff' : '';

    // Nav links: white at desktop only, not when scrolled
    document.querySelectorAll('.main-nav a').forEach(a => {
      a.style.color = (useWhite && !mobile) ? '#fff' : '';
    });

    // Hamburger lines: white when mobile + needsWhite + not scrolled + menu closed
    // When menu is open it's on a white background so must be dark
    nightNavStyle.textContent = (useWhite && mobile && !menuOpen)
      ? `.hamburger, .hamburger::before, .hamburger::after { background-color: #fff !important; }`
      : '';
  }

  // for hamburger toggle
  document.querySelector('.mobile-menu-toggle')
    ?.addEventListener('click', () => {
      // Small delay so .active class has been applied before we check it
      setTimeout(() => applyNavTheme(state.weather), 10);
    });

  // -----------------------------------------------------------------------
  // Info button + popup
  // -----------------------------------------------------------------------

  let weatherLabelEl = null;
  let motionCheckbox = null;
  // rgba(84, 84, 84, 1);
  function buildInfoButton() {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'About the hero image');
    btn.textContent = '?';
    btn.style.cssText = `
      position: absolute;
      bottom: 20%;
      right: 30px;
      z-index: 10;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid #4b4b4b; 
      background: #F6F6F6;
      color: #000);
      font-size: 16px;
      font-family: "Lexend";
      cursor: pointer;
      transition: background 0.2s ease;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = '#ffffff');
    btn.addEventListener('mouseleave', () => btn.style.background = '#F6F6F6');

    const popup = document.createElement('div');
    popup.style.cssText = `
      position: absolute;
      bottom: calc(20% + 38px);
      right: 30px;
      z-index: 11;
      width: 240px;
      background: rgba(255,255,255,0.96);
      border-radius: 12px;
      padding: 14px 16px;
      font-family: inherit;
      font-size: 0.8rem;
      line-height: 1.55;
      color: #333;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: none;
    `;

    // Weather location line
    const locationLine = document.createElement('p');
    locationLine.style.cssText = 'margin: 0 0 10px; display: flex; align-items: flex-start; gap: 6px;';
    weatherLabelEl = document.createElement('span');
    weatherLabelEl.textContent = 'Loading Seattle weather...';
    const pin = document.createElement('span');
    pin.style.flexShrink = '0';
    pin.textContent = '📍';
    locationLine.appendChild(pin);
    locationLine.appendChild(weatherLabelEl);

    const divider = document.createElement('hr');
    divider.style.cssText = 'border:none; border-top:1px solid #ddd; margin:10px 0;';

    const blurb = document.createElement('p');
    blurb.style.cssText = 'margin: 0 0 12px;';
    blurb.textContent = "This little section of the page is an interactive playground — give it a try, and don't forget to pet the fox 😉 If the motion isn't your thing, you can turn it off below.";

    const toggleRow = document.createElement('label');
    toggleRow.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.78rem; color:#555;';
    motionCheckbox = document.createElement('input');
    motionCheckbox.type = 'checkbox';
    motionCheckbox.checked = window.FoxMotion.enabled;
    motionCheckbox.style.cssText = 'accent-color:#7C1D9E; width:15px; height:15px; cursor:pointer;';
    motionCheckbox.addEventListener('change', () => {
      window.FoxMotion.set(motionCheckbox.checked);
    });
    toggleRow.appendChild(motionCheckbox);
    toggleRow.appendChild(document.createTextNode('Enable motion'));

    popup.appendChild(locationLine);
    popup.appendChild(divider);
    popup.appendChild(blurb);
    popup.appendChild(toggleRow);

    let open = false;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      open = !open;
      popup.style.display = open ? 'block' : 'none';
    });
    document.addEventListener('click', e => {
      if (open && !popup.contains(e.target) && e.target !== btn) {
        open = false;
        popup.style.display = 'none';
      }
    });

    foxContainer.appendChild(popup);
    foxContainer.appendChild(btn);
  }

  function updateWeatherLabel(weather) {
    if (!weatherLabelEl) return;
    // const night = isNightState(weather);
    const condition = CONDITION_LABELS[weather] || weather;
    // const timeOfDay = night ? 'tonight' : 'right now';
    weatherLabelEl.textContent = `Currently ${condition} in Seattle, WA`; // (${timeOfDay})
  }

  // -----------------------------------------------------------------------
  // Apply state
  // -----------------------------------------------------------------------

  function applyState(weather, isSnow) {
    state.weather = weather;
    state.isSnow = !!isSnow;
    rebuildClouds();
    rebuildParticles();
    applyNavTheme(weather);
    updateWeatherLabel(weather);
  }

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  async function fetchAndApply() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=47.6062&longitude=-122.3321&current=weather_code,is_day&timezone=America%2FLos_Angeles`;
    const res = await fetch(url);
    const data = await res.json();
    const code = data.current.weather_code;
    const isDay = data.current.is_day === 1;
    const isSnow = (code >= 71 && code <= 77);

    const dayCondition = (() => {
      if (code <= 2) return 'sunny';
      if (code <= 48) return 'cloudy';
      if (code >= 51 && code <= 67) return 'rainy';
      if (code >= 71 && code <= 77) return 'snowy';
      if (code >= 80 && code <= 82) return 'rainy';
      if (code >= 95) return 'rainy';
      return 'cloudy';
    })();

    const weather = isDay ? dayCondition : `night-${dayCondition === 'sunny' ? 'clear' : dayCondition}`;
    applyState(weather, isSnow);
  }

  // -----------------------------------------------------------------------
  // Public testing hook
  // -----------------------------------------------------------------------

  window.setWeatherState = async (s) => {
    if (s === 'auto') {
      sessionStorage.removeItem('fox-weather-test');
      await fetchAndApply();
      console.log(`[fox-weather] auto → ${state.weather}`);
    } else {
      sessionStorage.setItem('fox-weather-test', s);
      applyState(s, s.includes('snow'));
      console.log(`[fox-weather] set → ${state.weather}`);
    }
  };

  // -----------------------------------------------------------------------
  // Render loop
  // -----------------------------------------------------------------------

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    const grad = GRADIENTS[state.weather] || GRADIENTS.sunny;
    const cloudColor = CLOUD_COLORS[state.weather] || CLOUD_COLORS.sunny;
    const night = isNightState(state.weather);

    // Sky gradient
    const skyGrd = ctx.createLinearGradient(0, 0, 0, H);
    if (grad.top) skyGrd.addColorStop(0, grad.top);
    if (grad.mid) skyGrd.addColorStop(0.35, grad.mid);
    if (grad.horizon) skyGrd.addColorStop(0.55, grad.horizon);
    if (grad.bottom) skyGrd.addColorStop(1, grad.bottom);
    ctx.fillStyle = skyGrd;
    ctx.fillRect(0, 0, W, H);

    // Remove CSS purple after first paint
    if (firstFrame) {
      foxContainer.style.backgroundColor = 'transparent';
      firstFrame = false;
    }

    if (night) drawStars(t);
    if (state.weather === 'sunny') drawSun(t);
    if (night) drawMoon();

    for (const cloud of state.clouds) {
      if (state.motionEnabled) {
        cloud.x += cloud.speed;
        if (cloud.x > W + 120) cloud.x = -120;
      }
      drawCloud(cloud.x, cloud.y, cloud.scale, cloudColor);
    }

    const hasParticles = state.weather === 'rainy' || state.weather === 'snowy'
      || state.weather === 'night-rainy' || state.weather === 'night-snowy';
    if (hasParticles && state.motionEnabled) drawParticles();

    requestAnimationFrame(draw);
  }

  // -----------------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------------

  buildInfoButton();
  resize();

  try {

    const saved = sessionStorage.getItem('fox-weather-test');
    if (saved) {
      applyState(saved, saved.includes('snow'));
      console.log(`[fox-weather] using saved test state → ${saved}`);
    } else {
      await fetchAndApply();
    }

  } catch (e) {
    foxContainer.style.backgroundColor = '';
    canvas.remove();
    return;
  }

  requestAnimationFrame(draw);

})();
