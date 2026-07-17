export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <section className="max-w-xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-emerald-400 uppercase">
            RiverLab Poker Trainer
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            训练桌正在就位
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400">
            本地规则引擎、AI 对手、牌局复盘与统计模块正在分阶段接入。
          </p>
        </section>
      </div>
    </main>
  );
}
