import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const required = ['game','play','start','hud','hp','hpbar','armor','armorbar','ammo','reserve','alive','zone','status','toast','mapCanvas'];
const missing = required.filter(id => !$(id));
if (missing.length) throw new Error('HTML 缺少元素：' + missing.join(', '));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb9c8);
scene.fog = new THREE.Fog(0x8fb9c8, 70, 230);

const camera = new THREE.PerspectiveCamera(76, innerWidth / innerHeight, 0.1, 320);
camera.rotation.order = 'YXZ';

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  $('loadError').hidden = false;
  $('loadError').textContent = '浏览器无法创建 WebGL 画布。请更新 Chrome/Edge，并检查浏览器是否启用硬件加速。';
  throw err;
}
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe2f5ff, 0x536046, 1.65));
const sun = new THREE.DirectionalLight(0xffedcf, 2.0);
sun.position.set(-45, 75, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const mat = (color, roughness = 0.9, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), mat(0x55764d));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const obstacles = [];
function addBox(x, z, w, h, d, color, collision = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (collision) obstacles.push({ x, z, hw: w / 2, hd: d / 2 });
  return mesh;
}
function addTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14 * scale, .25 * scale, 2.2 * scale, 8), mat(0x59432e));
  trunk.position.set(x, 1.1 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(1.45 * scale, 3.3 * scale, 8), mat(0x2f6141));
  crown.position.set(x, 2.9 * scale, z);
  crown.castShadow = true;
  scene.add(crown);
  obstacles.push({ x, z, hw: .38 * scale, hd: .38 * scale });
}
function addHouse(x, z, w, d, h) {
  addBox(x, z, w, h, d, 0x858d8d);
  addBox(x, z, w + .35, .24, d + .35, 0x354b58, false).position.y = h + .12;
  for (const side of [-1, 1]) {
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.05, .9, .06), mat(0x23495a, .25, .25));
    windowMesh.position.set(x + side * w * .25, 2.2, z - d / 2 - .04);
    scene.add(windowMesh);
  }
}
addHouse(-17, -16, 12, 9, 5);
addHouse(18, -19, 11, 10, 5);
addHouse(22, 16, 12, 9, 4.5);
addHouse(-22, 20, 9, 12, 4.5);
for (let i = 0; i < 65; i++) {
  const angle = i * 2.399;
  const radius = 29 + (i % 8) * 6;
  addTree(Math.cos(angle) * radius + (Math.random() - .5) * 5,
          Math.sin(angle) * radius + (Math.random() - .5) * 5,
          .72 + Math.random() * .42);
}

const player = {
  position: new THREE.Vector3(0, 1.7, 10),
  yaw: 0, pitch: 0, hp: 100, armor: 50, ammo: 30, reserve: 120,
  velocityY: 0, onGround: true, crouched: false, aiming: false
};
camera.position.copy(player.position);

const weapon = new THREE.Group();
camera.add(weapon);
weapon.position.set(.32, -.3, -.58);
function weaponPart(geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  weapon.add(mesh);
}
weaponPart(new THREE.BoxGeometry(.16, .17, .68), mat(0x283d49, .35, .6), 0, 0, 0);
weaponPart(new THREE.BoxGeometry(.12, .22, .2), mat(0x111c24), 0, -.17, .12);
const barrel = weaponPart(new THREE.CylinderGeometry(.035, .035, .55, 10), mat(0x111c24), 0, .01, -.48);
barrel.rotation.x = Math.PI / 2;
weaponPart(new THREE.BoxGeometry(.08, .035, .18), mat(0x55dfff, .2, .5), 0, .1, -.08);

const bots = [];
const botColors = [0xc16b50, 0xb58c4b, 0x628bb6, 0x9874b6, 0x4c9b7d, 0xb45d83];
for (let i = 0; i < 6; i++) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.38, .75, 5, 9), mat(botColors[i]));
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 12, 10), mat(0xc99b7b));
  head.position.y = 1.8;
  group.add(head);
  const angle = i * Math.PI / 3;
  const radius = 25 + Math.random() * 24;
  group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  scene.add(group);
  bots.push({ group, hp: 4, alive: true, attackCooldown: 0 });
}

const shots = [];
const shotGeometry = new THREE.SphereGeometry(.085, 8, 8);
const shotMaterial = new THREE.MeshBasicMaterial({ color: 0x65eaff });
let active = false, finished = false, firing = false, reloading = false;
let lastShot = 0, elapsed = 0, zoneRadius = 100;
const keys = Object.create(null);
const clock = new THREE.Clock();

function notify(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { toast.style.opacity = '0'; }, 1400);
}
function updateHUD() {
  $('hp').textContent = Math.max(0, Math.ceil(player.hp));
  $('hpbar').style.width = Math.max(0, player.hp) + '%';
  $('armor').textContent = Math.ceil(player.armor);
  $('armorbar').style.width = Math.max(0, player.armor) * 2 + '%';
  $('ammo').textContent = player.ammo;
  $('reserve').textContent = player.reserve;
  $('alive').textContent = 1 + bots.filter(bot => bot.alive).length;
}
function endGame(won) {
  if (finished) return;
  finished = true;
  active = false;
  firing = false;
  if (document.pointerLockElement) document.exitPointerLock();
  $('hud').style.display = 'none';
  $('start').style.display = 'grid';
  $('start').querySelector('h1').innerHTML = won ? 'MISSION<br><em>COMPLETE</em>' : 'MISSION<br><em>FAILED</em>';
  $('intro').textContent = won ? '训练区域已清理，挑战完成。' : '本次训练结束，可以重新开始。';
  $('play').textContent = '重新开始';
}
function damagePlayer(amount) {
  const absorbed = Math.min(player.armor, amount * .65);
  player.armor -= absorbed;
  player.hp -= amount - absorbed;
  updateHUD();
  if (player.hp <= 0) endGame(false);
}
function fireShot() {
  if (!active || reloading) return;
  if (player.ammo <= 0) {
    notify('弹药不足，按 R 换弹');
    return;
  }
  player.ammo--;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const mesh = new THREE.Mesh(shotGeometry, shotMaterial);
  mesh.position.copy(camera.position).addScaledVector(direction, .8);
  scene.add(mesh);
  shots.push({ mesh, direction, life: 1.35 });
  player.pitch = Math.min(1.2, player.pitch + .006);
  updateHUD();
}
function reloadWeapon() {
  if (reloading || player.ammo === 30 || player.reserve <= 0) return;
  reloading = true;
  $('status').textContent = 'RELOADING';
  setTimeout(() => {
    if (!reloading) return;
    const amount = Math.min(30 - player.ammo, player.reserve);
    player.ammo += amount;
    player.reserve -= amount;
    reloading = false;
    $('status').textContent = 'READY';
    updateHUD();
    notify('换弹完成');
  }, 1100);
}
function isBlocked(x, z) {
  return obstacles.some(o => Math.abs(x - o.x) < o.hw + .42 && Math.abs(z - o.z) < o.hd + .42);
}
function updatePlayer(dt) {
  const forward = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const side = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const speed = player.crouched ? 3 : (keys.ShiftLeft || keys.ShiftRight ? 9 : 5.8);
  const movement = new THREE.Vector3(
    -Math.sin(player.yaw) * forward + Math.cos(player.yaw) * side,
    0,
    -Math.cos(player.yaw) * forward - Math.sin(player.yaw) * side
  );
  if (movement.lengthSq() > 1) movement.normalize();
  const nextX = player.position.x + movement.x * speed * dt;
  const nextZ = player.position.z + movement.z * speed * dt;
  if (!isBlocked(nextX, player.position.z)) player.position.x = nextX;
  if (!isBlocked(player.position.x, nextZ)) player.position.z = nextZ;

  player.velocityY -= 19 * dt;
  player.position.y += player.velocityY * dt;
  const floor = player.crouched ? 1.15 : 1.7;
  if (player.position.y < floor) {
    player.position.y = floor;
    player.velocityY = 0;
    player.onGround = true;
  }
  camera.position.copy(player.position);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  camera.fov = THREE.MathUtils.lerp(camera.fov, player.aiming ? 49 : 76, dt * 10);
  camera.updateProjectionMatrix();
  weapon.visible = !player.aiming;
}
function updateBots(dt) {
  for (const bot of bots) {
    if (!bot.alive) continue;
    const p = bot.group.position;
    const dx = player.position.x - p.x;
    const dz = player.position.z - p.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 42 && distance > 7) {
      p.x += dx / distance * 2.1 * dt;
      p.z += dz / distance * 2.1 * dt;
    }
    bot.group.rotation.y = Math.atan2(dx, dz);
    bot.attackCooldown -= dt;
    if (distance < 15 && bot.attackCooldown <= 0) {
      damagePlayer(4);
      bot.attackCooldown = 1.2;
    }
  }
}
function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const shot = shots[i];
    shot.mesh.position.addScaledVector(shot.direction, 65 * dt);
    shot.life -= dt;
    let hit = false;
    for (const bot of bots) {
      if (!bot.alive) continue;
      const target = bot.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      if (shot.mesh.position.distanceTo(target) < .82) {
        bot.hp--;
        hit = true;
        if (bot.hp <= 0) {
          bot.alive = false;
          scene.remove(bot.group);
          notify('训练目标已淘汰');
          updateHUD();
        }
        break;
      }
    }
    if (hit || shot.life <= 0) {
      scene.remove(shot.mesh);
      shots.splice(i, 1);
    }
  }
}
const zoneRing = new THREE.Mesh(
  new THREE.RingGeometry(.99, 1, 100),
  new THREE.MeshBasicMaterial({ color: 0x48eaff, side: THREE.DoubleSide, transparent: true, opacity: .8 })
);
zoneRing.rotation.x = -Math.PI / 2;
zoneRing.position.y = .035;
scene.add(zoneRing);
function updateZone(dt) {
  elapsed += dt;
  zoneRadius = 100 - 76 * Math.min(1, elapsed / 180);
  zoneRing.scale.set(zoneRadius, zoneRadius, 1);
  $('zone').textContent = Math.max(0, Math.ceil(180 - elapsed));
  if (Math.hypot(player.position.x, player.position.z) > zoneRadius) damagePlayer(dt * 3.5);
  for (const bot of bots) {
    if (bot.alive && Math.hypot(bot.group.position.x, bot.group.position.z) > zoneRadius + 3) {
      bot.hp -= dt * .45;
      if (bot.hp <= 0) {
        bot.alive = false;
        scene.remove(bot.group);
        updateHUD();
      }
    }
  }
  if (bots.every(bot => !bot.alive)) endGame(true);
}
function drawMap() {
  const canvas = $('mapCanvas');
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#122b2b';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#54e7ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, zoneRadius / 130 * size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size / 2 + player.position.x / 130 * size, size / 2 + player.position.z / 130 * size, 3.5, 0, Math.PI * 2);
  ctx.fill();
  for (const bot of bots) {
    if (!bot.alive) continue;
    ctx.fillStyle = '#ff795f';
    ctx.beginPath();
    ctx.arc(size / 2 + bot.group.position.x / 130 * size, size / 2 + bot.group.position.z / 130 * size, 2.7, 0, Math.PI * 2);
    ctx.fill();
  }
}
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  if (active && !finished) {
    updatePlayer(dt);
    updateBots(dt);
    updateShots(dt);
    updateZone(dt);
    if (firing && performance.now() - lastShot > 130) {
      fireShot();
      lastShot = performance.now();
    }
    drawMap();
  }
  renderer.render(scene, camera);
}
animate();

$('play').addEventListener('click', () => {
  if (finished) {
    location.reload();
    return;
  }
  $('start').style.display = 'none';
  $('hud').style.display = 'block';
  active = true;
  clock.getDelta();
  renderer.domElement.requestPointerLock?.();
  notify('训练开始！使用 WASD 移动');
});

document.addEventListener('mousemove', event => {
  if (!active || document.pointerLockElement !== renderer.domElement) return;
  const sensitivity = player.aiming ? .0012 : .002;
  player.yaw -= event.movementX * sensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch - event.movementY * sensitivity, -1.3, 1.3);
});
document.addEventListener('pointerlockchange', () => {
  if (active && document.pointerLockElement !== renderer.domElement) notify('点击游戏画面可重新锁定鼠标');
});
document.addEventListener('keydown', event => {
  keys[event.code] = true;
  if (event.code === 'KeyR') reloadWeapon();
  if (event.code === 'KeyC' && !event.repeat) player.crouched = !player.crouched;
  if (event.code === 'Space' && player.onGround) {
    player.velocityY = 7;
    player.onGround = false;
  }
  if (event.code === 'KeyE') notify('物资交互功能将在后续版本加入');
});
document.addEventListener('keyup', event => { keys[event.code] = false; });
renderer.domElement.addEventListener('mousedown', event => {
  if (!active) return;
  if (event.button === 0) {
    firing = true;
    fireShot();
    lastShot = performance.now();
  }
  if (event.button === 2) player.aiming = true;
});
document.addEventListener('mouseup', event => {
  if (event.button === 0) firing = false;
  if (event.button === 2) player.aiming = false;
});
document.addEventListener('contextmenu', event => event.preventDefault());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
});

updateHUD();
