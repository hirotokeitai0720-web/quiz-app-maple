"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = false;
export const runtime = "edge";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { saveAutoBackup } from "@/utils/backup";


export default function ListPage() {
  const [questions, setQuestions] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("すべて");
  const [bookmarkView, setBookmarkView] = useState(null); // ⭐① or ⭐② の切替
  const router = useRouter();

  // ✅ 問題データ読み込み
  useEffect(() => {
    const load = async () => {
      try {
        const base = await fetch("/questions.json").then((r) => r.json()).catch(() => []);
        const custom = JSON.parse(localStorage.getItem("customQuestions") || "[]");
        setQuestions([...base, ...custom]);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // ✅ 編集
  const handleEdit = (q) => {
    localStorage.setItem("editQuestionData", JSON.stringify(q));
    router.push(`/admin?id=${q.id}`);
  };

  // ✅ 単一演習
  const handlePlay = (q) => {
    localStorage.setItem("selectedQuiz", JSON.stringify(q));
    router.push(`/quiz?id=${q.id}`);
  };

  // ✅ 検索結果で一括演習
  const handlePlayAll = () => {
    if (filtered.length === 0) {
      alert("該当する問題がありません。");
      return;
    }
    localStorage.setItem("searchQuestions", JSON.stringify(filtered));
    router.push("/quiz?mode=search");
  };

  // ✅ ブックマークの切替
  const handleBookmarkView = (type) => {
    setBookmarkView(type === bookmarkView ? null : type);
  };

  // ✅ 全ブックマーク読み込み
  const bookmarks1 = JSON.parse(localStorage.getItem("bookmarks1") || "[]");
  const bookmarks2 = JSON.parse(localStorage.getItem("bookmarks2") || "[]");

  // ✅ 絞り込み処理
  const filtered = questions.filter((q) => {
    const matchKeyword =
      q.question.includes(keyword) ||
      q.category.includes(keyword) ||
      q.explanation.includes(keyword);
    const matchCategory = filter === "すべて" || q.category === filter;
    return matchKeyword && matchCategory;
  });

  const categories = ["すべて", ...new Set(questions.map((q) => q.category))];

  // ✅ 表示リスト切り替え
  const displayList =
    bookmarkView === 1
      ? bookmarks1
      : bookmarkView === 2
      ? bookmarks2
      : filtered;

  // ✅ 手動バックアップ処理
  const handleManualBackup = () => {
    try {
      saveAutoBackup();
      alert("💾 バックアップを保存しました！");
    } catch (e) {
      console.error(e);
      alert("⚠️ バックアップ中にエラーが発生しました。");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">📘 問題一覧</h1>

        {/* 🔍 検索・操作バー */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input
            type="text"
            placeholder="キーワード検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="border p-2 rounded w-1/2"
          />

          <button
            onClick={handlePlayAll}
            className="bg-green-500 text-white px-3 py-2 rounded hover:opacity-90"
          >
            🔁 ソート演習
          </button>

          <div className="flex gap-1">
            <button
              onClick={() => handleBookmarkView(1)}
              className={`px-3 py-2 rounded ${
                bookmarkView === 1 ? "bg-yellow-400 text-white" : "bg-yellow-100"
              }`}
            >
              ⭐①
            </button>
            <button
              onClick={() => handleBookmarkView(2)}
              className={`px-3 py-2 rounded ${
                bookmarkView === 2 ? "bg-orange-400 text-white" : "bg-orange-100"
              }`}
            >
              ⭐②
            </button>
          </div>

          {/* 🟦 科目選択＋バックアップ＋ホーム */}
          <div className="flex gap-2 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border p-2 rounded"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <button
              onClick={handleManualBackup}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:opacity-90"
            >
              💾 バックアップ
            </button>

            <button
              onClick={() => router.push("/")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:opacity-90"
            >
              🏠 ホーム
            </button>
          </div>
        </div>

        {/* 📚 一覧 */}
        <div className="space-y-4">
          {displayList.length === 0 ? (
            <p className="text-center text-gray-500">該当する問題がありません。</p>
          ) : (
            displayList.map((q) => (
              <div key={q.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">科目：{q.category}</p>
                <p className="font-bold text-lg mb-2">{q.question}</p>

                <ul className="ml-4 list-disc text-gray-700 mb-2">
                  {q.options.map(
                    (opt, i) =>
                      opt && (
                        <li key={i}>
                          {i + 1}. {opt}
                        </li>
                      )
                  )}
                </ul>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handlePlay(q)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:opacity-90"
                  >
                    演習
                  </button>
                  <button
                    onClick={() => handleEdit(q)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:opacity-90"
                  >
                    編集
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ⭐ ブックマークラベル */}
        {bookmarkView && (
          <p className="text-center text-gray-500 mt-4">
            表示中：ブックマーク{bookmarkView}
          </p>
        )}
      </div>
    </main>
  );
}
