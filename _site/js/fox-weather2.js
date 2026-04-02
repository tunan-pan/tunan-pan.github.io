// fox-weather.js
// Fetches current Seattle weather from Open-Meteo (no API key needed)
// and renders an animated sky behind the fox.
// Falls back silently to the CSS purple if anything fails.
//
// TESTING: open the browser console and call:
//   setWeatherState('sunny')
//   setWeatherState('cloudy')
//   setWeatherState('rainy')
//   setWeatherState('night')
//   setWeatherState('snowy')
//   setWeatherState('auto')   — re-fetch from API

(async () => {

  const foxContainer = document.querySelector('.fox-container');
  if (!foxContainer) return;

  // -----------------------------------------------------------------------
  // Shared mutable state — everything reads from this object
  // -----------------------------------------------------------------------

  const state = {
    weather: 'sunny',
    isSnow: false,
    motionEnabled: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    clouds: [],
    particles: [],
  };

  // -----------------------------------------------------------------------
  // Canvas
  // -----------------------------------------------------------------------

  const canvas = document.createElement('canvas');
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
  window.addEventListener('resize', resize);

  // -----------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------

  const SAFE_TOP = 130;

  const GRADIENTS = {
    sunny: { top: '#87CEEB', bottom: '#E0F0FF' },
    cloudy: { top: '#8A9BB5', bottom: '#C5CEDB' },
    rainy: { top: '#5A6878', bottom: '#8A97A8' },
    snowy: { top: '#7A8FA8', bottom: '#B0C0D0' },
    night: { top: '#0D1B3E', bottom: '#1A2F5E' },
  };

  const CLOUD_COLORS = {
    sunny: 'rgba(255,255,255,0.85)',
    cloudy: 'rgba(200,210,220,0.80)',
    rainy: 'rgba(160,170,180,0.75)',
    snowy: 'rgba(220,228,238,0.80)',
    night: 'rgba(255,255,255,0.12)',
  };

  const CLOUD_COUNTS = { sunny: 0, cloudy: 5, rainy: 0, snowy: 0, night: 0 };

  const CONDITION_LABELS = {
    sunny: 'sunny', cloudy: 'cloudy', rainy: 'rainy', snowy: 'snowy', night: 'night time',
  };

  // -----------------------------------------------------------------------
  // Clouds
  // -----------------------------------------------------------------------

  function rebuildClouds() {
    const count = CLOUD_COUNTS[state.weather] || 2;
    state.clouds = [];
    for (let i = 0; i < count; i++) {
      state.clouds.push({
        x: Math.random() * W,
        y: SAFE_TOP + 10 + Math.random() * (H * 0.35),
        speed: 0.12 + Math.random() * 0.18,
        scale: 0.6 + Math.random() * 0.8,
      });
    }
  }

  function drawCloud(x, y, scale, color) {
    ctx.fillStyle = color;
    const r = 28 * scale;
    const puffs = [
      [0, 0, r],
      [r, -8 * scale, r * 0.85],
      [-r, -4 * scale, r * 0.75],
      [r * 1.8, 4 * scale, r * 0.70],
      [-r * 1.6, 6 * scale, r * 0.65],
    ];
    ctx.beginPath();
    for (const [dx, dy, pr] of puffs) {
      ctx.moveTo(x + dx + pr, y + dy);
      ctx.arc(x + dx, y + dy, pr, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // -----------------------------------------------------------------------
  // Particles (rain / snow)
  // -----------------------------------------------------------------------

  const PARTICLE_COUNT = 80;

  function rebuildParticles() {
    state.particles = [];
    if (state.weather === 'rainy' || state.weather === 'snowy') {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        state.particles.push(makeParticle(true));
      }
    }
  }

  function makeParticle(randomY) {
    return {
      x: Math.random() * W,
      y: randomY ? SAFE_TOP + Math.random() * (H - SAFE_TOP) : SAFE_TOP,
      speed: state.isSnow ? 1 + Math.random() * 1.5 : 6 + Math.random() * 6,
      drift: state.isSnow ? (Math.random() - 0.5) * 0.8 : 1.5,
      len: state.isSnow ? 0 : 8 + Math.random() * 8,
      alpha: 0.3 + Math.random() * 0.4,
    };
  }

  function drawParticles() {
    for (const p of state.particles) {
      if (state.isSnow) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
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
    ctx.strokeStyle = 'rgba(255,220,80,0.5)';
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
    grd.addColorStop(0, 'rgba(255,240,120,1)');
    grd.addColorStop(0.7, 'rgba(255,210,60,1)');
    grd.addColorStop(1, 'rgba(255,180,30,0.9)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  // -----------------------------------------------------------------------
  // Moon (offscreen punch-out crescent)
  // -----------------------------------------------------------------------

  function drawMoon() {
    const x = W * 0.75;
    const y = SAFE_TOP + 55;
    const r = 28;

    const off = document.createElement('canvas');
    off.width = r * 4;
    off.height = r * 4;
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

  function applyNavTheme(weather) {
    const isNight = weather === 'night';
    // Only apply white text on desktop — mobile nav has white background
    if (window.innerWidth <= 768) return;
    document.querySelectorAll('.main-nav a').forEach(a => {
      a.style.color = isNight ? '#fff' : '';
    });
    const logo = document.querySelector('.logo span');
    if (logo) logo.style.color = isNight ? '#fff' : '';
  }

  window.addEventListener('resize', () => applyNavTheme(state.weather));


  // -----------------------------------------------------------------------
  // Info button + popup
  // -----------------------------------------------------------------------

  // Built once, refs kept here so updateWeatherLabel can find the element
  let weatherLabelEl = null;
  let motionCheckbox = null;

  function buildInfoButton() {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'About this animation');
    btn.textContent = '?';
    btn.style.cssText = `
      position: absolute;
      bottom: 30%;
      right: 30px;
      z-index: 10;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 0;
      background: rgba(84, 84, 84, 1);
      color: rgba(255,255,255,0.85);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.2s ease;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = '#E93600');
    btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(84, 84, 84, 1)');

    const popup = document.createElement('div');
    popup.style.cssText = `
      position: absolute;
      bottom: calc(28% + 38px);
      right: 14px;
      z-index: 11;
      width: 230px;
      background: rgba(255,255,255,0.92);
      border-radius: 12px;
      padding: 14px 16px;
      font-family: inherit;
      font-size: 0.8rem;
      line-height: 1.55;
      color: #333;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: none;
    `;

    // Location line — kept as a ref so we can update it after fetch
    const locationLine = document.createElement('p');
    locationLine.style.cssText = 'margin: 0 0 10px; display: flex; align-items: flex-start; gap: 6px;';
    weatherLabelEl = document.createElement('span');
    weatherLabelEl.textContent = 'Loading Seattle weather...';
    locationLine.innerHTML = '';
    const pin = document.createElement('span');
    pin.style.flexShrink = '0';
    pin.textContent = '📍';
    locationLine.appendChild(pin);
    locationLine.appendChild(weatherLabelEl);

    const divider = document.createElement('hr');
    divider.style.cssText = 'border:none; border-top:1px solid #ddd; margin:10px 0;';

    const blurb = document.createElement('p');
    blurb.style.cssText = 'margin: 0 0 12px;';
    blurb.textContent = "This little section of the page is an interactive playground - give it a try, and don't forget to pet the fox 😉 If the motion isn't your thing, you can turn it off below.";

    const toggleRow = document.createElement('label');
    toggleRow.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.78rem; color:#555;';
    motionCheckbox = document.createElement('input');
    motionCheckbox.type = 'checkbox';
    motionCheckbox.checked = state.motionEnabled;
    motionCheckbox.style.cssText = 'accent-color:#7C1D9E; width:15px; height:15px; cursor:pointer;';
    motionCheckbox.addEventListener('change', () => {
      state.motionEnabled = motionCheckbox.checked;
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
    const label = CONDITION_LABELS[weather] || weather;
    weatherLabelEl.textContent = `Currently ${label} in Seattle, WA`;
  }

  // -----------------------------------------------------------------------
  // Apply state — single source of truth
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
    const condition = (() => {
      if (code === 0) return 'sunny';
      if (code <= 2) return 'sunny';
      if (code <= 48) return 'cloudy';
      if (code >= 51 && code <= 67) return 'rainy';
      if (code >= 71 && code <= 77) return 'snowy';
      if (code >= 80 && code <= 82) return 'rainy';
      if (code >= 95) return 'rainy';
      return 'cloudy';
    })();
    const weather = isDay ? condition : 'night';
    const isSnow = (code >= 71 && code <= 77);
    applyState(weather, isSnow);
  }

  // -----------------------------------------------------------------------
  // Public testing hook — attached to window so console can reach it
  // -----------------------------------------------------------------------

  window.setWeatherState = async (s) => {
    if (s === 'auto') {
      await fetchAndApply();
      console.log(`[fox-weather] auto → ${state.weather}`);
    } else {
      applyState(s, s === 'snowy');
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

    // Sky
    const skyGrd = ctx.createLinearGradient(0, 0, 0, H);
    skyGrd.addColorStop(0, grad.top);
    skyGrd.addColorStop(1, grad.bottom);
    ctx.fillStyle = skyGrd;
    ctx.fillRect(0, 0, W, H);

    // Remove CSS purple after first paint
    if (firstFrame) {
      foxContainer.style.backgroundColor = 'transparent';
      firstFrame = false;
    }

    if (state.weather === 'night') drawStars(t);
    if (state.weather === 'sunny') drawSun(t);
    if (state.weather === 'night') drawMoon();

    for (const cloud of state.clouds) {
      if (state.motionEnabled) {
        cloud.x += cloud.speed;
        if (cloud.x > W + 120) cloud.x = -120;
      }
      drawCloud(cloud.x, cloud.y, cloud.scale, cloudColor);
    }

    if ((state.weather === 'rainy' || state.weather === 'snowy') && state.motionEnabled) {
      drawParticles();
    }

    requestAnimationFrame(draw);
  }

  // -----------------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------------

  buildInfoButton(); // build DOM first so weatherLabelEl exists before applyState
  resize();          // size canvas (W/H now valid)

  try {
    await fetchAndApply();
  } catch (e) {
    foxContainer.style.backgroundColor = '';
    canvas.remove();
    return;
  }

  requestAnimationFrame(draw);

})();
