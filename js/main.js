const CONFIG = {
  startTimeMinutes: 7 * 60 + 20,
  targetArrival: 9 * 60 + 15,
  hardDeadline: 9 * 60 + 40,
  stressMax: 100,
  baseFuel: 92,
  timeScale: 48, // 1 сек реального времени = 48 сек игрового
  offroadStressRate: 9,
  idleFuelLoss: 0.005,
  moveFuelLoss: 0.02,
};

const routeAreas = [
  { x: 70, y: 430, width: 780, height: 120 }, // Тбилисский проспект
  { x: 620, y: 300, width: 230, height: 260 }, // мост и заезд на С. Вургуна
  { x: 720, y: 120, width: 160, height: 240 }, // Низами
  { x: 480, y: 330, width: 180, height: 120 }, // кольцо у метро 28 Мая
];

const destinationArea = { x: 760, y: 120, width: 110, height: 110 };

const locationZones = [
  {
    name: 'Ясамальский спуск',
    area: { x: 70, y: 430, width: 260, height: 120 },
    note: 'Фуад выезжает из двора, вокруг ещё темновато. Дома на Hüseyn Cavid Avenue позади.'
  },
  {
    name: 'Проспект Тбилиси',
    area: { x: 250, y: 440, width: 330, height: 120 },
    note: 'Плотное движение к центру. Ветер с Каспия приносит прохладу.'
  },
  {
    name: 'Наримановский район',
    area: { x: 520, y: 360, width: 160, height: 120 },
    note: 'Слева стадион, справа ранние продавцы чайхан. Здесь часто дежурят гаишники.'
  },
  {
    name: '28 Мая',
    area: { x: 620, y: 260, width: 200, height: 160 },
    note: 'Турникеты метро уже переполнены. Движение плотное, нужно держать дистанцию.'
  },
  {
    name: 'Улица Низами',
    area: { x: 720, y: 120, width: 160, height: 200 },
    note: 'Исторический центр, витрины оживают. Entertainer почти рядом.'
  }
];

const policeStops = [
  {
    id: 'narimanov-stop',
    name: 'Сержант Рагимов',
    x: 560,
    y: 390,
    radius: 70,
    text: 'Доброе утро. Давайте-ка документы. И что за тёмная тонировка?',
    options: [
      {
        label: 'Спокойно передать техпаспорт и страховку',
        description: 'Вы уверены в порядке документов.',
        result: {
          stress: 6,
          time: 7,
          log: 'Рагимов внимательно проверил страховку и пожелал счастливой дороги.',
          tone: 'success'
        }
      },
      {
        label: 'Попытаться пошутить и перевести разговор',
        description: 'Рискованно, но иногда работает.',
        result: {
          stress: 10,
          time: 5,
          log: 'Шутка не зашла. Пришлось повторно показать техпаспорт.',
          tone: 'warning'
        }
      },
      {
        label: 'Предложить “решить вопрос быстрее”',
        description: 'Нарушение, но экономит время при удаче.',
        result: {
          stress: 18,
          time: -4,
          log: 'Неловкая пауза... Сержант намек понял, но предупредил не злоупотреблять.',
          tone: 'danger'
        }
      }
    ]
  },
  {
    id: 'nizami-stop',
    name: 'Инспектор Аббасов',
    x: 770,
    y: 220,
    radius: 60,
    text: 'Полосы тут всего две, а вы перестраиваетесь без поворотника. Как так, Фуад?',
    options: [
      {
        label: 'Признать ошибку и извиниться',
        description: 'Честность может смягчить инспектора.',
        result: {
          stress: 8,
          time: 4,
          log: 'Аббасов прочитал нотацию, но ограничился предупреждением.',
          tone: 'warning'
        }
      },
      {
        label: 'Показать запись регистратора',
        description: 'Докажите, что вы включали поворотник.',
        result: {
          stress: 12,
          time: 10,
          log: 'Видео подтвердило манёвр. Драгоценные минуты ушли, но без штрафа.',
          tone: 'success'
        }
      },
      {
        label: 'Стоять на своём',
        description: 'Спор до последнего слова.',
        result: {
          stress: 22,
          time: 12,
          log: 'Спор затянулся. Приехал старший лейтенант, выписали предупреждение.',
          tone: 'danger'
        }
      }
    ]
  }
];

const trafficEvents = [
  {
    id: 'yasamal-bump',
    area: { x: 110, y: 450, width: 160, height: 80 },
    message: 'Во дворе дворники оставили кучу щебня — подвеска стонет, придётся объезжать медленно.',
    stress: 4,
    time: 3,
    tone: 'warning'
  },
  {
    id: 'may28-jam',
    area: { x: 660, y: 280, width: 150, height: 120 },
    message: 'Перед 28 Мая образовалась пробка: автобус с туристами застрял на полосе. Скорость падает.',
    stress: 7,
    time: 6,
    tone: 'warning'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const statTime = document.getElementById('statTime');
  const statStress = document.getElementById('statStress');
  const statFuel = document.getElementById('statFuel');
  const statMood = document.getElementById('statMood');
  const statLocation = document.getElementById('statLocation');
  const logContainer = document.getElementById('eventLog');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');

  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const overlayChoices = document.getElementById('overlayChoices');
  const overlayClose = document.getElementById('overlayClose');
  const toast = document.getElementById('toast');

  const backgroundBlocks = Array.from({ length: 22 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    width: 60 + Math.random() * 90,
    height: 40 + Math.random() * 90,
  }));

  const skyline = Array.from({ length: 9 }, (_, i) => ({
    x: 60 + i * 100,
    width: 48 + Math.random() * 24,
    height: 60 + Math.random() * 110,
  }));

  const state = {
    running: false,
    paused: false,
    blocked: false,
    lastFrame: 0,
    timeMinutes: CONFIG.startTimeMinutes,
    stress: 12,
    fuel: CONFIG.baseFuel,
    location: locationZones[0].name,
    mood: 'спокойный',
    logCount: 0,
    lastOffroadNote: 0,
    activeOverlay: null,
  };

  const car = {
    x: 140,
    y: 520,
    width: 28,
    height: 46,
    angle: -Math.PI / 2,
    velocity: 0,
    maxSpeed: 150,
    acceleration: 120,
    braking: 220,
    turnRate: 2.1,
    friction: 48,
  };

  const pressed = new Set();

  function resetGame() {
    state.running = false;
    state.paused = false;
    state.blocked = false;
    state.lastFrame = 0;
    state.timeMinutes = CONFIG.startTimeMinutes;
    state.stress = 12;
    state.fuel = CONFIG.baseFuel;
    state.location = locationZones[0].name;
    state.mood = 'спокойный';
    state.logCount = 0;
    state.lastOffroadNote = 0;
    state.activeOverlay = null;

    car.x = 140;
    car.y = 520;
    car.angle = -Math.PI / 2;
    car.velocity = 0;

    policeStops.forEach(stop => { stop.resolved = false; });
    trafficEvents.forEach(ev => { ev.triggered = false; });

    logContainer.innerHTML = '';
    logEvent('Будильник сработал в 6:45. Фуад сел в машину и готов выезжать из Ясамала.', 'info');
    updateStats();
    draw();

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Пауза';
    resetBtn.disabled = true;
    overlay.classList.add('hidden');
    overlayChoices.innerHTML = '';
    overlayClose.disabled = true;
    overlayClose.textContent = 'Выберите действие';
    toast.classList.remove('show');
  }

  function startGame() {
    if (state.running) return;
    state.running = true;
    state.paused = false;
    state.lastFrame = performance.now();
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    logEvent('Маршрут построен: Ясамал → 28 Мая → Низами. Впереди утренние пробки.', 'info');
    requestAnimationFrame(frame);
  }

  function pauseGame() {
    if (!state.running) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'Продолжить' : 'Пауза';
    logEvent(state.paused ? 'Пауза. Фуад решает перевести дух у обочины.' : 'Продолжаем движение.', 'info');
  }

  function frame(ts) {
    if (!state.running) return;
    const dt = Math.min((ts - state.lastFrame) / 1000, 0.06);
    state.lastFrame = ts;

    if (!state.paused && !state.blocked) {
      updatePhysics(dt);
      updateTimeline(dt);
      checkEvents();
    }

    draw();
    requestAnimationFrame(frame);
  }

  function updatePhysics(dt) {
    const forward = pressed.has('ArrowUp') || pressed.has('KeyW');
    const back = pressed.has('ArrowDown') || pressed.has('KeyS');
    const left = pressed.has('ArrowLeft') || pressed.has('KeyA');
    const right = pressed.has('ArrowRight') || pressed.has('KeyD');
    const brake = pressed.has('Space');

    if (forward) {
      car.velocity = Math.min(car.velocity + car.acceleration * dt, currentMaxSpeed());
    }
    if (back) {
      car.velocity = Math.max(car.velocity - car.acceleration * dt * 0.7, -40);
    }
    if (!forward && !back) {
      const friction = car.friction + (brake ? car.braking : 0);
      if (car.velocity > 0) {
        car.velocity = Math.max(0, car.velocity - friction * dt);
      } else if (car.velocity < 0) {
        car.velocity = Math.min(0, car.velocity + friction * dt);
      }
    }
    if (brake && car.velocity > 0) {
      car.velocity = Math.max(0, car.velocity - car.braking * dt);
    }

    if (Math.abs(car.velocity) > 5) {
      const turnFactor = Math.min(1, Math.abs(car.velocity) / currentMaxSpeed());
      if (left) car.angle -= car.turnRate * dt * turnFactor;
      if (right) car.angle += car.turnRate * dt * turnFactor;
    }

    car.x += Math.cos(car.angle) * car.velocity * dt;
    car.y += Math.sin(car.angle) * car.velocity * dt;

    const margin = 16;
    car.x = Math.max(margin, Math.min(canvas.width - margin, car.x));
    car.y = Math.max(margin, Math.min(canvas.height - margin, car.y));

    const onRoad = isOnRoad(car.x, car.y);
    if (!onRoad) {
      car.velocity *= 0.85;
      state.stress = Math.min(CONFIG.stressMax, state.stress + CONFIG.offroadStressRate * dt);
      if (state.lastOffroadNote > 2.5) {
        logEvent('Фуад переезжает бордюр, подвеска ругается. Лучше вернуться на главную.', 'warning');
        showToast('Бордюр! Машина недовольна.');
        state.lastOffroadNote = 0;
      }
    }
    state.lastOffroadNote += dt;

    const fuelLoss = Math.abs(car.velocity) > 10 ? CONFIG.moveFuelLoss : CONFIG.idleFuelLoss;
    state.fuel = Math.max(0, state.fuel - fuelLoss * dt * CONFIG.timeScale);

    if (state.fuel <= 0 && car.velocity > 0) {
      car.velocity = Math.max(0, car.velocity - car.braking * dt);
    }
  }

  function currentMaxSpeed() {
    if (state.stress > 85) return car.maxSpeed * 0.55;
    if (state.stress > 60) return car.maxSpeed * 0.7;
    if (state.stress > 40) return car.maxSpeed * 0.85;
    return car.maxSpeed;
  }

  function updateTimeline(dt) {
    state.timeMinutes += dt * CONFIG.timeScale;
    if (Math.abs(car.velocity) < 5) {
      state.stress = Math.max(0, state.stress - dt * 1.3);
    } else {
      state.stress = Math.min(CONFIG.stressMax, state.stress + dt * 0.9);
    }

    updateStats();

    if (state.timeMinutes >= CONFIG.hardDeadline) {
      concludeGame(false, 'Фуад застрял в утренних пробках и опоздал. Менеджер уже написал в чат.');
    } else if (state.stress >= CONFIG.stressMax) {
      concludeGame(false, 'Стресс зашкалил. Фуад решает припарковаться и отдышаться — рабочий день сорван.');
    } else if (pointInArea(car.x, car.y, destinationArea)) {
      concludeGame(true, 'Фуад припарковался у Entertainer. Он успел к началу смены и даже успел взять кофе.');
    }
  }

  function checkEvents() {
    const currentZone = detectLocation(car.x, car.y);
    if (currentZone && currentZone.name !== state.location) {
      state.location = currentZone.name;
      logEvent(currentZone.note, 'info');
      statLocation.textContent = state.location;
    }

    policeStops.forEach(stop => {
      if (stop.resolved) return;
      const dist = Math.hypot(car.x - stop.x, car.y - stop.y);
      if (dist < stop.radius) {
        stop.resolved = true;
        showPoliceStop(stop);
      }
    });

    trafficEvents.forEach(event => {
      if (event.triggered) return;
      if (pointInArea(car.x, car.y, event.area)) {
        event.triggered = true;
        state.stress = Math.min(CONFIG.stressMax, state.stress + event.stress);
        state.timeMinutes += event.time;
        logEvent(event.message, event.tone);
        showToast(`Проблема на дороге: ${formatDelta(event.time, ' мин')} к маршруту`);
        updateStats();
      }
    });
  }

  function detectLocation(x, y) {
    return locationZones.find(zone => pointInArea(x, y, zone.area));
  }

  function pointInArea(x, y, area) {
    return (
      x >= area.x &&
      x <= area.x + area.width &&
      y >= area.y &&
      y <= area.y + area.height
    );
  }

  function isOnRoad(x, y) {
    return routeAreas.some(area => pointInArea(x, y, area));
  }

  function updateStats() {
    statTime.textContent = formatTime(state.timeMinutes);
    statStress.textContent = Math.round(state.stress);
    statFuel.textContent = `${Math.round(state.fuel)}%`;
    state.mood = resolveMood(state.stress);
    statMood.textContent = state.mood;
    statLocation.textContent = state.location;
  }

  function resolveMood(stress) {
    if (stress < 25) return 'спокойный';
    if (stress < 50) return 'сосредоточенный';
    if (stress < 75) return 'напряжённый';
    if (stress < 90) return 'злой';
    return 'на грани';
  }

  function logEvent(text, tone = 'info') {
    state.logCount += 1;
    const entry = document.createElement('div');
    entry.className = `log-entry ${tone !== 'info' ? tone : ''}`.trim();
    entry.textContent = `${formatTime(state.timeMinutes)} — ${text}`;
    logContainer.prepend(entry);
    while (logContainer.children.length > 18) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function showPoliceStop(stop) {
    state.blocked = true;
    car.velocity = 0;
    overlayTitle.textContent = `${stop.name}`;
    overlayText.textContent = stop.text;
    overlayChoices.innerHTML = '';
    overlayClose.disabled = true;
    overlayClose.textContent = 'Выберите действие';

    stop.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.innerHTML = `<strong>${option.label}</strong><span>${option.description}</span>`;
      btn.addEventListener('click', () => {
        state.stress = Math.min(CONFIG.stressMax, state.stress + option.result.stress);
        state.timeMinutes += option.result.time;
        logEvent(option.result.log, option.result.tone);
        showToast(`Контроль: ${formatDelta(option.result.time, ' мин')}`);
        overlayText.textContent = option.result.log;
        overlayChoices.innerHTML = '';
        overlayClose.disabled = false;
        overlayClose.textContent = 'Продолжить путь';
        overlayClose.focus();
        updateStats();
      });
      overlayChoices.appendChild(btn);
    });

    logEvent(`${stop.name} остановил Фуада для проверки.`, 'warning');
    overlay.classList.remove('hidden');
    state.activeOverlay = () => {
      overlay.classList.add('hidden');
      state.blocked = false;
      overlayClose.textContent = 'Выберите действие';
      overlayClose.disabled = true;
      state.activeOverlay = null;
    };
  }

  overlayClose.addEventListener('click', () => {
    if (!state.activeOverlay || overlayClose.disabled) return;
    state.activeOverlay();
  });

  function concludeGame(success, message) {
    state.running = false;
    state.paused = false;
    state.blocked = true;
    car.velocity = 0;

    const tone = success ? 'success' : 'danger';
    logEvent(message, tone);
    overlayTitle.textContent = success ? 'Вы успели!' : 'Поездка сорвалась';
    overlayText.textContent = message;
    overlayChoices.innerHTML = '';
    overlayClose.disabled = false;
    overlayClose.textContent = 'Новая попытка';
    overlay.classList.remove('hidden');
    state.activeOverlay = () => {
      overlay.classList.add('hidden');
      resetGame();
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawRoads();
    drawLandmarks();
    drawPolice();
    drawDestination();
    drawCar();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#162137');
    gradient.addColorStop(1, '#0f1729');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(34, 49, 74, 0.4)';
    backgroundBlocks.forEach(block => {
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
  }

  function drawRoads() {
    ctx.save();
    ctx.fillStyle = '#2d3a52';
    routeAreas.forEach(area => {
      ctx.fillRect(area.x, area.y, area.width, area.height);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(120, 500);
    ctx.lineTo(600, 500);
    ctx.lineTo(680, 420);
    ctx.lineTo(780, 320);
    ctx.lineTo(820, 200);
    ctx.lineTo(820, 140);
    ctx.stroke();

    ctx.setLineDash([18, 24]);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, 500);
    ctx.lineTo(600, 500);
    ctx.lineTo(690, 420);
    ctx.lineTo(790, 320);
    ctx.lineTo(820, 200);
    ctx.lineTo(820, 140);
    ctx.stroke();
    ctx.restore();
  }

  function drawLandmarks() {
    ctx.save();
    ctx.fillStyle = 'rgba(83, 109, 140, 0.8)';
    const districts = [
      { x: 180, y: 480, label: 'Ясамал' },
      { x: 420, y: 470, label: 'Тбилиси пр.' },
      { x: 620, y: 390, label: 'Нариманов' },
      { x: 700, y: 280, label: '28 Мая' },
      { x: 780, y: 180, label: 'Низами' },
    ];
    districts.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0c1424';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, d.x, d.y);
      ctx.fillStyle = 'rgba(83, 109, 140, 0.8)';
    });

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    skyline.forEach(tower => {
      ctx.fillRect(tower.x, 40, tower.width, tower.height);
    });
    ctx.restore();
  }

  function drawPolice() {
    ctx.save();
    policeStops.forEach(stop => {
      if (stop.resolved) return;
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffe0a6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0c1424';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ДПС', stop.x, stop.y);
    });
    ctx.restore();
  }

  function drawDestination() {
    ctx.save();
    ctx.fillStyle = '#48d0ff';
    ctx.fillRect(destinationArea.x, destinationArea.y, destinationArea.width, destinationArea.height);
    ctx.fillStyle = '#041424';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Entertainer', destinationArea.x + destinationArea.width / 2, destinationArea.y + destinationArea.height / 2);
    ctx.restore();
  }

  function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.fillStyle = '#f6f9ff';
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.fillStyle = '#1c2e44';
    ctx.fillRect(-car.width / 2 + 4, -car.height / 2 + 6, car.width - 8, car.height - 12);
    ctx.fillStyle = '#48d0ff';
    ctx.fillRect(-car.width / 2 + 6, -car.height / 2 + 6, car.width - 12, (car.height - 12) / 2);
    ctx.restore();
  }

  function formatTime(totalMinutes) {
    const minutes = Math.floor(totalMinutes);
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function formatDelta(value, suffix = '') {
    if (value === 0) return `±0${suffix}`;
    const sign = value > 0 ? '+' : '−';
    return `${sign}${Math.abs(Math.round(value))}${suffix}`;
  }

  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', pauseGame);
  resetBtn.addEventListener('click', resetGame);

  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      pressed.add(e.code);
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', (e) => {
    pressed.delete(e.code);
  });

  resetGame();
});
