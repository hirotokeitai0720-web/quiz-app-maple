"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const runtime = "edge";

import { useState } from "react";

export default function SettingsPage() {
  const [status, setStatus] = useState("");

  const backupData = () => {
    const data = {
      customQuestions: JSON.parse(localStorage.getItem("customQuestions") || "[]"),
      quizResults: JSON.parse(localStorage.getItem("quizResults") || "[]"),
      bookmarks1: JSON.parse(localStorage.getItem("bookmarks1") || "[]"),
      bookmarks2: JSON.parse(localStorage.getItem("bookmarks2") || "[]"),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_backup_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("✅ バックアップをダウンロードしました。");
  };

  const restoreData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (confirm("既存データを上書きして復元しますか？")) {
          Object.entries(data).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
          });
          setStatus("✅ データを復元しました。");
        }
      } catch {
        setStatus("❌ 無効なファイル形式です。");
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">⚙️ バックアップと復元</h1>

        <button
          onClick={backupData}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-3 hover:opacity-90"
        >
          💾 バックアップを保存
        </button>

        <label className="bg-green-500 text-white px-4 py-2 rounded w-full hover:opacity-90 cursor-pointer">
          📂 バックアップを復元
          <input
            type="file"
            accept=".json"
            onChange={restoreData}
            className="hidden"
          />
        </label>

        {status && <p className="text-sm mt-4 text-gray-600">{status}</p>}
      </div>
    </main>
  );
}
