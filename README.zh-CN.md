# PokGuy

[English](README.md) · [简体中文](README.zh-CN.md)

**练一手牌，复盘一次决策，逐步建立扑克直觉。**

PokGuy 是一款优先在本地使用的单机德州扑克训练工具。你可以与可配置的 AI 对手进行 2–9 人现金桌练习，自定义单手场景，并通过牌局历史和统计复盘决策。无需账号，不涉及真钱。

**用户入口：**[用户 README](docs/user/README.zh-CN.md)。

**Agent 入口：**先读 [AGENTS.md](AGENTS.md)，再读 [Agent README](docs/agent/README.zh-CN.md)。

## 本地启动

需要 **Node.js 22.13+（推荐 22.x）** 和 npm。

```bash
git clone https://github.com/ThineLord/PokGuy.git
cd PokGuy
npm ci
npm run dev
```

打开终端显示的本地地址，通常为 **http://localhost:3000**。使用期间保持服务运行。

## 练习与复盘

- **打牌：**2–9 人桌、八种可编辑 AI 个性、合法动作提示、边池和摊牌解释。
- **训练：**选择底牌、位置、有效筹码与起始街，按需开关提示。
- **复盘：**回放最近牌局、添加笔记、查看决策反馈和统计。
- **个性化：**中英文界面、浅色／深色／跟随系统外观、牌背与动画控制。

牌局记录保存在当前浏览器中。清除站点数据或更换设备前，请在设置中导出 JSON 备份。AI 反馈属于训练级启发式，不是 GTO 求解器。详细操作与限制见[用户说明](docs/user/README.zh-CN.md)。

## 文件位置

```text
app/              页面入口与样式
src/              扑克引擎、AI、界面与浏览器存储
public/           应用资源
tests/            单元与浏览器测试
docs/             用户、Agent、架构与发布文档
scripts/          仓库与版本校验
build/ + worker/  构建集成与 Worker 入口
```

## 版本与文档

当前版本：**0.3.0**。发布使用 `v主版本.次版本.修订号` 标签，并记录在 [GitHub Releases](https://github.com/ThineLord/PokGuy/releases)。应用版本与浏览器数据格式版本独立管理。

- [0.3.0 更新说明](docs/releases/0.3.0.zh-CN.md) · [更新日志](CHANGELOG.md)
- [文档索引](docs/README.md) · [开发与测试](docs/development/README.md)
- [版本发布流程](docs/releases/README.md)

PokGuy 仅用于规则学习与个人练习，不提供充值、提款或真人匹配。发布源码版本不等于已验证线上部署。
