# Testing

## 命令

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript strict check
npm run test          # Vitest 单元与组件测试
npm run test:watch    # Vitest 监听模式
npm run test:coverage # V8 覆盖率
npm run build         # production build
npm run check         # lint → typecheck → test → build
npm run test:e2e      # Playwright Chromium
```

Playwright 首次运行前：

```bash
npx playwright install chromium
```

## 单元测试重点

- 52 张牌唯一性、Fisher-Yates 和相同 seed；
- 九类牌型、kicker、A2345、最佳五张和公共牌成牌；
- 两/三人平分、奇数筹码、弃牌资格、单/多边池；
- 非法 check/call、最小加注、短码 all-in 和累计重新开放；
- 多人与 heads-up 盲注、翻前/翻后顺序、大盲 option 和按钮轮转；
- all-in 自动 runout、弃牌结算、摊牌和重复结算保护；
- 小数筹码 all-in 后的浮点余量归零，0 BB 玩家不会重新进入行动队列；
- AI 人格差异、seed 复现、隐藏牌隔离、已知牌排除和适应上限；
- LocalStorage v1→v2、损坏 JSON 回退和 adapter round-trip。
- 牌背设置的旧数据补全、未知主题回退和 adapter round-trip；
- 120 组不同 seed 的六人桌连续状态迁移，逐动作验证 52 张牌唯一性、筹码守恒和无死锁；
- 多人公共牌平局按实际人数分摊 equity，AI 人格在固定观察下保持可观察差异。

## E2E 流程

`tests/e2e/core-flow.spec.ts` 覆盖：

1. 启动游戏、fold 完成一手、打开历史与复盘；
2. 使用 call 和 raise/bet 尺度控件；
3. 连续完成 6 手并覆盖 fold/call/raise，验证位置轮转、无死锁和弃牌 AI 不亮牌；
4. 创建带 `10` 的指定河牌场景，验证完整位置列表、下注输入同步并进入摊牌；
5. 修改玩家名称与牌背主题、刷新验证持久化、导出牌局记录。

`tests/e2e/responsive.spec.ts` 覆盖：

1. iPhone 393×852 无横向溢出、操作区自动进入视口、动作按钮高度不低于 44px；
2. iPad 横屏 1194×834 信息区与操作区不重叠，关键动作完整进入首屏；
3. Mac 桌面快捷键可行动，同时不会劫持下注输入框中的按键。

引擎单元测试负责穷举式规则边界；E2E 关注浏览器编排，不重复构造所有规则组合。

## 手动检查清单

- 1440×900 Mac：六个座位不重叠，信息区与操作栏均完整；
- 1194×834 iPad 横屏：操作栏完整进入首屏且不覆盖信息；
- 834×1194 iPad 竖屏：完整牌桌与操作区无需横向滚动；
- 390/393×844/852 iPhone：关键动作按钮位于移动操作区最前，轮到用户时自动显示下半牌桌与操作区；
- macOS Safari 真实窗口：启用动画时牌面可见，数字框中的快捷键不破坏下注额；
- macOS Safari 真实实玩：加注、跟注、66% pot 下注、键盘 check、fold、showdown、复盘和单手牌场景；
- macOS Safari 3D 视觉实玩：洗牌层自动卸载、三套牌背切换、翻牌/河牌牌面、筹码投入和摊牌结算；
- 键盘 Tab：主导航、输入和所有动作按钮有可见 focus；
- reduced-motion / 动画关闭：发牌动画关闭；
- 设置、单手牌、历史、复盘、统计空状态；
- 浏览器控制台无产品错误；
- 刷新后设置和历史仍存在；
- 非法 raise 显示原因与最近合法值；
- 摊牌前 AI 底牌保持隐藏。

## 已知环境提示

vinext/Node 可能打印 `module.register()` deprecation、代理环境和 jsdom LocalStorage experimental warning。这些是当前工具链提示，不代表测试失败。验收以命令退出码和断言结果为准。

当前自动化使用 Playwright Chromium 的设备尺寸回归；本机尚未安装 Playwright WebKit 浏览器二进制。macOS Safari 已通过直接页面操控完成现金桌、牌背切换、河牌场景和摊牌视觉复核，iPhone/iPad 精确尺寸也通过真实浏览器渲染检查；Safari/WebKit 自动化矩阵仍属于后续验证项。
