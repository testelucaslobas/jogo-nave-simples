// Jogo de nave com seleção de naves e tiros personalizados
// O jogador escolhe uma das quatro naves apresentadas na tela inicial.
// Cada nave dispara projéteis com cores e tamanhos diferentes.
// O inimigo é representado pela imagem 'inimigo.png'.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensões do canvas
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Variáveis de estado
let player;
let bullets;
let enemies;
let score;
let gameState = 'start'; // 'start', 'running' ou 'gameover'
let particles;
let stars;

// Velocidades iniciais e controles de spawn
let bulletSpeed = 5;
let enemySpeed = 1;
let spawnInterval = 1500;
let lastSpawn = 0;

// Índice da nave selecionada (0-3). O jogador escolhe na tela inicial.
let selectedShipIndex = null;

// Caminhos das imagens das naves e carregamento das imagens
const shipPaths = ['images/nave1.png', 'images/nave2.png', 'images/nave3.png', 'images/nave4.png'];
const shipImages = [];
shipPaths.forEach((p) => {
  const img = new Image();
  img.src = p;
  shipImages.push(img);
});

// Imagem do inimigo
const enemyImage = new Image();
enemyImage.src = 'images/inimigo.png';

// Estilos de tiro para cada nave (cor, largura e altura).
// Ajustados para combinar com as novas artes de nave enviadas pelo usuário.
// A nave 1 (vermelha) dispara tiros avermelhados; a nave 2 (azul) dispara tiros azuis;
// a nave 3 (amarela) dispara tiros dourados; a nave 4 (verde) dispara tiros esverdeados.
const bulletStyles = [
  { color: '#ff4c4c', w: 4, h: 10 }, // nave 1 – tiro vermelho
  { color: '#2ecfff', w: 3, h: 12 }, // nave 2 – tiro azul-ciano
  { color: '#ffd700', w: 5, h: 10 }, // nave 3 – tiro dourado
  { color: '#32cd32', w: 6, h: 8 }   // nave 4 – tiro verde-lima
];

// Retângulos para clique na seleção de naves
let shipSelectionRects = [];

/**
 * Inicializa ou reinicia o jogo. Não inicia o loop de atualização; isso é feito
 * quando o estado do jogo muda para 'running'.
 */
function initGame() {
  player = { x: WIDTH / 2, y: HEIGHT - 50, width: 40, height: 40 };
  bullets = [];
  enemies = [];
  particles = [];
  stars = [];
  score = 0;
  bulletSpeed = 5;
  enemySpeed = 1;
  spawnInterval = 1500;
  lastSpawn = 0;
  document.getElementById('score').textContent = `Pontuação: ${score}`;
  createStars(60);
}

/**
 * Cria estrelas para o fundo animado.
 * @param {number} num – número de estrelas
 */
function createStars(num) {
  stars = [];
  for (let i = 0; i < num; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }
}

/** Desenha as estrelas de fundo com transparência */
function drawStars() {
  ctx.fillStyle = '#ffffff';
  stars.forEach((s) => {
    ctx.globalAlpha = 0.5;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 1;
}

/** Atualiza a posição das estrelas, criando um efeito de movimentação */
function updateStars() {
  stars.forEach((s) => {
    s.y += s.speed;
    if (s.y > HEIGHT) {
      s.y = -s.size;
      s.x = Math.random() * WIDTH;
    }
  });
}

/** Desenha a nave do jogador. Se nenhuma nave estiver selecionada, não desenha nada. */
function drawPlayer() {
  if (selectedShipIndex === null) return;
  const img = shipImages[selectedShipIndex];
  if (img.complete) {
    ctx.drawImage(img, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
  } else {
    // Fallback para triângulo
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();
  }
}

/** Desenha os tiros na tela usando as propriedades individuais de cada bala */
function drawBullets() {
  bullets.forEach((b) => {
    ctx.fillStyle = b.color || '#ffff00';
    const w = b.width || 4;
    const h = b.height || 10;
    ctx.fillRect(b.x - w / 2, b.y - h, w, h);
  });
}

/** Desenha os inimigos usando a imagem do inimigo. */
function drawEnemies() {
  enemies.forEach((e) => {
    if (enemyImage.complete) {
      ctx.drawImage(enemyImage, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
    } else {
      // Fallback para quadrado colorido
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
      ctx.strokeStyle = '#aa0000';
      ctx.strokeRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
    }
  });
}

/** Cria partículas para efeitos de explosão quando um inimigo é destruído */
function createExplosion(x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30
    });
  }
}

/** Atualiza a posição das partículas e remove as que já expiraram */
function updateParticles() {
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravidade leve
    p.life--;
  });
  particles = particles.filter((p) => p.life > 0);
}

/** Desenha as partículas de explosão */
function drawParticles() {
  particles.forEach((p) => {
    ctx.fillStyle = `rgba(255, 165, 0, ${p.life / 30})`;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
}

/** Spawna um inimigo na parte superior da tela com posição aleatória */
function spawnEnemy() {
  const size = 40;
  const x = Math.random() * (WIDTH - size) + size / 2;
  enemies.push({ x, y: -size, size });
}

/** Desenha a tela inicial com a seleção de naves */
function drawStartScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Escolha sua nave', WIDTH / 2, HEIGHT / 3);
  // Desenha as quatro naves para seleção
  const totalWidth = shipImages.length * 60 + (shipImages.length - 1) * 20;
  let startX = (WIDTH - totalWidth) / 2;
  const y = HEIGHT / 2;
  shipSelectionRects = [];
  for (let i = 0; i < shipImages.length; i++) {
    const w = 60;
    const h = 60;
    const rect = { x: startX, y: y - h / 2, w, h, index: i };
    shipSelectionRects.push(rect);
    // Fundo levemente transparente para destacar a área
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(rect.x - 2, rect.y - 2, w + 4, h + 4);
    const img = shipImages[i];
    if (img.complete) {
      ctx.drawImage(img, rect.x, rect.y, w, h);
    }
    startX += w + 20;
  }
  ctx.font = '14px Arial';
  ctx.fillStyle = '#ccc';
  ctx.fillText('Clique em uma nave para começar', WIDTH / 2, y + 60);
}

/** Desenha a tela de Game Over */
function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
  ctx.font = '16px Arial';
  ctx.fillText('Clique para reiniciar', WIDTH / 2, HEIGHT / 2 + 30);
}

/** Atualiza a lógica do jogo e desenha todos os elementos na tela */
function update(timestamp) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Atualiza e desenha fundo estelar
  updateStars();
  drawStars();

  if (gameState === 'start') {
    drawStartScreen();
    window.requestAnimationFrame(update);
    return;
  }
  if (gameState === 'gameover') {
    drawGameOverScreen();
    window.requestAnimationFrame(update);
    return;
  }

  // Jogo rodando: spawn de inimigos em intervalos regulares
  if (timestamp - lastSpawn > spawnInterval) {
    spawnEnemy();
    lastSpawn = timestamp;
    // Torna o jogo mais difícil progressivamente
    if (spawnInterval > 500) {
      spawnInterval -= 10;
    }
    enemySpeed += 0.05;
    bulletSpeed += 0.03;
  }

  // Atualiza balas
  bullets = bullets.filter((b) => b.y > -10);
  bullets.forEach((b) => {
    b.y -= bulletSpeed;
  });

  // Atualiza inimigos
  enemies.forEach((e) => {
    e.y += enemySpeed;
  });

  // Verifica colisões entre balas e inimigos
  bullets.forEach((b) => {
    enemies.forEach((e) => {
      const bulletHeight = b.height || 10;
      if (
        b.x > e.x - e.size / 2 &&
        b.x < e.x + e.size / 2 &&
        b.y - bulletHeight < e.y + e.size / 2 &&
        b.y > e.y - e.size / 2
      ) {
        e.hit = true;
        b.hit = true;
        createExplosion(e.x, e.y);
      }
    });
  });
  // Remove balas e inimigos atingidos
  bullets = bullets.filter((b) => !b.hit);
  enemies = enemies.filter((e) => {
    if (e.hit) {
      score++;
      document.getElementById('score').textContent = `Pontuação: ${score}`;
      return false;
    }
    return true;
  });

  // Verifica se algum inimigo alcançou a linha do jogador
  enemies.forEach((e) => {
    if (e.y + e.size / 2 > player.y + player.height / 2) {
      endGame();
    }
  });

  // Desenha a nave, balas e inimigos
  drawPlayer();
  drawBullets();
  drawEnemies();
  updateParticles();
  drawParticles();

  window.requestAnimationFrame(update);
}

/**
 * Define o estado do jogo como game over
 */
function endGame() {
  gameState = 'gameover';
}

// Eventos de clique: seleção de nave, reinício ou disparo
canvas.addEventListener('click', (event) => {
  if (gameState === 'start') {
    // Verifica se clicou em alguma nave
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    for (const r of shipSelectionRects) {
      if (
        clickX >= r.x &&
        clickX <= r.x + r.w &&
        clickY >= r.y &&
        clickY <= r.y + r.h
      ) {
        selectedShipIndex = r.index;
        gameState = 'running';
        initGame();
        window.requestAnimationFrame(update);
        return;
      }
    }
    return;
  }
  if (gameState === 'gameover') {
    // Reinicia o jogo mantendo a nave selecionada
    gameState = 'running';
    initGame();
    window.requestAnimationFrame(update);
    return;
  }
  // Se estiver rodando, atira
  if (selectedShipIndex !== null) {
    const style = bulletStyles[selectedShipIndex] || { color: '#ffff00', w: 4, h: 10 };
    bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
      color: style.color,
      width: style.w,
      height: style.h
    });
  }
});

// Evento para mover a nave no eixo X com o mouse
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  player.x = Math.max(player.width / 2, Math.min(WIDTH - player.width / 2, x));
});

// Inicia o jogo assim que a página carrega
window.onload = () => {
  initGame();
  window.requestAnimationFrame(update);
};