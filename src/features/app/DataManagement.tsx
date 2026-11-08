"use client";
import { useRef, useState } from "react";
import {
  createBackup,
  downloadJson,
  MAX_BACKUP_BYTES,
  parseBackup,
  prepareRestore,
  type Backup,
  type Preferences,
} from "../../storage/backup";
import type { PersistedData } from "../../storage/types";
import { useI18n } from "./i18n";
import { useTheme } from "./theme";

export function useBackupExport(data: PersistedData) {
  const { locale } = useI18n();
  const { mode } = useTheme();
  return () =>
    downloadJson(
      `pokguy-backup-${new Date().toISOString().slice(0, 10)}.json`,
      createBackup(data, { locale, theme: mode }),
    );
}
export function DataManagement({
  data,
  onRestore,
}: {
  data: PersistedData;
  onRestore: (backup: Backup, restart: boolean) => boolean;
}) {
  const { t, locale } = useI18n();
  const { mode } = useTheme();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ReturnType<typeof parseBackup> | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const exportBackup = useBackupExport(data);
  const preferences: Preferences = { locale, theme: mode };
  return (
    <div className="stack">
      <p>
        {t(
          "完整备份包含设置、已完成牌局、统计、笔记、训练点评、AI 习惯和界面偏好；不包含正在进行的牌局。",
        )}
      </p>
      <div className="button-grid">
        <button onClick={exportBackup}>{t("导出完整备份")}</button>
        <button
          onClick={() => downloadJson("riverlab-hands.json", data.recentHands)}
        >
          {t("导出牌局记录")}
        </button>
        <button onClick={() => input.current?.click()}>
          {t("导入备份或旧设置")}
        </button>
        <input
          ref={input}
          aria-label={t("选择备份文件")}
          hidden
          type="file"
          accept="application/json,.json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            setPreview(null);
            setMessage("");
            if (!file) return;
            try {
              if (file.size > MAX_BACKUP_BYTES) throw new Error("size");
              setPreview(parseBackup(await file.text(), data, preferences));
            } catch {
              setMessage("文件无效、不兼容或超过 10 MB。未修改现有数据。");
            }
          }}
        />
      </div>
      {preview && (
        <section className="panel" aria-label={t("恢复预览")}>
          <h3>{t("恢复预览")}</h3>
          <p>
            {t(
              preview.legacy
                ? "旧设置文件：仅替换设置和 AI 配置，保留其他数据。"
                : "恢复会替换当前设备的数据，并开始新牌局。建议先导出当前备份。",
            )}
          </p>
          <p>
            {preview.backup.data.settings.playerName} · {t("牌局")}:{" "}
            {preview.backup.data.recentHands.length} · {t("笔记")}:{" "}
            {Object.keys(preview.backup.data.playerNotes).length} ·{" "}
            {t("训练点评")}: {preview.backup.data.trainingRecords.length}
          </p>
          <div className="button-grid">
            <button
              onClick={() => {
                if (
                  onRestore(
                    prepareRestore(preview, data, preferences),
                    !preview.legacy,
                  )
                ) {
                  setPreview(null);
                  setMessage("备份已恢复并保存。");
                } else
                  setMessage(
                    "恢复未完成。请导出当前备份，释放存储空间后重试。",
                  );
              }}
            >
              {t("确认恢复")}
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setMessage("");
              }}
            >
              {t("取消")}
            </button>
          </div>
        </section>
      )}
      {message && <p role="status">{t(message)}</p>}
    </div>
  );
}
