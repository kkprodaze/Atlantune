class Track {
  constructor(){
    this.outer = [
      {x:80, y:560}, {x:120, y:420}, {x:90, y:300}, {x:130, y:180},
      {x:240, y:100}, {x:420, y:60}, {x:720, y:70}, {x:860, y:120},
      {x:910, y:220}, {x:880, y:330}, {x:920, y:420}, {x:880, y:540},
      {x:640, y:580}, {x:360, y:580}
    ];
    this.inner = [
      [
        {x:260, y:470}, {x:220, y:380}, {x:260, y:270}, {x:360, y:190},
        {x:560, y:170}, {x:700, y:210}, {x:760, y:280}, {x:720, y:360},
        {x:760, y:430}, {x:700, y:510}, {x:520, y:520}, {x:320, y:520}
      ]
    ];

    this.start = { x: 480, y: 545, angle: -Math.PI / 2 };
    this.startLine = { a: {x: 430, y: 520}, b: {x: 530, y: 520} };

    this.checkpoints = [
      {x: 770, y: 470, radius: 70},
      {x: 840, y: 300, radius: 70},
      {x: 680, y: 180, radius: 70},
      {x: 420, y: 130, radius: 70},
      {x: 250, y: 200, radius: 70},
      {x: 220, y: 360, radius: 70}
    ];

    this.waypoints = [
      {x:480, y: 540},
      {x:660, y: 500},
      {x:780, y: 420},
      {x:860, y: 290},
      {x:780, y: 180},
      {x:600, y: 120},
      {x:360, y: 110},
      {x:220, y: 210},
      {x:200, y: 350},
      {x:280, y: 470},
      {x:440, y: 520}
    ];

    this.pathOuter = this._buildPath(this.outer);
    this.pathInner = this.inner.map(loop => this._buildPath(loop));
  }

  draw(ctx){
    ctx.save();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, "#011627");
    gradient.addColorStop(1, "#04304d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#0b1f33";
    ctx.fillRect(40, 40, ctx.canvas.width - 80, ctx.canvas.height - 80);

    ctx.fillStyle = "#1c2f44";
    ctx.fill(this.pathOuter);
    ctx.globalCompositeOperation = "destination-out";
    this.pathInner.forEach(path => ctx.fill(path));
    ctx.globalCompositeOperation = "source-over";

    ctx.lineWidth = 8;
    ctx.strokeStyle = "#d7e9ff";
    ctx.setLineDash([18, 12]);
    ctx.lineDashOffset = performance.now() / 35 % 30;
    ctx.stroke(this.pathOuter);

    ctx.lineWidth = 6;
    ctx.strokeStyle = "#0f172a";
    ctx.setLineDash([]);
    this.pathInner.forEach(path => ctx.stroke(path));

    ctx.fillStyle = "rgba(5, 120, 200, 0.5)";
    ctx.beginPath();
    ctx.moveTo(this.startLine.a.x, this.startLine.a.y);
    ctx.lineTo(this.startLine.b.x, this.startLine.b.y);
    ctx.lineTo(this.startLine.b.x, this.startLine.b.y + 28);
    ctx.lineTo(this.startLine.a.x, this.startLine.a.y + 28);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(this.startLine.a.x, this.startLine.a.y);
    ctx.lineTo(this.startLine.b.x, this.startLine.b.y);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    this.checkpoints.forEach(cp => {
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  _buildPath(points){
    const path = new Path2D();
    if (!points.length) return path;
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++){
      path.lineTo(points[i].x, points[i].y);
    }
    path.closePath();
    return path;
  }

  isOnTrack(x, y){
    if (!pointTester){
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 600;
      pointTester = canvas.getContext("2d");
    }
    const ctx = pointTester;
    return ctx.isPointInPath(this.pathOuter, x, y) && !this.pathInner.some(path => ctx.isPointInPath(path, x, y));
  }

  crossedStartLine(prev, current){
    return segmentsIntersect(prev, current, this.startLine.a, this.startLine.b) && prev.y > this.startLine.a.y;
  }
}

let pointTester = null;

class Car {
  constructor(options){
    this.x = options.x;
    this.y = options.y;
    this.angle = options.angle;
    this.speed = 0;
    this.color = options.color || "#ff4757";
    this.width = 34;
    this.length = 58;
    this.maxSpeed = options.maxSpeed || 320;
    this.acceleration = options.acceleration || 280;
    this.brake = options.brake || 340;
    this.turnRate = options.turnRate || 3.6;
    this.drag = options.drag || 2.4;
    this.prev = {x: this.x, y: this.y};
    this.offTrackTimer = 0;
    this.lap = 0;
    this.lapTimes = [];
    this.currentLapTime = 0;
    this.bestLap = null;
    this.readyForLap = false;
    this.checkpointIndex = 0;
  }

  reset(position){
    this.x = position.x;
    this.y = position.y;
    this.angle = position.angle;
    this.speed = 0;
    this.prev = {x: this.x, y: this.y};
    this.offTrackTimer = 0;
    this.lap = 0;
    this.lapTimes = [];
    this.currentLapTime = 0;
    this.bestLap = null;
    this.readyForLap = false;
    this.checkpointIndex = 0;
  }

  updateLapTiming(dt){
    this.currentLapTime += dt;
  }

  completeLap(){
    if (this.currentLapTime <= 0.2) return;
    this.lap += 1;
    this.lapTimes.push(this.currentLapTime);
    if (!this.bestLap || this.currentLapTime < this.bestLap){
      this.bestLap = this.currentLapTime;
    }
    this.currentLapTime = 0;
    this.readyForLap = false;
    this.checkpointIndex = 0;
  }

  updateCheckpoints(track){
    const checkpoints = track.checkpoints;
    if (!checkpoints.length) return;
    const target = checkpoints[this.checkpointIndex];
    if (!target){
      this.readyForLap = true;
      return;
    }
    if (distanceSquared(this, target) <= (target.radius * target.radius)){
      this.checkpointIndex += 1;
      if (this.checkpointIndex >= checkpoints.length){
        this.readyForLap = true;
        this.checkpointIndex = checkpoints.length;
      }
    }
  }

  draw(ctx){
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = "#141e30";
    ctx.fillRect(-this.length/2, -this.width/2, this.length, this.width);

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.length/2 + 6, -this.width/2 + 4, this.length - 12, this.width - 8);

    ctx.fillStyle = "#2f3542";
    ctx.fillRect(-this.length/2 + 8, -this.width/2 - 6, this.length - 16, 6);
    ctx.fillRect(-this.length/2 + 8, this.width/2, this.length - 16, 6);

    ctx.fillStyle = "#fff";
    ctx.fillRect(this.length/2 - 12, -this.width/2 + 6, 8, this.width - 12);

    ctx.restore();
  }
}

class PlayerCar extends Car {
  update(dt, input, track){
    this.prev = {x: this.x, y: this.y};

    if (input.throttle){
      this.speed += this.acceleration * dt;
    } else {
      this.speed -= this.drag * this.speed * dt;
    }

    if (input.brake){
      this.speed -= this.brake * dt;
    }

    if (input.reverse && this.speed > -140){
      this.speed -= this.acceleration * dt * 0.6;
    }

    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    if (this.speed < -120) this.speed = -120;

    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    if (steer !== 0){
      const steerFactor = 0.9 - 0.3 * Math.min(Math.abs(this.speed) / this.maxSpeed, 1);
      this.angle += steer * this.turnRate * steerFactor * dt * Math.sign(this.speed || 1);
    }

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    if (!track.isOnTrack(this.x, this.y)){
      this.x = this.prev.x - Math.cos(this.angle) * 12;
      this.y = this.prev.y - Math.sin(this.angle) * 12;
      this.speed *= -0.25;
      this.offTrackTimer = 1.2;
    } else {
      this.offTrackTimer = Math.max(0, this.offTrackTimer - dt);
    }

    this.updateCheckpoints(track);
  }
}

class RivalCar extends Car {
  constructor(options){
    super(options);
    this.waypoints = options.waypoints || [];
    this.targetIndex = 1;
    this.maxSpeed = options.maxSpeed || 300;
    this.acceleration = options.acceleration || 220;
    this.turnRate = options.turnRate || 2.5;
  }

  update(dt, track){
    this.prev = {x: this.x, y: this.y};
    const target = this.waypoints[this.targetIndex];
    if (!target) return;

    const desired = Math.atan2(target.y - this.y, target.x - this.x);
    let diff = normalizeAngle(desired - this.angle);

    const turnStrength = Math.min(Math.abs(diff), this.turnRate * dt);
    this.angle += Math.sign(diff) * turnStrength;

    let targetSpeed = this.maxSpeed;
    if (Math.abs(diff) > 0.6) targetSpeed *= 0.55;
    if (Math.abs(diff) > 1.0) targetSpeed *= 0.3;

    if (this.speed < targetSpeed){
      this.speed += this.acceleration * dt;
    } else {
      this.speed -= this.acceleration * dt * 0.8;
    }

    if (this.speed > targetSpeed) this.speed = targetSpeed;

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    if (distanceSquared(this, target) < 80 * 80){
      this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
    }

    if (!track.isOnTrack(this.x, this.y)){
      this.x = this.prev.x;
      this.y = this.prev.y;
      this.speed *= 0.6;
      this.angle += 0.04;
    }

    this.updateCheckpoints(track);
  }
}

function normalizeAngle(angle){
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function segmentsIntersect(p1, p2, q1, q2){
  const o1 = orientation(p1, p2, q1);
  const o2 = orientation(p1, p2, q2);
  const o3 = orientation(q1, q2, p1);
  const o4 = orientation(q1, q2, p2);
  return o1 !== o2 && o3 !== o4;
}

function orientation(a, b, c){
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < 0.00001) return 0;
  return value > 0 ? 1 : 2;
}

function distanceSquared(a, b){
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function formatTime(t){
  return `${t.toFixed(3)}s`;
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const track = new Track();

  const lapInfo = document.getElementById("lapInfo");
  const lapTimer = document.getElementById("lapTimer");
  const bestLap = document.getElementById("bestLap");
  const rivalLap = document.getElementById("rivalLap");
  const raceMessage = document.getElementById("raceMessage");
  const countdownEl = document.getElementById("countdown");
  const startBtn = document.getElementById("startBtn");

  const input = { throttle: false, brake: false, reverse: false, left: false, right: false };

  const player = new PlayerCar({ ...track.start, color: "#ff4d4f", maxSpeed: 340, acceleration: 320, turnRate: 3.8 });
  const rival = new RivalCar({ ...track.start, color: "#00d8ff", maxSpeed: 300, acceleration: 240, waypoints: track.waypoints });
  rival.y += 36;
  rival.angle += 0.02;

  const state = {
    race: "idle",
    countdown: 3,
    countdownTimer: 0,
    targetLaps: 3,
    finishedBy: null
  };

  function reset(){
    state.race = "idle";
    state.countdown = 3;
    state.countdownTimer = 0;
    state.finishedBy = null;
    player.reset(track.start);
    rival.reset(track.start);
    rival.y += 36;
    rival.angle += 0.02;
    lapInfo.textContent = `0 / ${state.targetLaps}`;
    lapTimer.textContent = "0.000s";
    bestLap.textContent = "—";
    rivalLap.textContent = "—";
    countdownEl.textContent = "";
    raceMessage.textContent = "Press start to launch the countdown.";
    if (startBtn){
      startBtn.textContent = "Start race";
    }
  }

  function startRace(){
    if (state.race === "running" || state.race === "countdown") return;
    reset();
    state.race = "countdown";
    raceMessage.textContent = "Engines ready...";
    countdownEl.textContent = state.countdown;
    startBtn.textContent = "Restart";
  }

  startBtn.addEventListener("click", startRace);

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    switch (e.code){
      case "KeyW":
      case "ArrowUp":
        input.throttle = true; break;
      case "KeyS":
      case "ArrowDown":
        input.brake = true;
        input.reverse = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        input.left = true; break;
      case "KeyD":
      case "ArrowRight":
        input.right = true; break;
      case "Space":
        if (state.race !== "idle"){
          const wp = track.waypoints[0];
          player.x = wp.x;
          player.y = wp.y + 6;
          player.angle = track.start.angle;
          player.speed = 0;
          player.readyForLap = false;
          player.checkpointIndex = 0;
        }
        break;
      default:
        return;
    }
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)){
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.code){
      case "KeyW":
      case "ArrowUp":
        input.throttle = false; break;
      case "KeyS":
      case "ArrowDown":
        input.brake = false;
        input.reverse = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        input.left = false; break;
      case "KeyD":
      case "ArrowRight":
        input.right = false; break;
      default:
        return;
    }
  });

  let lastTime = null;

  function update(dt){
    track.draw(ctx);

    if (state.race === "countdown"){
      state.countdownTimer += dt;
      if (state.countdownTimer >= 1){
        state.countdown -= 1;
        state.countdownTimer = 0;
        if (state.countdown <= 0){
          state.race = "running";
          countdownEl.textContent = "GO!";
          setTimeout(() => countdownEl.textContent = "", 400);
          raceMessage.textContent = "Push! Stay ahead through Baku's castle section.";
        } else {
          countdownEl.textContent = state.countdown;
        }
      }
    }

    if (state.race === "running"){
      player.updateLapTiming(dt);
      rival.updateLapTiming(dt);
      player.update(dt, input, track);
      rival.update(dt, track);

      if (track.crossedStartLine(player.prev, player) && player.readyForLap){
        player.completeLap();
        lapInfo.textContent = `${Math.min(player.lap, state.targetLaps)} / ${state.targetLaps}`;
        bestLap.textContent = player.bestLap ? formatTime(player.bestLap) : "—";
        if (player.lap >= state.targetLaps && !state.finishedBy){
          state.finishedBy = "player";
          state.race = "finished";
          raceMessage.textContent = "You win! Azeri fireworks light up the sky.";
        }
      }

      if (track.crossedStartLine(rival.prev, rival) && rival.readyForLap){
        rival.completeLap();
        rivalLap.textContent = rival.bestLap ? formatTime(rival.bestLap) : `${rival.lap} lap`;
        if (rival.lap >= state.targetLaps && !state.finishedBy){
          state.finishedBy = "rival";
          state.race = "finished";
          raceMessage.textContent = "Rival wins. Analyze the castle section and try again!";
        }
      }

      lapTimer.textContent = formatTime(player.currentLapTime);

      if (state.race === "finished"){
        countdownEl.textContent = "";
      }
    }

    if (state.race !== "running"){
      player.speed *= 0.96;
      rival.speed *= 0.96;
    }

    rival.draw(ctx);
    player.draw(ctx);

    if (player.offTrackTimer > 0){
      ctx.save();
      ctx.fillStyle = "rgba(255, 110, 74, 0.9)";
      ctx.font = "20px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Slow down! You left the racing surface.", canvas.width / 2, 40);
      ctx.restore();
    }
  }

  function loop(timestamp){
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    requestAnimationFrame(loop);
  }

  reset();
  track.draw(ctx);
  requestAnimationFrame(loop);
});
