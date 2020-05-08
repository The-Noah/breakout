const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const BALL_RADIUS = 10;
const BALL_SPEED = 3;

const PADDLE_WIDTH = 75;
const PADDLE_HEIGHT = 10;
const PADDLE_SPEED = 6;

const BRICK_ROW_COUNT = 3;
const BRICK_COLUMN_COUNT = 5;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;

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
    paddle.x = deltaX - PADDLE_WIDTH / 2;
  }
}, false);

interface GameObject{
  x: number;
  y: number;
  dx: number;
  dy: number;
  update: () => void;
  draw: () => void;
}

const gameObjects: GameObject[] = [];

const ball: GameObject = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  update: function(){
    if(this.x + this.dx < BALL_RADIUS || this.x + this.dx > canvas.width - BALL_RADIUS){
      this.dx = -this.dx;
    }

    if(this.y + this.dy < BALL_RADIUS){
      this.dy = -this.dy;
    }else if(paddleCanCollide && this.x > paddle.x && this.x < paddle.x + PADDLE_WIDTH && this.y + BALL_RADIUS >= paddle.y){
      this.dy = -this.dy;
      paddleCanCollide = false;
      setTimeout(() => paddleCanCollide = true, 200);
    }else if(this.y + this.dy > canvas.height - BALL_RADIUS){
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
    ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
};
gameObjects.push(ball);

const paddle: GameObject = {
  x: 0,
  y: canvas.height - PADDLE_HEIGHT * 1.5,
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
    }else if(this.x + PADDLE_WIDTH > canvas.width){
      this.x = canvas.width - PADDLE_WIDTH;
    }
  },
  draw: function(){
    ctx.beginPath();
    ctx.rect(this.x, this.y, PADDLE_WIDTH, PADDLE_HEIGHT);
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

const checkBrickCollision = (object: GameObject) => {
  for(let column = 0; column < BRICK_COLUMN_COUNT; column++){
    for(let row = 0; row < BRICK_ROW_COUNT; row++){
      const brick = bricks[column][row];

      if(object.x > brick.x && object.x < brick.x + BRICK_WIDTH && object.y > brick.y && object.y < brick.y + BRICK_HEIGHT){
        object.dy = -object.dy;
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
  paddle.x = (canvas.width - PADDLE_WIDTH) / 2;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 30;
  ball.dx = BALL_SPEED;
  ball.dy = -BALL_SPEED;
};

const end = (message: string) => {
  alert(message);
  window.location.reload();
};

const update = () => {
  for(const gameObject of gameObjects){
    gameObject.update();
  }

  checkBrickCollision(ball);

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
