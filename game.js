(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("highScore");
  const coinCountEl = document.getElementById("coinCount");
  const shopBtn = document.getElementById("shopBtn");
  const shopPanel = document.getElementById("shopPanel");
  const colorsSection = document.getElementById("colorsSection");
  const shapesSection = document.getElementById("shapesSection");
  const skyColorsSection = document.getElementById("skyColorsSection");
  const platformColorsSection = document.getElementById("platformColorsSection");
  const closeShopBtn = document.getElementById("closeShopBtn");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const GRAVITY = 0.6;
  const FRICTION = 0.85;

  const PLAYER_WIDTH = 40;
  const PLAYER_HEIGHT = 50;
  const JUMP_VELOCITY = -14;
  const MOVE_SPEED = 0.8;
  const MAX_MOVE_SPEED = 7;

  const PLATFORM_HEIGHT = 15;
  const PLATFORM_MIN_WIDTH = 70;
  const PLATFORM_MAX_WIDTH = 150;
  const PLATFORM_GAP_MIN = 50;
  const PLATFORM_GAP_MAX = 140;
  const PLATFORM_MIN_Y = HEIGHT * 0.3;
  const PLATFORM_MAX_Y = HEIGHT * 0.8;

  const COIN_SIZE = 15;

  let keys = {};
  let platforms = [];
  let coins = [];
  let cameraX = 0;
  let platformCount = 0;

  // Powerups state
  let powerups = {
    extraLife: 0,
    doubleJump: false,
    speedBoost: false,
    invincibility: false,
    magnet: false,
    shield: false,
    superJump: false
  };

  // Current sky and platform colors (starting defaults)
  let skyColor = "#87ceeb";
  let platformColor = "#206040";

  let player = {
    x: 100,
    y: HEIGHT - 100,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velX: 0,
    velY: 0,
    onGround: false,
    color: "#000000",
    shape: "rect",
    canDoubleJump: false,
    jumpCount: 0
  };

  let score = 0;
  let highScore = 0;
  let coinsCollected = 0;

  let jumpedPlatforms = new Set();

  const colorsForSale = [
    { name: "Black", color: "#000000", price: 0 },
    { name: "Electric Blue", color: "#00ffff", price: 10 },
    { name: "Bright Red", color: "#ff3300", price: 15 },
    { name: "Lime Green", color: "#00ff00", price: 15 },
    { name: "Violet", color: "#aa00ff", price: 20 },
    { name: "Gold", color: "#ffd700", price: 25 },
    { name: "Neon Pink", color: "#ff69b4", price: 100, powerup: "extraLife" },
    { name: "Metallic Silver", color: "#b1b1b1", price: 150, powerup: "doubleJump" },
    { name: "Glowing Green", color: "#33cc33", price: 200, powerup: "speedBoost" },
    { name: "Rainbow", color: "#ff99cc", price: 300, powerup: "invincibility" }
  ];

  const shapesForSale = [
    { name: "Rectangle", value: "rect", price: 0 },
    { name: "Circle", value: "circle", price: 15 },
    { name: "Triangle", value: "triangle", price: 20 },
    { name: "Hexagon", value: "hexagon", price: 25 },
    { name: "Star", value: "star", price: 100, powerup: "magnet" },
    { name: "Heart", value: "heart", price: 150, powerup: "shield" },
    { name: "Diamond", value: "diamond", price: 200, powerup: "superJump" }
  ];

  const skyColorsForSale = [
    { name: "Default", color: "#87ceeb", price: 20 },
    { name: "Sunset", color: "#ff9900", price: 20 },
    { name: "Night Sky", color: "#2f4f7f", price: 20 },
    { name: "Cloudy", color: "#cccccc", price: 20 }
  ];

  const platformColorsForSale = [
    { name: "Default", color: "#206040", price: 20 },
    { name: "Wooden", color: "#964b00", price: 20 },
    { name: "Metal", color: "#666666", price: 20 },
    { name: "Ice", color: "#66cccc", price: 20 }
  ];

  let purchasedColors = new Set(["Black"]);
  let purchasedShapes = new Set(["rect"]);
  let purchasedSkyColors = new Set(["Default"]);
  let purchasedPlatformColors = new Set(["Default"]);

  function loadJSONItem(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }

  function verifyColor(color, arr) {
    return arr.some(c => c.color.toLowerCase() === color.toLowerCase());
  }
  function verifyShape(shape) {
    return shapesForSale.some(s => s.value === shape);
  }
  function verifySkyColor(name) {
    return skyColorsForSale.some(c => c.name === name);
  }
  function verifyPlatformColor(name) {
    return platformColorsForSale.some(c => c.name === name);
  }

  function initLocalStorageDefaults() {
    let needSave = false;

    let pc = loadJSONItem("purchasedColors", null);
    if (!Array.isArray(pc)) { purchasedColors = new Set(["Black"]); needSave = true; }
    else purchasedColors = new Set(pc);

    let ps = loadJSONItem("purchasedShapes", null);
    if (!Array.isArray(ps)) { purchasedShapes = new Set(["rect"]); needSave = true; }
    else purchasedShapes = new Set(ps);

    let pSky = loadJSONItem("purchasedSkyColors", null);
    if (!Array.isArray(pSky)) { purchasedSkyColors = new Set(["Default"]); needSave = true; }
    else purchasedSkyColors = new Set(pSky);

    let pPlat = loadJSONItem("purchasedPlatformColors", null);
    if (!Array.isArray(pPlat)) { purchasedPlatformColors = new Set(["Default"]); needSave = true; }
    else purchasedPlatformColors = new Set(pPlat);

    let pColor = localStorage.getItem("playerColor");
    if (!pColor || !verifyColor(pColor, colorsForSale)) { player.color = "#000000"; needSave = true; }
    else player.color = pColor;

    let pShape = localStorage.getItem("playerShape");
    if (!pShape || !verifyShape(pShape)) { player.shape = "rect"; needSave = true; }
    else player.shape = pShape;

    let sColorName = localStorage.getItem("skyColorName");
    if (!sColorName || !verifySkyColor(sColorName)) { skyColor = "#87ceeb"; needSave = true; }
    else {
      skyColor = skyColorsForSale.find(c => c.name === sColorName).color;
    }

    let pColorName = localStorage.getItem("platformColorName");
    if (!pColorName || !verifyPlatformColor(pColorName)) { platformColor = "#206040"; needSave = true; }
    else {
      platformColor = platformColorsForSale.find(c => c.name === pColorName).color;
    }

    let coinsStr = localStorage.getItem("coinsCollected");
    if (!coinsStr || isNaN(parseInt(coinsStr))) { coinsCollected = 0; needSave = true; }
    else coinsCollected = parseInt(coinsStr);

    let hsStr = localStorage.getItem("highScore");
    if (!hsStr || isNaN(parseInt(hsStr))) { highScore = 0; needSave = true; }
    else highScore = parseInt(hsStr);

    // Initialize powerups stored in localStorage
    let powerupData = localStorage.getItem("playerPowerups");
    if (powerupData) {
      try {
        let obj = JSON.parse(powerupData);
        powerups = Object.assign(powerups, obj);
        if(powerups.doubleJump) player.canDoubleJump = true;
      } catch {
        // ignore error and reset powerups to defaults
      }
    }

    if (needSave) saveInventory();
  }

  function saveInventory() {
    localStorage.setItem("purchasedColors", JSON.stringify([...purchasedColors]));
    localStorage.setItem("purchasedShapes", JSON.stringify([...purchasedShapes]));
    localStorage.setItem("purchasedSkyColors", JSON.stringify([...purchasedSkyColors]));
    localStorage.setItem("purchasedPlatformColors", JSON.stringify([...purchasedPlatformColors]));
    localStorage.setItem("playerColor", player.color);
    localStorage.setItem("playerShape", player.shape);
    // Save skyColor and platformColor by name to restore
    const skyColorName = skyColorsForSale.find(c => c.color === skyColor)?.name || "Default";
    const platformColorName = platformColorsForSale.find(c => c.color === platformColor)?.name || "Default";
    localStorage.setItem("skyColorName", skyColorName);
    localStorage.setItem("platformColorName", platformColorName);
    localStorage.setItem("coinsCollected", coinsCollected);
    localStorage.setItem("highScore", highScore);
    localStorage.setItem("playerPowerups", JSON.stringify(powerups));
  }

  function updateUI() {
    scoreEl.textContent = score;
    highScoreEl.textContent = highScore;
    coinCountEl.textContent = coinsCollected;
  }

  function updateScores() {
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      saveInventory();
      highScoreEl.textContent = highScore;
    }
  }

  function initPlatforms() {
    platforms = [];
    coins = [];
    platformCount = 0;
    platforms.push({
      x: 0,
      y: HEIGHT - 40,
      width: 200,
      height: PLATFORM_HEIGHT,
      color: platformColor
    });
  }

  function generatePlatforms() {
    let rightMostX = 0;
    if (platforms.length > 0) {
      let lastPlat = platforms[platforms.length - 1];
      rightMostX = lastPlat.x + lastPlat.width;
    }
    while (rightMostX < cameraX + WIDTH * 2) {
      let width = PLATFORM_MIN_WIDTH + Math.random() * (PLATFORM_MAX_WIDTH - PLATFORM_MIN_WIDTH);
      let gap = PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      let x = rightMostX + gap;

      let lastY = platforms.length > 0 ? platforms[platforms.length - 1].y : HEIGHT - 40;
      let yVariance = (Math.random() - 0.5) * 80;
      let y = lastY + yVariance;
      y = Math.min(PLATFORM_MAX_Y, Math.max(PLATFORM_MIN_Y, y));

      let newPlatform = {
        x,
        y,
        width,
        height: PLATFORM_HEIGHT,
        color: platformColor
      };
      platforms.push(newPlatform);
      platformCount++;

      if (platformCount % (10 + Math.floor(Math.random() * 6)) === 0) {
        let coinX = x + width / 2 - COIN_SIZE / 2;
        let coinY = y - COIN_SIZE - 5;
        coins.push({
          x: coinX,
          y: coinY,
          width: COIN_SIZE,
          height: COIN_SIZE,
          collected: false
        });
      }
      rightMostX = x + width;
    }
  }

  function rectIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  function playerCoinCollision(coin) {
    return rectIntersect(
      { x: player.x, y: player.y, width: player.width, height: player.height },
      coin
    );
  }

  function drawPlayer() {
    const px = player.x - cameraX;
    const py = player.y;
    ctx.shadowColor = "#000000dd";
    ctx.shadowBlur = 15;
    ctx.fillStyle = player.color;

    switch (player.shape) {
      case "rect":
        ctx.fillRect(px, py, player.width, player.height);
        break;
      case "circle":
        ctx.beginPath();
        ctx.ellipse(px + player.width / 2, py + player.height / 2, player.width / 2, player.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(px + player.width / 2, py);
        ctx.lineTo(px, py + player.height);
        ctx.lineTo(px + player.width, py + player.height);
        ctx.closePath();
        ctx.fill();
        break;
      case "hexagon":
        const hexRadiusX = player.width / 2;
        const hexRadiusY = player.height / 2;
        const cx = px + hexRadiusX;
        const cy = py + hexRadiusY;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          let angle = (Math.PI / 3) * i - Math.PI / 2;
          let x = cx + hexRadiusX * Math.cos(angle);
          let y = cy + hexRadiusY * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case "star":
        drawStar(px + player.width/2, py + player.height/2, 5, player.width/2, player.width/4);
        break;
      case "heart":
        drawHeart(px + player.width/2, py + player.height/2, player.width*0.6, player.height*0.6);
        break;
      case "diamond":
        drawDiamond(px + player.width/2, py + player.height/2, player.width*0.7, player.height*0.7);
        break;
      default:
        ctx.fillRect(px, py, player.width, player.height);
    }
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 10;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 18;
    ctx.arc(px + player.width / 2, py + player.height / 2, player.width, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Shape drawing helpers
  function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(x, y, width, height) {
    ctx.beginPath();
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - width / 2, y, x - width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - width / 2, y + height / 2, x, y + height / 1.25, x, y + height);
    ctx.bezierCurveTo(x, y + height / 1.25, x + width / 2, y + height / 2, x + width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
  }

  function drawDiamond(cx, cy, width, height) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - height / 2);
    ctx.lineTo(cx + width / 2, cy);
    ctx.lineTo(cx, cy + height / 2);
    ctx.lineTo(cx - width / 2, cy);
    ctx.closePath();
    ctx.fill();
  }

  function drawCoin(coin) {
    if (coin.collected) return;
    const cx = coin.x - cameraX + COIN_SIZE / 2;
    const cy = coin.y + COIN_SIZE / 2;
    ctx.beginPath();
    ctx.shadowColor = "gold";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "gold";
    ctx.arc(cx, cy, COIN_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.fillStyle = "#ffd700";
    ctx.arc(cx, cy, COIN_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.ellipse(cx - 3, cy - 3, COIN_SIZE / 6, COIN_SIZE / 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function applyPowerup(name) {
    switch(name) {
      case "extraLife":
        powerups.extraLife++;
        break;
      case "doubleJump":
        powerups.doubleJump = true;
        player.canDoubleJump = true;
        break;
      case "speedBoost":
        powerups.speedBoost = true;
        break;
      case "invincibility":
        powerups.invincibility = true;
        break;
      case "magnet":
        powerups.magnet = true;
        break;
      case "shield":
        powerups.shield = true;
        break;
      case "superJump":
        powerups.superJump = true;
        break;
    }
  }

  // Storage and validation...

  function buildShop() {
    // Clear all sections first
    shapesSection.innerHTML = "<h3>Shapes</h3>";
    colorsSection.innerHTML = "<h3>Player Colors</h3>";
    skyColorsSection.innerHTML = "<h3>Sky Colors</h3>";
    platformColorsSection.innerHTML = "<h3>Platform Colors</h3>";

    // Fill shapes category...
    shapesForSale.forEach(shapeObj => {
      const div = createShopItem(shapeObj.name, shapeObj.price, purchasedShapes.has(shapeObj.value), shapeObj.value === player.shape, () => {
        if (!purchasedShapes.has(shapeObj.value)) {
          if (coinsCollected >= shapeObj.price) {
            coinsCollected -= shapeObj.price;
            purchasedShapes.add(shapeObj.value);
            player.shape = shapeObj.value;
            if(shapeObj.powerup) applyPowerup(shapeObj.powerup);
            saveInventory();
            updateUI();
            buildShop();
          }
        }
      }, createShapeSwatch(shapeObj.value));
      shapesSection.appendChild(div);
    });

    // Fill player colors category...
    colorsForSale.forEach(colorObj => {
      const div = createShopItem(colorObj.name, colorObj.price, purchasedColors.has(colorObj.name), colorObj.color.toLowerCase() === player.color.toLowerCase(), () => {
        if (!purchasedColors.has(colorObj.name)) {
          if (coinsCollected >= colorObj.price) {
            coinsCollected -= colorObj.price;
            purchasedColors.add(colorObj.name);
            player.color = colorObj.color;
            if(colorObj.powerup) applyPowerup(colorObj.powerup);
            saveInventory();
            updateUI();
            buildShop();
          }
        }
      }, createColorSwatch(colorObj.color));
      colorsSection.appendChild(div);
    });

    // Fill sky colors category...
    skyColorsForSale.forEach(colorObj => {
      const selected = skyColor.toLowerCase() === colorObj.color.toLowerCase();
      const purchased = purchasedSkyColors.has(colorObj.name);
      const div = createShopItem(colorObj.name, colorObj.price, purchased, selected, () => {
        if (!purchased) {
          if (coinsCollected >= colorObj.price) {
            coinsCollected -= colorObj.price;
            purchasedSkyColors.add(colorObj.name);
            skyColor = colorObj.color;
            saveInventory();
            updateUI();
            buildShop();
          }
        }
      }, createColorSwatch(colorObj.color));
      skyColorsSection.appendChild(div);
    });

    // Fill platform colors category...
    platformColorsForSale.forEach(colorObj => {
      const selected = platformColor.toLowerCase() === colorObj.color.toLowerCase();
      const purchased = purchasedPlatformColors.has(colorObj.name);
      const div = createShopItem(colorObj.name, colorObj.price, purchased, selected, () => {
        if (!purchased) {
          if (coinsCollected >= colorObj.price) {
            coinsCollected -= colorObj.price;
            purchasedPlatformColors.add(colorObj.name);
            platformColor = colorObj.color;
            saveInventory();
            updateUI();
            buildShop();
          }
        }
      }, createColorSwatch(colorObj.color));
      platformColorsSection.appendChild(div);
    });
  }

  function createShopItem(name, price, purchased, selected, onClick, swatch) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "shop-item";

    if(swatch) swatch.title = name;
    if(!swatch) swatch = document.createElement("div");

    const priceText = document.createElement("div");
    priceText.textContent = price === 0 ? "Free" : price + " coins";

    const btn = document.createElement("button");
    if(purchased) {
      btn.textContent = selected ? "Selected" : "Select";
      btn.disabled = selected;
    } else {
      btn.textContent = "Buy";
      btn.disabled = false;
    }

    btn.addEventListener("click", onClick);

    itemDiv.appendChild(swatch);
    itemDiv.appendChild(priceText);
    itemDiv.appendChild(btn);
    return itemDiv;
  }

  function createColorSwatch(color) {
    const div = document.createElement("div");
    div.className = "color-swatch";
    div.style.backgroundColor = color;
    return div;
  }
  function createShapeSwatch(shape) {
    const div = document.createElement("div");
    div.className = "shape-swatch";
    div.innerHTML = getShapeSVG(shape);
    return div;
  }

  function getShapeSVG(shape) {
    switch (shape) {
      case "rect":
        return '<svg viewBox="0 0 20 20"><rect width="18" height="18" x="1" y="1" rx="2" ry="2"/></svg>';
      case "circle":
        return '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>';
      case "triangle":
        return '<svg viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18"/></svg>';
      case "hexagon":
        return '<svg viewBox="0 0 20 20"><polygon points="10,2 17,7 17,13 10,18 3,13 3,7"/></svg>';
      case "star":
        return '<svg viewBox="0 0 24 24"><polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"/></svg>';
      case "heart":
        return '<svg viewBox="0 0 24 24"><path d="M12 21s-1-.495-2-1.284C7 18.31 4 15.978 4 12.5 4 9.463 6.463 7 9.5 7c1.855 0 3.543 1.044 4.5 2.657C14.957 8.044 16.645 7 18.5 7 21.537 7 24 9.463 24 12.5c0 3.478-3 5.81-6 7.216C13 20.505 12 21 12 21z"/></svg>';
      case "diamond":
        return '<svg viewBox="0 0 20 20"><polygon points="10,3 16,10 10,17 4,10"/></svg>';
      default:
        return "";
    }
  }

  rockPowerupCounters = {
    speedBoostDuration: 0,
    invincibilityDuration: 0,
  };

  // Game controls
  window.addEventListener("keydown", e => {
    if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD", "KeyW", "ArrowUp"].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;
  });
  window.addEventListener("keyup", e => {
    keys[e.code] = false;
  });

  // Shop listeners
  shopBtn.addEventListener("click", () => {
    shopPanel.style.display = "grid";
    shopPanel.setAttribute("aria-hidden", "false");
    buildShop();
  });
  closeShopBtn.addEventListener("click", () => {
    shopPanel.style.display = "none";
    shopPanel.setAttribute("aria-hidden", "true");
    canvas.focus();
  });

  function initGame() {
    initPlatforms();
    initLocalStorageDefaults();
    updateUI();
    canvas.focus();
  }

  // Game logic update function

  function update() {
    let effectiveMaxSpeed = powerups.speedBoost ? MAX_MOVE_SPEED * 1.5 : MAX_MOVE_SPEED;
    let effectiveMoveSpeed = powerups.speedBoost ? MOVE_SPEED * 1.5 : MOVE_SPEED;
    // Horizontal movement & friction
    if (keys["ArrowRight"] || keys["KeyD"]) {
      if (player.velX < effectiveMaxSpeed) {
        player.velX += effectiveMoveSpeed;
        if(player.velX > effectiveMaxSpeed) player.velX = effectiveMaxSpeed;
      }
    } else if (keys["ArrowLeft"] || keys["KeyA"]) {
      if (player.velX > -effectiveMaxSpeed) {
        player.velX -= effectiveMoveSpeed;
        if(player.velX < -effectiveMaxSpeed) player.velX = -effectiveMaxSpeed;
      }
    }
    player.velX *= FRICTION;

    const isJumpPressed = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
    if (isJumpPressed) {
      if (player.onGround) {
        player.velY = JUMP_VELOCITY * (powerups.superJump ? 1.3 : 1);
        player.onGround = false;
        player.jumpCount = 1;
      } else if (powerups.doubleJump && player.jumpCount === 1) {
        player.velY = JUMP_VELOCITY * (powerups.superJump ? 1.3 : 1);
        player.jumpCount++;
      }
    }

    player.velY += GRAVITY;

    player.x += player.velX;
    player.y += player.velY;

    player.onGround = false;
    for(const plat of platforms){
      if(player.velY >= 0){
        const playerBottom = player.y + player.height;
        if(player.x + player.width > plat.x && player.x < plat.x + plat.width && playerBottom > plat.y && playerBottom < plat.y + player.velY + 5){
          player.y = plat.y - player.height;
          player.velY = 0;
          player.onGround = true;
          player.jumpCount = 0;
          if(!jumpedPlatforms.has(plat)){
            jumpedPlatforms.add(plat);
            score++;
            updateScores();
          }
        }
      }
    }

    // Coin magnet powerup demo: automatically attract coins within radius
    if(powerups.magnet){
      const magnetRadius = 150;
      coins.forEach(coin => {
        if(!coin.collected){
          const dx = (coin.x + COIN_SIZE/2) - (player.x + player.width/2);
          const dy = (coin.y + COIN_SIZE/2) - (player.y + player.height/2);
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < magnetRadius){
            // Move coin toward player gradually
            const moveSpeed = 4;
            coin.x += (player.x + player.width/2 - (coin.x + COIN_SIZE/2)) * moveSpeed/dist;
            coin.y += (player.y + player.height/2 - (coin.y + COIN_SIZE/2)) * moveSpeed/dist;
          }
        }
      });
    }

    // Collect coins
    for(const coin of coins){
      if(!coin.collected && playerCoinCollision(coin)){
        coin.collected = true;
        coinsCollected++;
        saveInventory();
        updateUI();
      }
    }

    // Invincibility negates death, else if below screen: game over
    if(player.y > HEIGHT){
      if(powerups.invincibility){
        player.y = HEIGHT - player.height - 10;
        player.velY = 0;
      } else if(powerups.extraLife > 0){
        powerups.extraLife--;
        saveInventory();
        player.y = HEIGHT - player.height - 10;
        player.velY = 0;
      } else {
        restartGame();
        return;
      }
    }

    const centerScreenX = cameraX + WIDTH / 3;
    if(player.x > centerScreenX) cameraX = player.x - WIDTH / 3;

    generatePlatforms();

    platforms = platforms.filter(p => p.x + p.width > cameraX - 100);
    coins = coins.filter(c => c.x + c.width > cameraX - 100);
  }

  function drawSkyBg() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, skyColor);
    gradient.addColorStop(0.5, '#b0e0ff');
    gradient.addColorStop(1, '#f0f8ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawSkyBg();

    for(const plat of platforms){
      ctx.fillStyle = plat.color;
      ctx.shadowColor = '#00ffeadd';
      ctx.shadowBlur = 6;
      ctx.fillRect(plat.x - cameraX, plat.y, plat.width, plat.height);
      ctx.shadowBlur = 0;
    }

    coins.forEach(drawCoin);
    drawPlayer();
  }

  function restartGame() {
    alert(`Game Over! Your score: ${score}
Coins collected: ${coinsCollected}
Click OK to restart.`);

    player.x = 100;
    player.y = HEIGHT - 100;
    player.velX = 0;
    player.velY = 0;
    cameraX = 0;
    score = 0;
    jumpedPlatforms.clear();

    // reset powerups:
    powerups.doubleJump = false;
    powerups.speedBoost = false;
    powerups.invincibility = false;
    powerups.magnet = false;
    powerups.shield = false;
    powerups.superJump = false;

    player.canDoubleJump = false;

    initPlatforms();
    updateUI();
  }

  function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Initialize game
  function initGame(){
    initPlatforms();
    initLocalStorageDefaults();
    updateUI();
    canvas.focus();
    requestAnimationFrame(gameLoop);
  }

  // Helpers for shop items creating will be functionally same as previous with slight changes -
  // (to keep code size reasonable, omitted the helpers definitions here but implemented fully in code)

  // Fill shop columns and functionality:
  function buildShop(){
    // Clear each category
    shapesSection.innerHTML = '<h3>Shapes</h3>';
    colorsSection.innerHTML = '<h3>Player Colors</h3>';
    skyColorsSection.innerHTML = '<h3>Sky Colors</h3>';
    platformColorsSection.innerHTML = '<h3>Platform Colors</h3>';

    // Helper function to create shop items and append - implemented fully below

    function createShopItem(name, price, isPurchased, isSelected, onClick, swatch){
      const div = document.createElement('div');
      div.className = 'shop-item';

      if(swatch){
        swatch.title = name;
        div.appendChild(swatch);
      }

      const priceText = document.createElement('div');
      priceText.textContent = price === 0 ? "Free" : price + ' coins';
      div.appendChild(priceText);

      const btn = document.createElement('button');

      if(isPurchased){
        btn.textContent = isSelected ? 'Selected' : 'Select';
        btn.disabled = isSelected;
      } else {
        btn.textContent = 'Buy';
        btn.disabled = coinsCollected < price;
      }
      btn.addEventListener('click', onClick);
      div.appendChild(btn);

      return div;
    }

    function createColorSwatch(color){
      const div = document.createElement('div');
      div.className = 'color-swatch';
      div.style.backgroundColor = color;
      return div;
    }
    function createShapeSwatch(shape){
      const div = document.createElement('div');
      div.className = 'shape-swatch';
      div.innerHTML = getShapeSVG(shape);
      return div;
    }

    colorsForSale.forEach(color=>{
      const purchased = purchasedColors.has(color.name);
      const selected = color.color.toLowerCase() === player.color.toLowerCase();
      const swatch = createColorSwatch(color.color);
      colorsSection.appendChild(createShopItem(color.name,color.price,purchased,selected,()=>{
        if(purchased) {
          player.color = color.color;
          saveInventory();
          buildShop();
        } else if(coinsCollected >= color.price){
          coinsCollected -= color.price;
          purchasedColors.add(color.name);
          player.color = color.color;
          if(color.powerup) applyPowerup(color.powerup);
          saveInventory();
          updateUI();
          buildShop();
        }
      }, swatch));
    });

    shapesForSale.forEach(shape => {
      const purchased = purchasedShapes.has(shape.value);
      const selected = shape.value === player.shape;
      const swatch = createShapeSwatch(shape.value);
      shapesSection.appendChild(createShopItem(shape.name, shape.price, purchased, selected, () => {
        if(purchased){
          player.shape = shape.value;
          saveInventory();
          buildShop();
        } else if(coinsCollected >= shape.price){
          coinsCollected -= shape.price;
          purchasedShapes.add(shape.value);
          player.shape = shape.value;
          if(shape.powerup) applyPowerup(shape.powerup);
          saveInventory();
          updateUI();
          buildShop();
        }
      }, swatch));
    });

    skyColorsForSale.forEach(sky => {
      const purchased = purchasedSkyColors.has(sky.name);
      const selected = skyColor.toLowerCase() === sky.color.toLowerCase();
      const swatch = createColorSwatch(sky.color);
      skyColorsSection.appendChild(createShopItem(sky.name, sky.price, purchased, selected, () => {
        if(purchased){
          skyColor = sky.color;
          saveInventory();
          buildShop();
        } else if(coinsCollected >= sky.price){
          coinsCollected -= sky.price;
          purchasedSkyColors.add(sky.name);
          skyColor = sky.color;
          saveInventory();
          updateUI();
          buildShop();
        }
      }, swatch));
    });

    platformColorsForSale.forEach(pf => {
      const purchased = purchasedPlatformColors.has(pf.name);
      const selected = platformColor.toLowerCase() === pf.color.toLowerCase();
      const swatch = createColorSwatch(pf.color);
      platformColorsSection.appendChild(createShopItem(pf.name, pf.price, purchased, selected, () => {
        if(purchased){
          platformColor = pf.color;
          saveInventory();
          buildShop();
        } else if(coinsCollected >= pf.price){
          coinsCollected -= pf.price;
          purchasedPlatformColors.add(pf.name);
          platformColor = pf.color;
          saveInventory();
          updateUI();
          buildShop();
        }
      }, swatch));
    });
  }

  function getShapeSVG(shape) {
    switch(shape){
      case "rect": return '<svg viewBox="0 0 20 20"><rect width="18" height="18" x="1" y="1" rx="2" ry="2"/></svg>';
      case "circle": return '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>';
      case "triangle": return '<svg viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18"/></svg>';
      case "hexagon": return '<svg viewBox="0 0 20 20"><polygon points="10,2 17,7 17,13 10,18 3,13 3,7"/></svg>';
      case "star": return '<svg viewBox="0 0 24 24"><polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"/></svg>';
      case "heart": return '<svg viewBox="0 0 24 24"><path d="M12 21s-1-.495-2-1.284C7 18.31 4 15.978 4 12.5 4 9.463 6.463 7 9.5 7c1.855 0 3.543 1.044 4.5 2.657C14.957 8.044 16.645 7 18.5 7 21.537 7 24 9.463 24 12.5c0 3.478-3 5.81-6 7.216C13 20.505 12 21 12 21z"/></svg>';
      case "diamond": return '<svg viewBox="0 0 20 20"><polygon points="10,3 16,10 10,17 4,10"/></svg>';
      default: return "";
    }
  }

  // Initialize game state and start game loop
  function initGame(){
    initPlatforms();
    initLocalStorageDefaults();
    updateUI();
    canvas.focus();
    requestAnimationFrame(gameLoop);
  }

  function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Start setup
  initGame();

  window.addEventListener("keydown", e => {
    if(["ArrowLeft","ArrowRight","Space","KeyA","KeyD","KeyW","ArrowUp"].includes(e.code)){
      e.preventDefault();
    }
    keys[e.code] = true;
  });
  window.addEventListener("keyup", e=>{
    keys[e.code] = false;
  });

  shopBtn.addEventListener("click", () => {
    shopPanel.style.display = "grid";
    shopPanel.setAttribute("aria-hidden", "false");
    buildShop();
  });

  closeShopBtn.addEventListener("click", () => {
    shopPanel.style.display = "none";
    shopPanel.setAttribute("aria-hidden", "true");
    canvas.focus();
  });

  function playerOnGroundPlat(){
    return player.onGround || player.jumpCount === 0;
  }

  // Helper functions, collision, drawing coin, restarting, etc remain same as before.

  // Restart function
  function restartGame(){
    alert(`Game Over! Your score: ${score}
Coins collected: ${coinsCollected}
Click OK to restart.`);
    player.x = 100;
    player.y = HEIGHT - 100;
    player.velX = 0;
    player.velY = 0;
    cameraX = 0;
    score = 0;
    jumpedPlatforms.clear();
    // Reset powerups except extraLife count remains
    powerups.doubleJump = false;
    player.canDoubleJump = false;
    powerups.speedBoost = false;
    powerups.invincibility = false;
    powerups.magnet = false;
    powerups.shield = false;
    powerups.superJump = false;

    initPlatforms();
    updateUI();
  }

  // Update function now handles double jump etc.
  // (already integrated above)
})();