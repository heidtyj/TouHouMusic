// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 800;

const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const healthDisplay = document.getElementById('health');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const gameOverMessage = document.getElementById('game-over-message');

const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

const backToMainButton = document.getElementById('back-to-main-button');

const playerImage = new Image();
const bossImage = new Image();

let imagesLoaded = 0;
const totalImages = 2;

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log("모든 이미지가 로드되었습니다.");
        updateUI();
    }
}

playerImage.src = 'assets/player.png';
playerImage.onload = checkAllImagesLoaded;
playerImage.onerror = () => console.error("플레이어 이미지 로드 실패! 경로를 확인하세요.");

bossImage.src = 'assets/boss.gif';
bossImage.onload = checkAllImagesLoaded;
bossImage.onerror = () => console.error("보스 이미지 로드 실패! 경로를 확인하세요.");

let score = 0;
let playerHealth = 100;
let gameOver = false;
let gameStarted = false;
let animationFrameId;

let playerFireRate = 10;
let lastPlayerFireFrame = 0;

let bossMaxHealth = 6000; // **수정됨: 보스 기본 체력 증가**
let bossCurrentHealth = bossMaxHealth;
let bossPhase = 1;
const maxBossPhases = 4; // 최대 페이즈 수 4로 변경

// ====================================================================
// 1. 플레이어 클래스 정의
// ====================================================================
class Player {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 30;
        this.speed = 6; // **수정됨: 플레이어 이동 속도 증가**
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isMovingUp = false;
        this.isMovingDown = false;

        this.hitboxRadius = 5; // 플레이어 히트박스 (빨간 점)의 반지름
        this.hitboxX = this.x + this.width / 2;
        this.hitboxY = this.y + this.height / 2;
    }

    draw() {
        if (playerImage.complete && playerImage.naturalWidth !== 0) {
            ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.hitboxX, this.hitboxY, this.hitboxRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        let dx = 0;
        let dy = 0;

        if (this.isMovingLeft) dx -= this.speed;
        if (this.isMovingRight) dx += this.speed;
        if (this.isMovingUp) dy -= this.speed;
        if (this.isMovingDown) dy += this.speed;

        if (dx !== 0 && dy !== 0) {
            const diagonalSpeed = Math.sqrt(this.speed * this.speed / 2);
            dx = (dx > 0 ? 1 : -1) * diagonalSpeed;
            dy = (dy > 0 ? 1 : -1) * diagonalSpeed;
        }

        this.x += dx;
        this.y += dy;

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

        this.hitboxX = this.x + this.width / 2;
        this.hitboxY = this.y + this.height / 2;
    }

    // **수정됨: 플레이어 탄막 5줄 발사 및 유도탄 추가**
    shoot() {
        const bulletSpeed = -40; 
        const homingBulletSpeed = -20; // 유도탄은 일반탄보다 느리게
        const offset = 10; 
        const spread = 20; // 5발의 탄막이 퍼지는 간격

        // 일반 탄막 5개
        for (let i = 0; i < 5; i++) {
            // 중앙을 기준으로 -2, -1, 0, 1, 2 에 해당하는 위치에서 발사
            const bulletXOffset = (i - 2) * spread; 
            playerBullets.push(new Bullet(this.x + this.width / 2 + bulletXOffset, this.y, 5, bulletSpeed, 'lime', 0, false, false));
        }
        
        // 유도탄 발사
        if (boss && boss.active) { // 보스가 존재하고 활성화 상태일 때만 유도탄 발사
            playerBullets.push(new Bullet(this.x + this.width / 2, this.y, 7, homingBulletSpeed, 'gold', 0, false, true)); // isHoming: true
        }
    }
}

// ====================================================================
// 2. 총알 클래스 정의
// ====================================================================
class Bullet {
    // **수정됨: isBossBullet, isHoming 속성 추가**
    constructor(x, y, radius, speedY, color, speedX = 0, isBossBullet = false, isHoming = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedY = speedY;
        this.color = color;
        this.active = true;
        this.speedX = speedX;
        this.isBossBullet = isBossBullet; 
        this.isHoming = isHoming; // 새 속성 추가
        this.homingStrength = 0.05; // 유도탄의 유도 강도
    }

    draw() {
        if (!this.active) return;

        if (this.isBossBullet) {
            ctx.save(); 
            ctx.translate(this.x, this.y); 

            const angle = Math.atan2(this.speedY, this.speedX) + Math.PI / 2;
            ctx.rotate(angle); 

            ctx.fillStyle = 'grey'; 

            const bladeLength = this.radius * 2.5; 
            const bladeWidth = this.radius * 0.8;  
            const hiltLength = this.radius * 0.7;  
            const hiltWidth = this.radius * 1.5;   

            ctx.beginPath();
            ctx.moveTo(0, -(bladeLength + hiltLength / 2)); 
            ctx.lineTo(-bladeWidth / 2, -hiltLength / 2); 
            ctx.lineTo(bladeWidth / 2, -hiltLength / 2); 
            ctx.closePath();
            ctx.fill();

            ctx.fillRect(-hiltWidth / 2, -hiltLength / 2, hiltWidth, hiltLength);

            ctx.restore(); 

        } else {
            // 플레이어 총알 (원) 그리기
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    update() {
        if (!this.active) return;

        if (this.isHoming && boss && boss.active) {
            // 보스를 향해 방향을 조절
            const targetX = boss.x + boss.width / 2;
            const targetY = boss.y + boss.height / 2;

            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const targetAngle = Math.atan2(dy, dx);
                // 현재 속도 벡터
                let currentAngle = Math.atan2(this.speedY, this.speedX);

                // 각도 차이 계산 (최단 경로)
                let angleDiff = targetAngle - currentAngle;
                if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                // 유도 강도만큼 각도 조절
                currentAngle += angleDiff * this.homingStrength;

                // 새로운 속도 적용
                const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                this.speedX = currentSpeed * Math.cos(currentAngle);
                this.speedY = currentSpeed * Math.sin(currentAngle);
            }
        }

        this.y += this.speedY;
        this.x += this.speedX;

        if (this.y + this.radius < 0 || this.y - this.radius > canvas.height ||
            this.x + this.radius < 0 || this.x - this.radius > canvas.width) {
            this.active = false;
        }
    }
}

// ====================================================================
// 2.5. LaserWall 클래스 재설계 (사진과 동일한 패턴)
// ====================================================================
class LaserWall {
    // **수정됨: moveSpeedY 인자 추가 및 초기 Y 위치 조정**
    constructor(initialY, color, animationDuration = 120, holdDuration = 60, moveSpeedY = 0) {
        this.y = initialY; // 레이저의 중앙 Y 좌표
        this.color = color;
        this.active = true;
        this.currentFrame = 0;
        this.animationDuration = animationDuration; // 커지고 벌어지는 시간 (프레임)
        this.holdDuration = holdDuration; // 최대로 벌어진 상태 유지 시간 (프레임)
        this.totalDuration = animationDuration * 2 + holdDuration; // 총 지속 시간 (벌어지고 + 유지하고 + 좁아지는)
        this.moveSpeedY = moveSpeedY; // **새 속성: 레이저의 Y축 이동 속도**

        // 레이저의 초기 상태 (매우 작게 모여있음)
        this.baseWidth = 5; // 초기 중앙부 두께
        this.tipOffset = 20; // 뾰족한 끝을 만들기 위한 오프셋 (y축)
        this.maxBendX = canvas.width * 0.45; // 최대 좌우 벌어지는 정도 (캔버스 절반에 가까움)

        // 애니메이션 진행률 (0에서 1까지)
        this.progress = 0; 
        this.x = canvas.width / 2; // 레이저의 중심 X 좌표
        this.thickness = 10; // 레이저의 수직 두께 (뾰족한 부분의 너비)
    }

    draw() {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        ctx.beginPath();

        const halfWidth = this.baseWidth / 2 + this.progress * this.maxBendX; // 현재 중앙부의 절반 너비
        const topY = this.y - this.tipOffset; 
        const bottomY = this.y + this.tipOffset;

        // 6개의 점으로 이루어진 다각형 그리기 (양 끝이 뾰족한 모양)
        // 시작점 (가운데 왼쪽)
        ctx.moveTo(this.x - halfWidth, this.y); 
        // 왼쪽 상단
        ctx.lineTo(this.x - halfWidth + this.thickness / 2, topY);
        // 중앙 상단 (없음 - 선으로 연결)
        // 오른쪽 상단
        ctx.lineTo(this.x + halfWidth - this.thickness / 2, topY);
        // 중앙 오른쪽
        ctx.lineTo(this.x + halfWidth, this.y);
        // 오른쪽 하단
        ctx.lineTo(this.x + halfWidth - this.thickness / 2, bottomY);
        // 중앙 하단 (없음)
        // 왼쪽 하단
        ctx.lineTo(this.x - halfWidth + this.thickness / 2, bottomY);
        ctx.closePath();
        ctx.fill();

        // 선택적으로 윤곽선 추가 (더 선명하게)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    update() {
        if (!this.active) return;

        this.currentFrame++;

        if (this.currentFrame <= this.animationDuration) {
            // 벌어지는 단계 (0 -> 1)
            this.progress = this.currentFrame / this.animationDuration;
        } else if (this.currentFrame <= this.animationDuration + this.holdDuration) {
            // 유지 단계 (1)
            this.progress = 1;
        } else if (this.currentFrame <= this.totalDuration) {
            // 좁아지는 단계 (1 -> 0)
            const decayProgress = (this.currentFrame - (this.animationDuration + this.holdDuration)) / this.animationDuration;
            this.progress = 1 - decayProgress;
        } else {
            // 소멸
            this.active = false;
        }

        // **수정됨: 레이저가 바닥에서 올라오도록 Y 좌표 업데이트**
        this.y -= this.moveSpeedY; 
        
        // 화면 밖으로 나가면 비활성화 (위로 완전히 나갈 경우)
        if (this.y + this.tipOffset < 0) {
            this.active = false;
        }
    }

    // 충돌 판정: 플레이어 히트박스(원)와 레이저(복잡한 다각형) 간
    // 다각형과 원의 충돌 판정은 복잡하므로,
    // 여기서는 레이저의 대략적인 직사각형 범위와 원의 충돌로 간소화합니다.
    isCollidingWithPlayer(playerHitbox) {
        const halfWidth = this.baseWidth / 2 + this.progress * this.maxBendX;
        const topY = this.y - this.tipOffset; 
        const bottomY = this.y + this.tipOffset;

        const laserRect = {
            x: this.x - halfWidth,
            y: topY,
            width: halfWidth * 2,
            height: bottomY - topY
        };
        return circleRectCollision(playerHitbox, laserRect);
    }
}


// ====================================================================
// 3. 보스 (Enemy) 클래스 정의
// ====================================================================
class Enemy {
    constructor(x, y, width, height, speedX, health, fireRate) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.speedX = speedX;
        this.health = health;
        this.maxHealth = health;
        this.active = true;
        this.fireRate = fireRate || 60;
        this.lastFireFrame = 0;
    }

    draw() {
        if (!this.active) return;
        if (bossImage.complete && bossImage.naturalWidth !== 0) {
            ctx.drawImage(bossImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        this.drawHealthBar();
    }

    drawHealthBar() {
        const barWidth = this.width;
        const barHeight = 10;
        const barX = this.x;
        const barY = this.y - 20;

        ctx.fillStyle = 'black';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = 'lime';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    update(frame) {
        if (!this.active) return;

        this.x += this.speedX;
        if (this.x + this.width > canvas.width || this.x < 0) {
            this.speedX *= -1;
        }

        if (frame - this.lastFireFrame > this.fireRate) {
            this.shoot();
            this.lastFireFrame = frame;
        }
    }

    // 페이즈별 탄막 패턴 로직
    shoot() {
        let baseBulletSpeed; 
        let numBullets;
        let spreadAngle;
        let bulletColor;
        let bulletRadius;
        let spiralSpeed;
        let bulletsPerShot;

        switch(bossPhase) {
            case 1: // 초기 페이즈
                baseBulletSpeed = 8; 
                numBullets = 3;
                spreadAngle = Math.PI / 8;
                bulletColor = 'red';
                bulletRadius = 8;

                const angleToPlayer0 = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < numBullets; i++) {
                    const currentAngle = angleToPlayer0 - (spreadAngle / 2) + (spreadAngle / (numBullets - 1)) * i;
                    const speedX = baseBulletSpeed * Math.cos(currentAngle);
                    const speedY = baseBulletSpeed * Math.sin(currentAngle);
                    enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, bulletRadius, speedY, bulletColor, speedX, true, false));
                }
                break;

            case 2: // 두 번째 페이즈
                baseBulletSpeed = 9; 
                numBullets = 15;
                spreadAngle = Math.PI * 0.9;
                bulletColor = 'yellow';
                bulletRadius = 7;

                const baseAngle1 = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < numBullets; i++) {
                    const currentAngle = baseAngle1 - (spreadAngle / 2) + (spreadAngle / (numBullets - 1)) * i;
                    const speedX = baseBulletSpeed * Math.cos(currentAngle);
                    const speedY = baseBulletSpeed * Math.sin(currentAngle);
                    enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, bulletRadius, speedY, bulletColor, speedX, true, false));
                }
                break;

            case 3: // 세 번째 페이즈 (필살기 재조정)
                if (this.health / this.maxHealth <= 0.5) {
                    baseBulletSpeed = 4; 
                    bulletRadius = 7; 
                    
                    const numHomingBullets = 8; 
                    const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                    const homingSpread = Math.PI / 3; 
                    for (let i = 0; i < numHomingBullets; i++) {
                        const currentAngle = angleToPlayer - (homingSpread / 2) + (homingSpread / (numHomingBullets - 1)) * i;
                        const speedX = baseBulletSpeed * Math.cos(currentAngle);
                        const speedY = baseBulletSpeed * Math.sin(currentAngle);
                        enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, bulletRadius, speedY, 'purple', speedX, true, false));
                    }

                    const numCircleBullets = 70; 
                    const circleSpeed = 3; 
                    for (let i = 0; i < numCircleBullets; i++) {
                        const angle = (Math.PI * 2 / numCircleBullets) * i + frame * 0.003; 
                        const speedX = circleSpeed * Math.cos(angle);
                        const speedY = circleSpeed * Math.sin(angle);
                        enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, 6, speedY, 'red', speedX, true, false));
                    }

                    const spiralBulletsPerShot = 4;
                    const spiralBaseSpeed = 3; 
                    const spiralDensity = 0.08; 
                    for (let i = 0; i < spiralBulletsPerShot; i++) {
                        const currentAngle = (frame * spiralDensity + i * (Math.PI * 2 / spiralBulletsPerShot)) % (Math.PI * 2);
                        const speedX = spiralBaseSpeed * Math.cos(currentAngle);
                        const speedY = spiralBaseSpeed * Math.sin(currentAngle);
                        enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, 5, speedY, 'cyan', speedX, true, false));
                    }

                } else {
                    baseBulletSpeed = 15; 
                    numBullets = 25;
                    bulletColor = 'magenta';
                    bulletRadius = 6;
                    spiralSpeed = 0.05;

                    bulletsPerShot = 2;
                    for (let i = 0; i < bulletsPerShot; i++) {
                        const currentAngle = (frame * spiralSpeed + i * (Math.PI * 2 / bulletsPerShot)) % (Math.PI * 2);
                        const speedX = baseBulletSpeed * Math.cos(currentAngle);
                        const speedY = baseBulletSpeed * Math.sin(currentAngle);
                        enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, bulletRadius, speedY, 'cyan', speedX, true, false));
                    }

                    const numRadialBullets = 10;
                    const radialSpeed = 9; 
                    for (let i = 0; i < numRadialBullets; i++) {
                        const angle = (Math.PI * 2 / numRadialBullets) * i + frame * 0.01;
                        const speedX = radialSpeed * Math.cos(angle);
                        const speedY = radialSpeed * Math.sin(angle);
                        enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, bulletRadius, speedY, bulletColor, speedX, true, false));
                    }
                }
                break;

            case 4: // 최종 히든 페이즈: 극도로 느리고 엄청나게 많은 탄막 + 재설계된 레이저 벽 패턴
                const finalSpeed = 6; 
                const finalRadius = 8;
                const finalColor = 'lime'; 

                const spiralCount = 3; 
                const spiralIncrement = Math.PI * 0.1; 
                const initialAngle = frame * 0.01; 

                for (let i = 0; i < spiralCount; i++) {
                    const angle = initialAngle + (i * (Math.PI * 2 / spiralCount));
                    const speedX = finalSpeed * Math.cos(angle);
                    const speedY = finalSpeed * Math.sin(angle);
                    enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, finalRadius, speedY, finalColor, speedX, true, false));
                }

                if (frame % 30 === 0) { 
                    const lineSpeed = 4; 
                    const lineDensity = 15; 
                    const startX = Math.random() * (canvas.width - 50) + 25; 
                    const targetY = canvas.height + 50; 

                    for (let i = 0; i < lineDensity; i++) {
                        const bulletX = startX + (i * (this.width / lineDensity)); 
                        enemyBullets.push(new Bullet(bulletX, this.y + this.height / 2, finalRadius - 2, lineSpeed, 'orange', 0, true, false)); 
                    }
                }

                if (frame % 60 === 0) { 
                    const aimSpeed = 5; 
                    const aimRadius = 10; 
                    const angleToPlayer = Math.atan2(player.y - (this.y + this.height / 2), player.x - (this.x + this.width / 2));
                    const speedX = aimSpeed * Math.cos(angleToPlayer);
                    const speedY = aimSpeed * Math.sin(angleToPlayer);
                    enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, aimRadius, speedY, 'darkred', speedX, true, false));
                }

                if (frame % 250 === 0) { 
                    console.log(`Frame ${frame}: 레이저 패턴 주기적 발동!`); 
                    const laserStartY = canvas.height + 20; 
                    const laserMoveSpeed = 2; 
                    const animationDur = 70; 
                    const holdDur = 100; 
                    laserWalls.push(new LaserWall(laserStartY, 'rgba(0,255,255,0.7)', animationDur, holdDur, laserMoveSpeed)); 
                    laserWalls.push(new LaserWall(laserStartY, 'rgba(0,255,255,0.7)', animationDur, holdDur, laserMoveSpeed));
                    laserWalls.push(new LaserWall(laserStartY, 'rgba(0,255,255,0.7)', animationDur, holdDur, laserMoveSpeed));
                }

                this.fireRate = 5; 
                break;

            default: 
                console.warn("알 수 없는 보스 페이즈:", bossPhase);
                const defaultNumBullets = 3;
                const defaultSpreadAngle = Math.PI / 8;
                const defaultAngleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < defaultNumBullets; i++) {
                    const currentAngle = defaultAngleToPlayer - (defaultSpreadAngle / 2) + (defaultSpreadAngle / (defaultNumBullets - 1)) * i;
                    const speedX = baseBulletSpeed * Math.cos(currentAngle);
                    const speedY = baseBulletSpeed * Math.sin(currentAngle);
                    enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, 8, speedY, 'red', speedX, true, false));
                }
                break;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        bossCurrentHealth = this.health;
        if (this.health <= 0) {
            if (bossPhase < maxBossPhases) { 
                bossPhase++;
                score += 200; 
                
                if (bossPhase === 4) {
                    this.maxHealth = Math.floor(bossMaxHealth * 1.5); 
                    this.fireRate = 5; 
                    console.log(`최종 히든 보스 페이즈 시작! 체력 ${this.maxHealth}으로 증가!`);

                    const laserStartY = canvas.height + 20; 
                    const laserMoveSpeed = 2; 
                    const animationDur = 70; 
                    const holdDur = 100; 
                    laserWalls.push(new LaserWall(laserStartY, 'rgba(0,255,255,0.7)', animationDur, holdDur, laserMoveSpeed)); 
                    laserWalls.push(new LaserWall(laserStartY, 'rgba(0,255,255,0.7)', animationDur, holdDur, laserMoveSpeed));
                    laserWalls.push(new LaserWall(laserStartY, 'rgba(0,255,255,0.7)', animationDur, holdDur, laserMoveSpeed));
                    console.log("4페이즈 시작, 레이저 패턴 즉시 발동!"); 

                } else {
                    this.maxHealth += 500; 
                }
                
                this.health = this.maxHealth; 
                bossCurrentHealth = this.health;
                enemyBullets.length = 0; 
                laserWalls.length = 0; 
                console.log(`보스 페이즈 ${bossPhase} 시작!`);
            } else {
                this.active = false;
                score += 500;
                updateUI();
                showGameOverScreen(true); 
                finalScoreDisplay.textContent = score + " (보스 파괴!)";
            }
        }
    }
}

// ====================================================================
// 4. 게임 오브젝트 배열
// ====================================================================
const player = new Player();
const playerBullets = [];
let boss = null;
const enemyBullets = [];
const laserWalls = []; 

// ====================================================================
// 5. 게임 초기화 및 UI 업데이트
// ====================================================================
function initGame() {
    score = 0;
    playerHealth = 100;
    gameOver = false;
    gameStarted = true;

    bossPhase = 1;
    bossMaxHealth = 6000; 
    bossCurrentHealth = bossMaxHealth;

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 30;
    player.hitboxX = player.x + player.width / 2;
    player.hitboxY = player.y + player.height / 2;

    playerBullets.length = 0;
    enemyBullets.length = 0;
    laserWalls.length = 0; 

    if (bossImage.complete && bossImage.naturalWidth !== 0) {
        boss = new Enemy(canvas.width / 2 - 100, 50, 200, 200, 1.5, bossMaxHealth, 15);
    } else {
        boss = new Enemy(canvas.width / 2 - 50, 50, 100, 100, 1.5, bossMaxHealth, 20);
    }

    gameOverScreen.style.display = 'none';
    startScreen.style.opacity = '0';
    startScreen.style.pointerEvents = 'none';

    gameContainer.classList.add('game-active');

    updateUI();
    startGameLoop();
}

function updateUI() {
    scoreDisplay.textContent = `점수: ${score}`;
    healthDisplay.textContent = `체력: ${playerHealth}%`;
}

function showGameOverScreen(isClear = false) { 
    gameOver = true;
    gameStarted = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    if (isClear) {
        gameOverMessage.textContent = "GAME CLEAR!";
        gameOverMessage.style.color = "gold";
    } else {
        gameOverMessage.textContent = "GAME OVER!";
        gameOverMessage.style.color = "red";
    }

    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';

    gameContainer.classList.remove('game-active');
}

// ====================================================================
// 6. 충돌 감지 함수
// ====================================================================
function circleCircleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

function circleRectCollision(circle, rect) {
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;
    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;

    let distX = circle.x - testX;
    let distY = circle.y - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= circle.radius;
}


// ====================================================================
// 7. 게임 루프 (핵심!)
// ====================================================================
let frame = 0;
function gameLoop() {
    if (!gameStarted || gameOver) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    if (frame - lastPlayerFireFrame > playerFireRate) {
        player.shoot();
        lastPlayerFireFrame = frame;
    }

    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.update();
        bullet.draw();

        if (!bullet.active) {
            playerBullets.splice(i, 1);
            continue;
        }

        // 플레이어 총알이 보스에게 닿았을 때
        if (boss && boss.active && circleRectCollision(bullet, boss)) {
            let damage = 40;
            if (bullet.isHoming) { // 유도탄은 데미지 약간 증가
                damage = 60; 
            }
            boss.takeDamage(damage); 
            bullet.active = false;
        }
    }

    if (boss && boss.active) {
        boss.update(frame);
        boss.draw();
    } else if (boss && !boss.active) {
        boss = null;
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.update();
        bullet.draw();

        if (!bullet.active) {
            enemyBullets.splice(i, 1);
            continue;
        }

        if (playerHealth <= 0) {
            continue;
        }

        const playerHitbox = {
            x: player.hitboxX,
            y: player.hitboxY,
            radius: player.hitboxRadius
        };

        if (circleCircleCollision(bullet, playerHitbox)) {
            playerHealth -= 10;
            bullet.active = false;
            updateUI();
            if (playerHealth <= 0) {
                showGameOverScreen(false);
            }
        }
    }

    // **LaserWall 업데이트 및 그리기, 충돌 처리**
    for (let i = laserWalls.length - 1; i >= 0; i--) {
        const wall = laserWalls[i];
        wall.update();
        wall.draw();

        if (!wall.active) {
            laserWalls.splice(i, 1);
            continue;
        }

        const playerHitbox = {
            x: player.hitboxX,
            y: player.hitboxY,
            radius: player.hitboxRadius
        };

        if (playerHealth > 0 && wall.isCollidingWithPlayer(playerHitbox)) {
            playerHealth -= 5; 
            updateUI();
            if (playerHealth <= 0) {
                showGameOverScreen(false);
            }
        }
    }

    frame++;
    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    frame = 0;
    lastPlayerFireFrame = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ====================================================================
// 8. 이벤트 리스너
// ====================================================================

startButton.addEventListener('click', () => {
    initGame();
});

document.addEventListener('keydown', (e) => {
    if (!gameStarted || gameOver) return;
    switch (e.key) {
        case 'ArrowLeft':
            player.isMovingLeft = true;
            break;
        case 'ArrowRight':
            player.isMovingRight = true;
            break;
        case 'ArrowUp':
            player.isMovingUp = true;
            break;
        case 'ArrowDown':
            player.isMovingDown = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (!gameStarted || gameOver) return;
    switch (e.key) {
        case 'ArrowLeft':
            player.isMovingLeft = false;
            break;
        case 'ArrowRight':
            player.isMovingRight = false;
            break;
        case 'ArrowUp':
            player.isMovingUp = false;
            break;
        case 'ArrowDown':
            player.isMovingDown = false;
            break;
    }
});

restartButton.addEventListener('click', () => {
    initGame();
});

backToMainButton.addEventListener('click', () => {
    window.location.href = '../index.html';
});