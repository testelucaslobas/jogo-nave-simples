// Jogo de nave simples em JavaScript
// O jogador controla uma nave na parte inferior da tela e deve disparar
// projéteis para destruir inimigos que aparecem na parte superior.
// Clique com o mouse para atirar. Com o passar do tempo, os inimigos
// e os projéteis ficam mais rápidos.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensões do canvas
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Estado do jogo
let player;
let bullets;
let enemies;
let score;
let gameState = 'start'; // start, running, gameover

// Partículas para explosões
let particles;
// Estrelas de fundo para efeito de espaço
let stars;

// Configurações
let bulletSpeed = 5; // velocidade inicial dos tiros
let enemySpeed = 1; // velocidade inicial dos inimigos
let spawnInterval = 1500; // intervalo inicial de spawn de inimigos em ms
let lastSpawn = 0;

/**
 * Inicializa ou reinicia todas as estruturas do jogo.
 * Não inicia imediatamente o loop; isso é feito quando gameState muda para 'running'.
 */
function initGame() {
  player = {
    x: WIDTH / 2,
    y: HEIGHT - 50,
    width: 30,
    height: 30
  };
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

// Cria estrelas no fundo
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

// Desenha estrelas
function drawStars() {
  ctx.fillStyle = '#ffffff';
  stars.forEach((s) => {
    ctx.globalAlpha = 0.5;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 1;
}

// Atualiza estrelas
function updateStars() {
  stars.forEach((s) => {
    s.y += s.speed;
    if (s.y > HEIGHT) {
      s.y = -s.size;
      s.x = Math.random() * WIDTH;
    }
  });
}

// Desenha a nave do jogador como um triângulo
function drawPlayer() {
  ctx.fillStyle = '#00aaff';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.height / 2);
  ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
  ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
  ctx.closePath();
  ctx.fill();
}

// Desenha balas
function drawBullets() {
  ctx.fillStyle = '#ffff00';
  bullets.forEach((b) => {
    ctx.fillRect(b.x - 2, b.y - 10, 4, 10);
  });
}

// Desenha inimigos como quadrados com borda
function drawEnemies() {
  enemies.forEach((e) => {
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
    ctx.strokeStyle = '#aa0000';
    ctx.strokeRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
  });
}

// Cria partículas de explosão quando um inimigo é destruído
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

// Atualiza partículas
function updateParticles() {
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravidade leve
    p.life--;
  });
  particles = particles.filter((p) => p.life > 0);
}

// Desenha partículas
function drawParticles() {
  particles.forEach((p) => {
    ctx.fillStyle = `rgba(255, 165, 0, ${p.life / 30})`;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
}

// Atualizar posições e lógica
function update(timestamp) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Sempre desenha estrelas
  updateStars();
  drawStars();

  if (gameState === 'start') {
    // Tela de início
    drawStartScreen();
    window.requestAnimationFrame(update);
    return;
  }
  if (gameState === 'gameover') {
    // Tela de game over
    drawGameOverScreen();
    window.requestAnimationFrame(update);
    return;
  }

  // Somente se estiver rodando
  // Spawn de inimigos em intervalos regulares
  if (timestamp - lastSpawn > spawnInterval) {
    spawnEnemy();
    lastSpawn = timestamp;
    // Diminui o intervalo de spawn gradualmente até um limite mínimo
    if (spawnInterval > 500) {
      spawnInterval -= 10;
    }
    // Aumenta as velocidades de inimigos e balas aos poucos
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

  // Checa colisões entre balas e inimigos
  bullets.forEach((b) => {
    enemies.forEach((e) => {
      if (
        b.x > e.x - e.size / 2 &&
        b.x < e.x + e.size / 2 &&
        b.y - 10 < e.y + e.size / 2 &&
        b.y > e.y - e.size / 2
      ) {
        e.hit = true;
        b.hit = true;
        // cria explosão na posição do inimigo
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

  // Desenha tudo
  drawPlayer();
  drawBullets();
  drawEnemies();
  updateParticles();
  drawParticles();

  // Próximo frame
  window.requestAnimationFrame(update);
}

// Função para spawnar inimigos
function spawnEnemy() {
  const size = 30;
  const x = Math.random() * (WIDTH - size) + size / 2;
  enemies.push({ x, y: -size, size });
}

// Desenha tela de início
function drawStartScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Clique para começar', WIDTH / 2, HEIGHT / 2);
  ctx.font = '16px Arial';
  ctx.fillText('Mova o mouse para controlar a nave e clique para atirar', WIDTH / 2, HEIGHT / 2 + 30);
}

// Desenha tela de game over
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

// Atira ao clicar ou inicia/reinicia jogo conforme estado
canvas.addEventListener('click', () => {
  if (gameState === 'start') {
    // começa o jogo
    gameState = 'running';
    initGame();
    window.requestAnimationFrame(update);
    return;
  }
  if (gameState === 'gameover') {
    // reinicia após fim do jogo
    gameState = 'running';
    initGame();
    window.requestAnimationFrame(update);
    return;
  }
  // Se estiver rodando, atira
  bullets.push({ x: player.x, y: player.y - player.height / 2 });
});

// Mover a nave com o mouse (apenas eixo X)
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  // Constrói a posição x para ficar dentro dos limites do canvas
  player.x = Math.max(player.width / 2, Math.min(WIDTH - player.width / 2, x));
});

// Função para finalizar o jogo
function endGame() {
  gameState = 'gameover';
}

// Quando a página carrega, exibe tela inicial
window.onload = () => {
  initGame();
  window.requestAnimationFrame(update);
};