"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveAutoBackup, restoreBackup } from "../utils/backup";

export default function Home() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("全て");
  const [mode, setMode] = useState("random");
  const [results, setResults] = useState([]);

  // 🧠 初期ロード
  useEffect(() => {
    const load = async () => {
      try {
        const base = await fetch("/questions.json").then((r) => r.json()).catch(() => []);
        const custom = JSON.parse(localStorage.getItem("customQuestions") || "[]");
        setQuestions([...base, ...custom]);
      } catch (err) {
        console.error("問題の読み込みに失敗しました", err);
      }
    };
    load();

    const storedResults = JSON.parse(localStorage.getItem("quizResults") || "[]");
    setResults(storedResults);
  }, []);

  const categories = ["全て", ...new Set(questions.map((q) => q.category))];

  const startQuiz = () => {
    localStorage.setItem("selectedCategory", selectedCategory);
    router.push(`/quiz?category=${encodeURIComponent(selectedCategory)}&mode=${mode}`);
  };

  const subjects = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = { score: 0, total: 0 };
    acc[r.category].score += r.score;
    acc[r.category].total += r.total;
    return acc;
  }, {});

  const overallAvg =
    results.length > 0
      ? ((results.reduce((a, r) => a + r.score, 0) /
          results.reduce((a, r) => a + r.total, 0)) *
          100).toFixed(1)
      : null;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">🦷 歯科国試トレーニング</h1>

        {/* ==== 科目選択 ==== */}
        <h2 className="text-lg font-semibold mb-2">科目を選択</h2>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border rounded-lg mb-4"
        >
          {categories.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* ==== 出題モード ==== */}
        <h2 className="text-lg font-semibold mb-2">出題モード</h2>
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => setMode("random")}
            className={`px-3 py-2 rounded-lg border ${
              mode === "random" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            ランダム
          </button>
          <button
            onClick={() => setMode("order")}
            className={`px-3 py-2 rounded-lg border ${
              mode === "order" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            順番
          </button>
          <button
            onClick={() => setMode("missed")}
            className={`px-3 py-2 rounded-lg border ${
              mode === "missed" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            間違い
          </button>
        </div>

        {/* ==== メインボタン群 ==== */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={startQuiz}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600"
          >
            スタート
          </button>

          <button
            onClick={() => router.push("/list")}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600"
          >
            問題一覧を見る
          </button>

          <button
            onClick={() => router.push("/results")}
            className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-600"
          >
            成績一覧を見る
          </button>

          <button
            onClick={() => router.push("/admin")}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600"
          >
            🧑‍💻 管理ページへ
          </button>
        </div>

        {/* ==== 成績サマリー ==== */}
        <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2 text-center">📊 成績サマリー</h3>
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">まだ成績がありません。</p>
          ) : (
            <>
              {overallAvg && (
                <p className="font-bold text-center mb-2 text-gray-700">
                  全体平均：{overallAvg}%
                </p>
              )}
              <ul className="text-sm text-gray-700 space-y-1">
                {Object.keys(subjects).map((cat) => {
                  const s = subjects[cat];
                  const avg = ((s.score / s.total) * 100).toFixed(1);
                  return (
                    <li key={cat}>
                      <span className="font-semibold">{cat}</span>：平均 {avg}%
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* ==== バックアップ操作 ==== */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={saveAutoBackup}
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600"
          >
            💾 手動バックアップ
          </button>

          <button
            onClick={async () => {
              if (confirm("バックアップを読み込みますか？")) {
                await restoreBackup();
                alert("📤 データを復元しました。再読み込みしてください。");
                location.reload();
              }
            }}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600"
          >
            📤 復元する
          </button>
        </div>

        {/* ==== フッター ==== */}
        <p className="text-xs text-gray-400 mt-6">
          作成者: Maple ／ データは自動保存されます
        </p>
      </div>
    </main>
  );
}
