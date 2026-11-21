# BattleRoyale 3D Pro — PC Fixed Edition

这是一个可部署到 GitHub Pages 的单机 3D 训练场原型，使用 HTML、CSS、JavaScript 和 Three.js。

## 文件结构

```text
BattleRoyale3D-Pro-PC-Fixed/
├── index.html
├── css/
│   └── style.css
├── src/
│   └── main.js
└── README.md
```

## GitHub Pages 部署

1. 解压 ZIP。
2. 将 `index.html`、`css` 文件夹、`src` 文件夹和 `README.md` 上传到 GitHub 仓库根目录。
3. 打开仓库 `Settings` → `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. Branch 选 `main`，目录选 `/ (root)`，点击 `Save`。
6. 等待发布完成后打开 `https://你的用户名.github.io/仓库名/`。

## 重要

- 文件路径必须保持不变：`css/style.css` 和 `src/main.js`。
- 使用最新版 Chrome 或 Edge；需要联网加载 Three.js CDN。
- 本项目需要支持 WebGL 的浏览器。
- 进入游戏后点击画面可重新锁定鼠标；按 ESC 可释放鼠标。
- 这是可玩的单机原型，不是 PUBG 的官方复刻，也不包含 PUBG 的专有素材。

## 操作

- WASD：移动
- Shift：奔跑
- Space：跳跃
- C：蹲下/站起
- 鼠标左键：发射能量弹
- 鼠标右键：瞄准
- R：换弹
- E：互动提示
