// src/utils/backup.js
import { supabase } from "../supabaseClient.js";



// 🔹 Supabaseにバックアップ保存
export async function saveAutoBackup() {
  try {
    const custom = JSON.parse(localStorage.getItem("customQuestions") || "[]");
    const results = JSON.parse(localStorage.getItem("quizResults") || "[]");
    const bookmarks1 = JSON.parse(localStorage.getItem("bookmarks1") || "[]");
    const bookmarks2 = JSON.parse(localStorage.getItem("bookmarks2") || "[]");

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
  try {
    const { data, error } = await supabase
      .from("backups")
      .select("*")
      .eq("id", "local_backup")
      .single();

    if (error) throw error;
    if (!data?.data) throw new Error("バックアップデータが見つかりません");

    const { custom, results, bookmarks1, bookmarks2 } = data.data;

    localStorage.setItem("customQuestions", JSON.stringify(custom || []));
    localStorage.setItem("quizResults", JSON.stringify(results || []));
    localStorage.setItem("bookmarks1", JSON.stringify(bookmarks1 || []));
    localStorage.setItem("bookmarks2", JSON.stringify(bookmarks2 || []));

    console.log("📤 Supabase からローカルに復元しました");
  } catch (err) {
    console.error("❌ 復元失敗:", err);
  }
}