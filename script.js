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
let gameOver;

// Configurações
let bulletSpeed = 5; // velocidade inicial dos tiros
let enemySpeed = 1; // velocidade inicial dos inimigos
let spawnInterval = 1500; // intervalo inicial de spawn de inimigos em ms
let lastSpawn = 0;

// Função para iniciar ou reiniciar o jogo
function startGame() {
  player = {
    x: WIDTH / 2,
    y: HEIGHT - 40,
    width: 40,
    height: 20
  };
  bullets = [];
  enemies = [];
  score = 0;
  document.getElementById('score').textContent = `Pontuação: ${score}`;
  document.getElementById('gameOver').style.display = 'none';
  gameOver = false;
  bulletSpeed = 5;
  enemySpeed = 1;
  spawnInterval = 1500;
  lastSpawn = 0;
  window.requestAnimationFrame(update);
}

// Função para desenhar a nave do jogador
function drawPlayer() {
  ctx.fillStyle = '#0bf';
  ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
}

// Função para desenhar balas
function drawBullets() {
  ctx.fillStyle = '#ff0';
  bullets.forEach((b) => {
    ctx.fillRect(b.x - 2, b.y - 10, 4, 10);
  });
}

// Função para desenhar inimigos
function drawEnemies() {
  ctx.fillStyle = '#f00';
  enemies.forEach((e) => {
    ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
  });
}

// Atualizar posições e lógica
function update(timestamp) {
  if (gameOver) return;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

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
    if (e.y + e.size / 2 > player.y - player.height / 2) {
      endGame();
    }
  });

  // Desenha tudo
  drawPlayer();
  drawBullets();
  drawEnemies();

  // Próximo frame
  window.requestAnimationFrame(update);
}

// Função para spawnar inimigos
function spawnEnemy() {
  const size = 30;
  const x = Math.random() * (WIDTH - size) + size / 2;
  enemies.push({ x, y: -size, size });
}

// Atira ao clicar
canvas.addEventListener('click', () => {
  if (gameOver) {
    // Reinicia se clicar após fim do jogo
    startGame();
    return;
  }
  // Cria um novo projétil na posição atual da nave
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
  gameOver = true;
  document.getElementById('gameOver').style.display = 'block';
}

// Inicia o jogo quando a página carrega
window.onload = () => {
  startGame();
};