const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const PARTICLES = 50;
const PARTICLE_SIZE = 2;
const PARTICLE_SPEED = 10;

const BALL_RADIUS = 10;
let ballSpeed = 3;

const PADDLE_SPEED = 6;
const PADDLE_INFLUENCE = 1;

const BRICK_ROW_COUNT = 3;
const BRICK_COLUMN_COUNT = 5;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;

let score = 0;
let lives = 3;
let round = 1;

const keysPressed = {
  left: false,
  right: false
};

document.addEventListener("keydown", (e) => {
  if(e.key === "Left" || e.key === "ArrowLeft"){
    keysPressed.left = true;
  }else if(e.key === "Right" || e.key === "ArrowRight"){
    keysPressed.right = true;
  }
}, false);

document.addEventListener("keyup", (e) => {
  if(e.key === "Left" || e.key === "ArrowLeft"){
    keysPressed.left = false;
  }else if(e.key === "Right" || e.key === "ArrowRight"){
    keysPressed.right = false;
  }
}, false);

document.addEventListener("mousemove", (e) => {
  const deltaX = e.clientX - canvas.offsetLeft;
  if(deltaX > 0 && deltaX < canvas.width){
    paddle.x = deltaX - paddle.width / 2;
  }
}, false);

interface Collider{
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GameObject extends Collider{
  dx: number;
  dy: number;
  update: () => void;
  draw: () => void;
}

const gameObjects: GameObject[] = [];

const ball: GameObject = {
  x: 0,
  y: 0,
  width: BALL_RADIUS,
  height: BALL_RADIUS,
  dx: 0,
  dy: 0,
  update: function(){
    if(this.x + this.dx < this.width || this.x + this.dx > canvas.width - this.width){
      this.dx = -this.dx;
    }

    if(this.y + this.dy < this.height){
      this.dy = -this.dy;
    }else if(checkCollisionBetweenColliders(paddle, this) || (this.y + this.dy >= canvas.height - this.height && this.x - this.width > paddle.x && this.x < paddle.x + paddle.width)){
      this.dy = -this.dy;
      this.dx += Math.random() + PADDLE_INFLUENCE * (ball.x + ball.width > paddle.x + paddle.width / 2 ? 1 : -1);

      if(Math.abs(this.dx) < ballSpeed / 2){
        this.dx = this.dx < 0 ? -ballSpeed / 2 : ballSpeed / 2;
      }else if(Math.abs(this.dx) > ballSpeed * 2){
        this.dx = this.dx < 0 ? -ballSpeed * 2 : ballSpeed * 2;
      }

    }else if(this.y + this.dy > canvas.height - this.height){
      lives--;
      if(lives > 0){
        resetPaddleAndBall();
      }else{
        reset(`Game Over. Final Score: ${score}`);
      }
    }
  },
  draw: function(){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
};
gameObjects.push(ball);

const paddle: GameObject = {
  x: 0,
  y: canvas.height - 15,
  width: 75,
  height: 10,
  dx: 0,
  dy: 0,
  update: function(){
    if(keysPressed.left){
      this.x -= PADDLE_SPEED;
    }else if(keysPressed.right){
      this.x += PADDLE_SPEED;
    }

    if(this.x < 0){
      this.x = 0;
    }else if(this.x + this.width > canvas.width){
      this.x = canvas.width - this.width;
    }
  },
  draw: function(){
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();
    ctx.closePath();
  }
};
gameObjects.push(paddle);

const bricks = [];
const generateBricks = () => {
  bricks.splice(bricks.length - 1);

  for(let column = 0; column < BRICK_COLUMN_COUNT; column++){
    bricks[column] = [];
  
    for(let row = 0; row < BRICK_ROW_COUNT; row++){
      bricks[column][row] = {
        x: (column * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT,
        y: (row * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP
      };
    }
  }
};

const checkCollision = (minAx: number, minAy: number, maxAx: number, maxAy: number, minBx: number, minBy: number, maxBx: number, maxBy: number) => {
  return !(maxAx < minBx || minAx > maxBx || minAy > maxBy || maxAy < minBy);
};

const checkCollisionBetweenColliders = (a: Collider, b: Collider) => {
  return checkCollision(a.x, a.y, a.x + a.width, a.y + a.height, b.x, b.y, b.x + b.width, b.y + b.height);
};

const spawnParticle = (x: number, y: number, dx?: number, dy?: number) => {
  const particle: GameObject = {
    x,
    y,
    width: PARTICLE_SIZE,
    height: 0,
    dx: dx ? dx : (.2 + PARTICLE_SPEED * Math.random()) * (Math.random() < .5 ? -1 : 1),
    dy: dy ? dy : (.2 + PARTICLE_SPEED * Math.random()) * (Math.random() < .5 ? -1 : 1),
    update: function(){},
    draw: function(){
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
  };

  gameObjects.push(particle);
};

const checkBrickCollision = () => {
  for(let column = 0; column < BRICK_COLUMN_COUNT; column++){
    for(let row = 0; row < BRICK_ROW_COUNT; row++){
      const brick = bricks[column][row];
      if(!brick){
        continue;
      }

      if(checkCollisionBetweenColliders(ball, {...brick, width: BRICK_WIDTH, height: BRICK_HEIGHT})){
        ball.dy = -ball.dy;
        bricks[column][row] = false;
        score += round;

        for(let i = 0; i < PARTICLES; i++){
          spawnParticle(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2);
        }

        if(bricks.filter((row) => row.filter((brick) => brick).length > 0).length === 0){
          round++;
          reset();
        }
      }
    }
  }
};

const resetPaddleAndBall = () => {
  paddle.x = (canvas.width - paddle.width) / 2;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 30;
  ball.dx = ballSpeed * Math.random() * (Math.random() < .5 ? -1 : 1);
  ball.dy = -ballSpeed * 1.5;
};

const reset = (message?: string) => {
  if(message){
    alert(message);
    score = 0;
    lives = 3;
  }

  ballSpeed += round / 2;

  resetPaddleAndBall();
  generateBricks();
};

const update = () => {
  for(const gameObject of gameObjects){
    gameObject.update();

    gameObject.x += gameObject.dx;
    gameObject.y += gameObject.dy;

    if(gameObject !== ball && gameObject !== paddle && (gameObject.x < 0 || gameObject.x + gameObject.width > canvas.width || gameObject.y < 0 || gameObject.y + gameObject.height > canvas.height)){
      gameObjects.splice(gameObjects.indexOf(gameObject), 1);
    }
  }

  checkBrickCollision();

  draw();

  requestAnimationFrame(update);
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for(const gameObject of gameObjects){
    gameObject.draw();
  }

  for(let column = 0; column < BRICK_COLUMN_COUNT; column++){
    for(let row = 0; row < BRICK_ROW_COUNT; row++){
      const brick = bricks[column][row];

      if(!brick){
        continue;
      }

      ctx.beginPath();
      ctx.rect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      ctx.fill();
      ctx.closePath();
    }
  }

  ctx.fillText(`Score: ${score}`, 8, 18);
  ctx.fillText(`Lives: ${lives}`, canvas.width - ctx.measureText(`Lives: ${lives}`).width - 8, 18);
};

ctx.font = "16px Arial";
ctx.fillStyle = "#FFF";

reset();

update();
