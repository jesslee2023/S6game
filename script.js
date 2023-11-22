"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("scoreValue");
const livesEl = document.getElementById("livesValue");
const gameOverEl = document.getElementById("game-end");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const enemyShootInterval = 1000;
const highScoreEl = document.getElementById("highScoreValue");

let score = 0;
let lives = 10;
let isGameRunning = false;
let animationFrameId;
let bossEnemy = null;
let enemyShootIntervalId;
let touchStartX = 0;
let isTouching = false;
let soundEnabled = localStorage.getItem("soundEnabled") === "true";

const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 20,
  speed: 5,
  dx: 0,
};

const bullets = [];
const enemyBullets = [];
const enemies = [];
const enemyWidth = 60;
const enemyHeight = 20;
const enemyPadding = 10;
const enemyOffsetTop = 30;
const enemyRowCount = 3;
const enemyColumnCount = 11;

function initializeSound() {
  const soundToggle = document.getElementById("soundToggle");
  const soundLabel = document.getElementById("soundLabel");
  soundToggle.checked = soundEnabled;
  soundLabel.textContent = soundEnabled ? "Sound On" : "Sound Off";
  updateSoundState();
}

function enableSound() {
  soundEnabled = true;
  localStorage.setItem("soundEnabled", "true");
}

function disableSound() {
  soundEnabled = false;
  localStorage.setItem("soundEnabled", "false");
}

function toggleSound() {
  const soundLabel = document.getElementById("soundLabel");
  soundEnabled = !soundEnabled;
  soundLabel.textContent = soundEnabled ? "Sound On" : "Sound Off";
  updateSoundState();
  canvas.focus();
}

function updateSoundState() {
  if (soundEnabled) {
    enableSound();
  } else {
    disableSound();
  }
}

document.getElementById("soundToggle").addEventListener("change", toggleSound);

initializeSound();

function createEnemies() {
  for (let c = 0; c < enemyColumnCount; c++) {
    enemies[c] = [];
    for (let r = 0; r < enemyRowCount; r++) {
      const enemyX = c * (enemyWidth + enemyPadding) + enemyOffsetTop;
      const enemyY = r * (enemyHeight + enemyPadding) + enemyOffsetTop;
      enemies[c][r] = { x: enemyX, y: enemyY, status: 1 };
    }
  }
}

function drawEnemies() {
  for (let c = 0; c < enemyColumnCount; c++) {
    for (let r = 0; r < enemyRowCount; r++) {
      if (enemies[c][r].status == 1) {
        const enemyX = c * (enemyWidth + enemyPadding) + enemyOffsetTop;
        const enemyY = r * (enemyHeight + enemyPadding) + enemyOffsetTop;
        enemies[c][r].x = enemyX;
        enemies[c][r].y = enemyY;
        ctx.beginPath();
        ctx.rect(enemyX, enemyY, enemyWidth, enemyHeight);
        ctx.fillStyle = "#00FF00";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawPlayer() {
  ctx.beginPath();
  ctx.rect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawBullets() {
  bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.rect(bullet.x - 2, bullet.y, 4, 10);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.closePath();
  });

  enemyBullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.rect(bullet.x - 2, bullet.y, 4, 10);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.closePath();
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= 2;
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].y += 2;
    if (enemyBullets[i].y > canvas.height) {
      enemyBullets.splice(i, 1);
    }
  }
}

function drawEnemyBullets() {
  for (let i = 0; i < enemyBullets.length; i++) {
    const bullet = enemyBullets[i];
    ctx.beginPath();
    ctx.rect(bullet.x, bullet.y, bullet.width, bullet.height);
    ctx.fillStyle = "red";
    ctx.closePath();
  }
}

function enemyShoot() {
  const randomColumn = Math.floor(Math.random() * enemyColumnCount);
  const randomRow = Math.floor(Math.random() * enemyRowCount);
  const enemy = enemies[randomColumn][randomRow];

  if (enemy.status === 1) {
    const bulletX = enemy.x + enemyWidth / 2;
    const bulletY = enemy.y + enemyHeight;
    enemyBullets.push({
      x: bulletX,
      y: bulletY,
      width: 4,
      height: 10,
      color: "red",
    });
  }
}

function updateEnemyBullets() {
  const currentTime = Date.now();

  for (let c = 0; c < enemyColumnCount; c++) {
    for (let r = 0; r < enemyRowCount; r++) {
      const enemy = enemies[c][r];

      if (enemy.status === 1) {
        if (
          isEnemyFacingPlayer(enemy) &&
          currentTime - lastEnemyShootTime >= enemyShootInterval
        ) {
          enemyShoot();
          lastEnemyShootTime = currentTime;
        }
      }
    }
  }
}

function isEnemyFacingPlayer(enemy) {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const enemyCenterX = enemy.x + enemyWidth / 2;
  const enemyCenterY = enemy.y + enemyHeight / 2;

  const dx = playerCenterX - enemyCenterX;
  const dy = playerCenterY - enemyCenterY;

  const distance = Math.sqrt(dx * dx + dy * dy);

  const thresholdDistance = 100;

  for (let c = 0; c < enemyColumnCount; c++) {
    for (let r = 0; r < enemyRowCount; r++) {
      const otherEnemy = enemies[c][r];
      if (otherEnemy.status === 1 && otherEnemy !== enemy) {
        const otherEnemyCenterX = otherEnemy.x + enemyWidth / 2;
        const otherEnemyCenterY = otherEnemy.y + enemyHeight / 2;

        const otherDx = playerCenterX - otherEnemyCenterX;
        const otherDy = playerCenterY - otherEnemyCenterY;

        const otherDistance = Math.sqrt(otherDx * otherDx + otherDy * otherDy);

        if (otherDistance < distance) {
          return false;
        }
      }
    }
  }

  return distance < thresholdDistance;
}

function keyDown(e) {
  if (e.key === "ArrowRight" || e.key === "Right") {
    moveRight();
  } else if (e.key === "ArrowLeft" || e.key === "Left") {
    moveLeft();
  } else if (e.key === " " || e.code === "Space") {
    shoot();
  }
}

function keyUp(e) {
  if (
    e.key === "ArrowRight" ||
    e.key === "Right" ||
    e.key === "ArrowLeft" ||
    e.key === "Left"
  ) {
    player.dx = 0;
  }
}

function moveRight() {
  player.dx = player.speed;
}

function moveLeft() {
  player.dx = -player.speed;
}

function shoot() {
  const bulletX = player.x + player.width / 2;
  const bulletY = player.y;
  bullets.push({ x: bulletX, y: bulletY, dy: -4 });

  playSound("shoot.wav");
}

function collisionDetection() {
  for (let b = bullets.length - 1; b >= 0; b--) {
    for (let c = 0; c < enemyColumnCount; c++) {
      for (let r = 0; r < enemyRowCount; r++) {
        let enemy = enemies[c][r];
        if (enemy.status == 1) {
          if (
            bullets[b].x > enemy.x &&
            bullets[b].x < enemy.x + enemyWidth &&
            bullets[b].y > enemy.y &&
            bullets[b].y < enemy.y + enemyHeight
          ) {
            enemy.status = 0;
            bullets.splice(b, 1);
            score += 10;
            updateScoreDisplay();
            playSound("explosion.wav");
            return;
          }
        }
      }
    }
  }

  for (let b = enemyBullets.length - 1; b >= 0; b--) {
    if (
      enemyBullets[b].x > player.x &&
      enemyBullets[b].x < player.x + player.width &&
      enemyBullets[b].y > player.y &&
      enemyBullets[b].y < player.y + player.height
    ) {
      enemyBullets.splice(b, 1);
      lives -= 1;
      playSound("hurt.wav");
      updateLivesDisplay();
      if (lives <= 0) {
        gameOver();
      }
      return;
    }
  }
  if (enemies.every((column) => column.every((enemy) => enemy.status === 0))) {
    showVictory();
  }
}

function updateScoreDisplay() {
  scoreEl.textContent = score;
  let highScore = localStorage.getItem("highScore") || 0;
  if (score > highScore) {
    localStorage.setItem("highScore", score);
    highScore = score;
  }
  highScoreEl.textContent = highScore;
}

function updateLivesDisplay() {
  livesEl.textContent = lives;
}

function updateHighScoreDisplay() {
  let highScore = localStorage.getItem("highScore") || 0;
  highScoreEl.textContent = highScore;
}

function gameOver() {
  isGameRunning = false;
  document.getElementById("endMessage").textContent = "Game Over";
  document.getElementById("game-end").style.display = "block";
  cancelAnimationFrame(animationFrameId);
  clearInterval(enemyShootIntervalId);
}

function showVictory() {
  isGameRunning = false;
  document.getElementById("endMessage").textContent = "Victory!";
  document.getElementById("game-end").style.display = "block";
  cancelAnimationFrame(animationFrameId);
  clearInterval(enemyShootIntervalId);
}

function addJokeButton() {
  const jokeButton = document.createElement("button");
  jokeButton.textContent = "Get a Joke";
  jokeButton.addEventListener("click", function () {
    fetchJoke();
  });

  document.getElementById("game-container").appendChild(jokeButton);
}

function resetGame() {
  score = 0;
  lives = 10;
  bullets.length = 0;
  enemyBullets.length = 0;
  createEnemies();
  updateScoreDisplay();
  updateLivesDisplay();
  updateHighScoreDisplay();
  gameOverEl.style.display = "none";
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 60;
  clear();
  drawPlayer();
  drawEnemies();
}

function playSound(filename) {
  if (soundEnabled) {
    let sound = new Audio(filename);
    sound.play();
  }
}

function fetchJoke() {
  fetch("https://official-joke-api.appspot.com/random_joke")
    .then((response) => response.json())
    .then((joke) => {
      document.getElementById(
        "jokeText"
      ).textContent = `${joke.setup} - ${joke.punchline}`;
    })
    .catch((error) => console.error("Error fetching joke:", error));
}

function gameLoop() {
  if (!isGameRunning) return;
  clear();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawEnemyBullets();
  updateBullets();
  updateEnemyBullets();
  collisionDetection();
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  else if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
  animationFrameId = requestAnimationFrame(gameLoop);
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

startButton.addEventListener("click", function () {
  if (!isGameRunning) {
    document.getElementById("game-title").style.display = "none";
    isGameRunning = true;
    canvas.focus();
    resetGame();
    enemyShootIntervalId = setInterval(enemyShoot, enemyShootInterval);
    gameLoop();
  }
});

pauseButton.addEventListener("click", function () {
  isGameRunning = !isGameRunning;
  if (isGameRunning) {
    gameLoop();
  }
  canvas.focus();
});

resetButton.addEventListener("click", function () {
  resetGame();
  if (!isGameRunning) {
    isGameRunning = true;
    gameLoop();
  }
  setTimeout(function () {
    canvas.focus();
  }, 0);
});

canvas.addEventListener("touchstart", (e) => {
  if (isGameRunning) {
    touchStartX = e.touches[0].clientX;
    isTouching = true;
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (isTouching) {
    const touchX = e.touches[0].clientX;
    const touchDeltaX = touchX - touchStartX;
    player.x += touchDeltaX;
    touchStartX = touchX;
    if (player.x < 0) player.x = 0;
    else if (player.x + player.width > canvas.width)
      player.x = canvas.width - player.width;
  }
});

canvas.addEventListener("touchend", () => {
  isTouching = false;
});

canvas.addEventListener("touchcancel", () => {
  isTouching = false;
});

canvas.addEventListener("touchstart", (e) => {
  if (isGameRunning) {
    shoot();
  }
});

canvas.addEventListener("keydown", keyDown);
canvas.addEventListener("keyup", keyUp);
document.getElementById("jokeButton").addEventListener("click", fetchJoke);

createEnemies();
updateScoreDisplay();
updateLivesDisplay();
