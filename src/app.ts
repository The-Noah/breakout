const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const BALL_RADIUS = 10;
const BALL_SPEED = 3;

const PADDLE_SPEED = 6;

const BRICK_ROW_COUNT = 3;
const BRICK_COLUMN_COUNT = 5;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;

let running = true;
let score = 0;
let lives = 3;
let paddleCanCollide = true;

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

interface GameObject{
  x: number;
  y: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  update: () => void;
  draw: () => void;
}

const gameObjects: GameObject[] = [];

const ball: GameObject = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  width: BALL_RADIUS,
  height: BALL_RADIUS,
  update: function(){
    if(this.x + this.dx < this.width || this.x + this.dx > canvas.width - this.width){
      this.dx = -this.dx;
    }

    if(this.y + this.dy < this.height){
      this.dy = -this.dy;
    }else if(paddleCanCollide && checkCollisionBetweenObjects(paddle, ball)){
      this.dy = -this.dy;
      paddleCanCollide = false;
      setTimeout(() => paddleCanCollide = true, 100);
    }else if(this.y + this.dy > canvas.height - this.height){
      lives--;
      if(lives > 0){
        resetPaddleAndBall();
      }else{
        end("Game Over");
      }
    }

    this.x += this.dx;
    this.y += this.dy;
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
  dx: 0,
  dy: 0,
  width: 75,
  height: 10,
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
for(let column = 0; column < BRICK_COLUMN_COUNT; column++){
  bricks[column] = [];

  for(let row = 0; row < BRICK_ROW_COUNT; row++){
    bricks[column][row] = {
      x: (column * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT,
      y: (row * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP
    };
  }
}

const checkCollision = (minAx: number, minAy: number, maxAx: number, maxAy: number, minBx: number, minBy: number, maxBx: number, maxBy: number) => {
  return !(maxAx < minBx || minAx > maxBx || minAy > maxBy || maxAy < minBy);
};

const checkCollisionBetweenObjects = (a: GameObject, b: GameObject) => {
  return checkCollision(a.x, a.y, a.x + a.width, a.y + a.height, b.x, b.y, b.x + b.width, b.y + b.height);
};

const checkBrickCollision = () => {
  for(let column = 0; column < BRICK_COLUMN_COUNT; column++){
    for(let row = 0; row < BRICK_ROW_COUNT; row++){
      const brick = bricks[column][row];
      if(!brick){
        continue;
      }

      if(checkCollision(ball.x, ball.y, ball.x + ball.width, ball.y + ball.height, brick.x, brick.y, brick.x + BRICK_WIDTH, brick.y + BRICK_HEIGHT)){
        ball.dy = -ball.dy;
        bricks[column][row] = false;
        score++;

        if(score === BRICK_ROW_COUNT * BRICK_COLUMN_COUNT){
          end("You Win!");
        }
      }
    }
  }
};

const resetPaddleAndBall = () => {
  paddle.x = (canvas.width - paddle.width) / 2;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 30;
  ball.dx = BALL_SPEED;
  ball.dy = -BALL_SPEED;
};

const end = (message: string) => {
  alert(message);
  running = false;
  window.location.reload();
};

const update = () => {
  if(!running){
    return;
  }

  for(const gameObject of gameObjects){
    gameObject.update();
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

  ctx.fillText(`Score: ${score}`, 8, 20);
  ctx.fillText(`Lives: ${lives}`, canvas.width - 64, 20);
};

ctx.font = "16px Arial";
ctx.fillStyle = "#FFF";

resetPaddleAndBall();

update();
