// src/utils/backup.js
import { supabase } from "../supabaseClient.js";

// ✅ localStorageを安全に取得するヘルパー
function safeGet(key) {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

// ✅ localStorageに安全に書き込むヘルパー
function safeSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`⚠️ localStorage書き込み失敗: ${key}`, err);
  }
}

// 🔹 Supabaseにバックアップ保存
export async function saveAutoBackup() {
  if (typeof window === "undefined") return; // SSR防止

  try {
    const custom = safeGet("customQuestions");
    const results = safeGet("quizResults");
    const bookmarks1 = safeGet("bookmarks1");
    const bookmarks2 = safeGet("bookmarks2");

    // 🔸 Supabase に保存（upsert：あれば更新、なければ作成）
    const { error } = await supabase.from("backups").upsert({
      id: "local_backup",
      updated_at: new Date().toISOString(),
      data: { custom, results, bookmarks1, bookmarks2 },
    });

    if (error) throw error;
    console.log("✅ Supabase にバックアップしました");
  } catch (err) {
    console.error("❌ バックアップ失敗:", err);
  }
}

// 🔹 Supabaseから復元
export async function restoreBackup() {
  if (typeof window === "undefined") return; // SSR防止

  try {
    const { data, error } = await supabase
      .from("backups")
      .select("*")
      .eq("id", "local_backup")
      .single();

    if (error) throw error;
    if (!data?.data) throw new Error("バックアップデータが見つかりません");

    const { custom, results, bookmarks1, bookmarks2 } = data.data;

    safeSet("customQuestions", custom || []);
    safeSet("quizResults", results || []);
    safeSet("bookmarks1", bookmarks1 || []);
    safeSet("bookmarks2", bookmarks2 || []);

    console.log("📤 Supabase からローカルに復元しました");
  } catch (err) {
    console.error("❌ 復元失敗:", err);
  }
}
