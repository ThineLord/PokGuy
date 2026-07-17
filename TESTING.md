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
- AI 人格差异、seed 复现、隐藏牌隔离、已知牌排除和适应上限；
- LocalStorage v1→v2、损坏 JSON 回退和 adapter round-trip。

## E2E 流程

`tests/e2e/core-flow.spec.ts` 覆盖：

1. 启动游戏、fold 完成一手、打开历史与复盘；
2. 使用 call 和 raise/bet 尺度控件；
3. 创建指定河牌场景并进入摊牌；
4. 修改设置、刷新验证持久化、导出牌局记录。

引擎单元测试负责穷举式规则边界；E2E 关注浏览器编排，不重复构造所有规则组合。

## 手动检查清单

- 1440px 桌面：六个座位不重叠，操作栏完整；
- 平板横屏：座位与操作栏仍可读；
- 390×844 移动端：牌桌可读，操作区可滚动到达且不被遮挡；
- 键盘 Tab：主导航、输入和所有动作按钮有可见 focus；
- reduced-motion / 动画关闭：发牌动画关闭；
- 设置、单手牌、历史、复盘、统计空状态；
- 浏览器控制台无产品错误；
- 刷新后设置和历史仍存在；
- 非法 raise 显示原因与最近合法值；
- 摊牌前 AI 底牌保持隐藏。

## 已知环境提示

vinext/Node 可能打印 `module.register()` deprecation、代理环境和 jsdom LocalStorage experimental warning。这些是当前工具链提示，不代表测试失败。验收以命令退出码和断言结果为准。
