function startGame() {
  document.getElementById('menu-screen').style.display = 'none';
  const gs = document.getElementById('game-screen');
  gs.style.display = 'flex';
  gs.style.flexDirection = 'column';
  gs.style.alignItems = 'center';
  spawnClouds();
  initGame();
}

function goMenu() {
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('menu-screen').style.display = 'flex';
  cancelAnimationFrame(animFrame);
}

// ===== CLOUDS =====
function spawnClouds() {
  const container = document.getElementById('clouds');
  container.innerHTML = '';
  for(let i = 0; i < 5; i++) {
    const c = document.createElement('div');
    c.className = 'cloud';
    const w = 80 + Math.random()*80, h = 28 + Math.random()*20;
    c.style.cssText = `
      width:${w}px;height:${h}px;
      top:${40+Math.random()*100}px;
      left:${Math.random()*100}%;
      position:absolute;
      background:white;border-radius:50px;opacity:0.8;
    `;
    container.appendChild(c);
    animateCloud(c, 0.3+Math.random()*0.5);
  }
}
function animateCloud(el, speed) {
  let x = parseFloat(el.style.left);
  (function move(){
    x -= speed * 0.1;
    if(x < -20) x = 110;
    el.style.left = x + '%';
    requestAnimationFrame(move);
  })();
}

// ===== GAME ENGINE =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND = H - 40;

let duck, obstacles, score, hiScore = 0, speed, frame, gameRunning, animFrame, started;

function initGame() {
  duck = { x: 80, y: GROUND, w: 52, h: 44, vy: 0, jumping: false, frame: 0, frameTimer: 0 };
  obstacles = [];
  score = 0; speed = 5; frame = 0; gameRunning = true; started = false;
  document.getElementById('score-display').textContent = 'SCORE: 0';
  document.getElementById('overlay').classList.remove('show');
  loop();
}

function loop() {
  if(!gameRunning) return;
  ctx.clearRect(0, 0, W, H);
  drawGround();
  if(started) {
    updateDuck();
    updateObstacles();
    checkCollision();
    frame++;
    score = Math.floor(frame / 6);
    document.getElementById('score-display').textContent = 'SCORE: ' + score;
    if(score > hiScore) {
      hiScore = score;
      document.getElementById('hi-display').textContent = 'BEST: ' + hiScore;
    }
    if(frame % 180 === 0 && speed < 14) speed += 0.5;
  } else {
    // waiting to start — show tap prompt
    drawDuck();
    ctx.font = 'bold 16px Nunito, sans-serif';
    ctx.fillStyle = '#2d4a1e';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE or ↑ to start waddling!', W/2, H/2 - 10);
  }
  animFrame = requestAnimationFrame(loop);
}

function drawGround() {
  ctx.fillStyle = 'rgba(109,181,46,0.35)';
  ctx.fillRect(0, GROUND + duck.h - 8, W, 12);
  ctx.strokeStyle = 'rgba(90,158,40,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND + duck.h - 8);
  ctx.lineTo(W, GROUND + duck.h - 8);
  ctx.stroke();
}

// ===== DUCK DRAWING (pixel art style) =====
function updateDuck() {
  duck.vy += 0.8; // gravity
  duck.y += duck.vy;
  if(duck.y >= GROUND) { duck.y = GROUND; duck.vy = 0; duck.jumping = false; }
  duck.frameTimer++;
  if(duck.frameTimer > 8) { duck.frame = (duck.frame+1)%2; duck.frameTimer = 0; }
  drawDuck();
}

function drawDuck() {
  const x = duck.x, y = duck.y, onGround = !duck.jumping && duck.y >= GROUND - 2;
  ctx.save();
  ctx.translate(x + duck.w/2, y + duck.h);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI*2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.ellipse(0, -18, 22, 16, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#d4a800';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wing flap
  const wingY = onGround ? (duck.frame === 0 ? -15 : -18) : -20;
  ctx.fillStyle = '#f5c800';
  ctx.beginPath();
  ctx.ellipse(-6, wingY, 14, 8, -0.3, 0, Math.PI*2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.arc(10, -30, 13, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#d4a800';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(15, -33, 3, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(16, -34, 1, 0, Math.PI*2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#ff9900';
  ctx.beginPath();
  ctx.moveTo(22, -30);
  ctx.lineTo(30, -27);
  ctx.lineTo(22, -25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#cc7700';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Legs (waddle only on ground)
  ctx.strokeStyle = '#ff9900';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if(onGround) {
    const legSwing = duck.frame === 0 ? 4 : -4;
    // Left leg
    ctx.beginPath();
    ctx.moveTo(-8, -5);
    ctx.lineTo(-8 + legSwing, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8 + legSwing, 6);
    ctx.lineTo(-8 + legSwing + 8, 6);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(4 - legSwing, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4 - legSwing, 6);
    ctx.lineTo(4 - legSwing + 8, 6);
    ctx.stroke();
  } else {
    // Tucked in the air
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-4, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(6, 8);
    ctx.stroke();
  }

  ctx.restore();
}

// ===== OBSTACLES =====
function updateObstacles() {
  if(frame % Math.max(60, 130 - score) === 0) spawnObstacle();
  for(let o of obstacles) {
    o.x -= speed;
    drawCactus(o);
  }
  obstacles = obstacles.filter(o => o.x + o.w > -10);
}

function spawnObstacle() {
  const type = Math.random() < 0.3 ? 'big' : 'small';
  const w = type === 'big' ? 28 : 20;
  const h = type === 'big' ? 60 : 42;
  obstacles.push({ x: W + 10, w, h, type });
}

function drawCactus(o) {
  const bx = o.x, by = GROUND + duck.h - 8, bh = o.h, bw = o.w;
  ctx.fillStyle = '#3aaa3a';
  ctx.strokeStyle = '#228B22';
  ctx.lineWidth = 1.5;

  // Main trunk
  ctx.beginPath();
  ctx.roundRect(bx + bw/2 - bw/4, by - bh, bw/2, bh, 4);
  ctx.fill(); ctx.stroke();

  // Left arm
  const armY = by - bh * 0.55;
  ctx.beginPath();
  ctx.roundRect(bx, armY - bw*0.4, bw/2, bw*0.4, 3);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(bx, armY - bh*0.3, bw/2.5, bh*0.3, 3);
  ctx.fill(); ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.roundRect(bx + bw/2, armY - bw*0.4, bw/2, bw*0.4, 3);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(bx + bw*0.6, armY - bh*0.28, bw/2.5, bh*0.28, 3);
  ctx.fill(); ctx.stroke();

  // Spines
  ctx.strokeStyle = '#1a6b1a';
  ctx.lineWidth = 1.2;
  [bx+bw/2-2, bx+bw/2+bw/4+2].forEach(sx => {
    for(let s = 0; s < 4; s++) {
      const sy = by - bh*0.2 - s * bh*0.15;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx-5, sy-4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx+5, sy-4); ctx.stroke();
    }
  });
}

// ===== COLLISION =====
function checkCollision() {
  const dLeft = duck.x + 12, dRight = duck.x + duck.w - 8;
  const dTop = duck.y + 6, dBottom = duck.y + duck.h;
  for(let o of obstacles) {
    const oLeft = o.x + 4, oRight = o.x + o.w - 4;
    const oTop = GROUND + duck.h - 8 - o.h, oBottom = GROUND + duck.h - 8;
    if(dRight > oLeft && dLeft < oRight && dBottom > oTop && dTop < oBottom) {
      gameOver();
      return;
    }
  }
}

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animFrame);
  document.getElementById('final-score').textContent = '🏆 Score: ' + score + (score > hiScore - score ? '' : '');
  document.getElementById('hi-display').textContent = 'BEST: ' + hiScore;
  document.getElementById('overlay').classList.add('show');
}

function restartGame() {
  initGame();
}

// ===== JUMP INPUT =====
function jump() {
  if(!started) { started = true; }
  if(!duck.jumping && duck.y >= GROUND - 2) {
    duck.vy = -14;
    duck.jumping = true;
  }
}

document.addEventListener('keydown', e => {
  if(e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
});
canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
