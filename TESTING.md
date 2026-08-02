# Testing

## 命令

```bash
npm run format:check  # Prettier 全仓格式检查
npm run lint          # ESLint
npm run typecheck     # TypeScript strict check
npm run test          # Vitest 单元与组件测试
npm run test:watch    # Vitest 监听模式
npm run test:coverage # V8 覆盖率
npm run build         # production build
npm run check         # format:check → lint → typecheck → test → build
npm run test:e2e      # 13 项 Playwright Chromium 回归
npm run test:e2e:webkit # 7 项精选 Playwright WebKit 回归
```

Playwright 首次运行前：

```bash
npx playwright install chromium webkit
```

## 单元测试重点

- 52 张牌唯一性、Fisher-Yates 和相同 seed；
- 九类牌型、kicker、A2345、最佳五张和公共牌成牌；
- 双三条葫芦、三组对子、公共牌 kicker、六高顺子对 wheel、同花五张逐级比较；
- 两/三人平分、奇数筹码、弃牌资格、单/多边池；
- 无人跟注的超额投入单独退回且不构成单人边池，退回筹码不计为摊牌获胜；
- 小数投入不会产生 `0 BB` 虚假边池、获奖或退回，奇数筹码明确按 `0.01BB` 单位分配；
- 非法 check/call、最小加注、短码 all-in 和累计重新开放；
- 多人与 heads-up 盲注、翻前/翻后顺序、大盲 option 和按钮轮转；
- all-in 自动 runout、仍有两名有筹码玩家时继续下注、弃牌结算、河牌摊牌和重复结算保护；
- `uncontested`、`river-showdown`、`all-in-runout` 三种正式结束原因与结算筹码守恒；
- Hero 归零需手动重新买入、归零 AI 不参加下一手、少于两名有筹码玩家时停止发牌；
- 翻牌后训练场景从已匹配投入开始，不把小盲/大盲差额错误退回；
- 小数筹码 all-in 后的浮点余量归零，0 BB 玩家不会重新进入行动队列；
- AI 人格差异、seed 复现、隐藏牌隔离、已知牌排除和适应上限；
- LocalStorage v1→v2、损坏 JSON 回退、非法数字设置/profile/AI 习惯记录恢复、合法纯自定义对手池保留和 adapter round-trip；
- 损坏训练评价记录过滤，以及旧记录在顺序或数量不明确时不猜测动作关联；
- 牌背设置的旧数据补全、未知主题回退和 adapter round-trip；
- 社交预览 origin 覆盖本机、私网 IPv4、IPv6、异常 Host/端口和受信代理协议；
- 120 组不同 seed 的六人桌连续状态迁移，逐动作验证 52 张牌唯一性、筹码守恒和无死锁；
- 多人公共牌平局按实际人数分摊 equity，AI 人格在固定观察下保持可观察差异。

## E2E 流程

`tests/e2e/core-flow.spec.ts` 覆盖：

1. 启动游戏、执行带飞行效果的 fold、加速完成旁观牌局并打开历史与复盘；
   同时验证训练反馈时间线、刷新后的待复查队列和训练统计摘要；
2. 使用 call 和 raise/bet 尺度控件；
3. 验证盲注角色、顺时针发牌顺序和所有发牌动画步骤；
4. 连续完成 6 手并覆盖 fold/call/raise，验证位置轮转、无死锁和弃牌 AI 不亮牌；
5. 创建带 `10` 的指定河牌场景，验证已匹配起始底池、两位小数下注输入、最佳五张、牌型比较、正式结束原因和逐池结算；
6. 修改玩家名称与牌背主题、刷新验证持久化、导出牌局记录；
7. 清空或输入互相冲突的盲注设置，验证不会写入非法值且刷新后牌桌仍可启动；
8. 切换完整英文界面并验证刷新后语言持久化。

`tests/e2e/responsive.spec.ts` 覆盖：

1. iPhone 393×852 无横向溢出、操作区自动进入视口、动作按钮高度不低于 44px；
2. iPad 横屏 1194×834 信息区与操作区不重叠，关键动作完整进入首屏；
3. iPhone 393×852 摊牌比较区包含两名玩家且无横向溢出；
4. Mac 桌面快捷键可行动，同时不会劫持下注输入框中的按键。

引擎单元测试负责穷举式规则边界；E2E 关注浏览器编排，不重复构造所有规则组合。

默认 `npm run test:e2e` 仍只运行完整的 13 项 Chromium 套件。`npm run test:e2e:webkit` 通过测试标题中的 `@webkit` 标签选取 7 个高价值流程：Review Lab 与刷新、设置持久化与导出、非法盲注恢复、iPhone/iPad 响应式布局、摊牌区域和键盘/输入隔离。这样可以持续覆盖 WebKit 差异，而不会把默认本地门禁翻倍。

## GitHub Actions

`.github/workflows/ci.yml` 在 `main` push 和面向 `main` 的 pull request 上运行。它使用最新 Node.js 22 LTS 补丁版本（`22.x`）、`npm ci` 和 `npm run check`，token 权限仅为读取仓库内容；不读取 secrets、不部署，也不运行需要浏览器下载的 E2E。Chromium 与 WebKit E2E 继续作为提交前的独立本地验证。

## 手动检查清单

- 1440×900 Mac：六个座位不重叠，信息区与操作栏均完整；
- 1194×834 iPad 横屏：操作栏完整进入首屏且不覆盖信息；
- 834×1194 iPad 竖屏：完整牌桌与操作区无需横向滚动；
- 390/393×844/852 iPhone：关键动作按钮位于移动操作区最前，轮到用户时自动显示下半牌桌与操作区；
- macOS Safari 真实窗口：启用动画时牌面可见，数字框中的快捷键不破坏下注额；
- macOS Safari 真实实玩：加注、跟注、66% pot 下注、键盘 check、fold、showdown、复盘和单手牌场景；
- macOS Safari 3D 视觉实玩：洗牌层自动卸载、三套牌背切换、翻牌/河牌牌面、筹码投入和摊牌结算；
- macOS Safari 正式结算实玩：最佳五张/牌型比较区可见，主池、边池和无人跟注退回分开展示；
- macOS Safari 结束边界实玩：弃牌获胜与河牌摊牌均出现正式结束确认，结算后才可开始下一手，牌局中重新买入保持禁用；
- 弃牌后动画完整播放，随后 AI 旁观阶段快速推进，下注数字框不出现浮点尾数；
- 键盘 Tab：主导航、输入和所有动作按钮有可见 focus；
- reduced-motion / 动画关闭：发牌动画关闭；
- 设置、单手牌、历史、复盘、统计空状态；
- 复盘实验室的全部/待复查筛选、评价时间线、旧记录安全降级与英文文案；
- 浏览器控制台无产品错误；
- 刷新后设置和历史仍存在；
- 非法 raise 显示原因与最近合法值；
- 摊牌前 AI 底牌保持隐藏。

## 已知环境提示

vinext/Node 可能打印 `module.register()` deprecation、代理环境和 jsdom LocalStorage experimental warning。这些是当前工具链提示，不代表测试失败。验收以命令退出码和断言结果为准。

当前自动化包含完整 Chromium 回归和精选 WebKit 回归。Playwright 的 Desktop Safari 引擎配合显式视口可以验证 WebKit 布局与交互，但不等同于物理 iPhone/iPad 上的 Safari，也不能替代真实设备安全区、触控和地址栏行为检查。macOS Safari 直接实玩与真实设备尺寸检查仍保留在手动清单中。
