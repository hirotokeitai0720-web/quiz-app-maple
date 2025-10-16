"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // ✅ 成績データと問題データの読み込み
  useEffect(() => {
    // ---- 成績の読み込み ----
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("quizResults") || "[]");
        setResults(Array.isArray(stored) ? stored : []);
      } catch {
        setResults([]);
      }
    }

    // ---- 問題データ読み込み ----
    const loadQuestions = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://quiz-app-maple-final.vercel.app";
        const base = await fetch(`${baseUrl}/questions.json`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => []);
        let custom = [];
        if (typeof window !== "undefined") {
          custom = JSON.parse(localStorage.getItem("customQuestions") || "[]");
        }
        setQuestions([...base, ...custom]);
      } catch {
        setQuestions([]);
      } finally {
        setLoaded(true);
      }
    };
    loadQuestions();
  }, []);

  // ✅ 成績削除
  const deleteResult = (id) => {
    if (typeof window === "undefined") return;
    if (!confirm("この成績を削除しますか？")) return;
    const filtered = results.filter((r) => r.id !== id);
    setResults(filtered);
    localStorage.setItem("quizResults", JSON.stringify(filtered));
  };

  // ✅ 復習モード開始
  const startReview = (r) => {
    if (typeof window === "undefined") return;
    if (!loaded) {
      alert("問題データを読み込み中です。少し待ってください。");
      return;
    }

    const missedQuestions = questions.filter((q) => r.missed?.includes(q.id));
    if (!missedQuestions.length) {
      alert("この回には間違いがありません。");
      return;
    }

    localStorage.setItem("reviewQuestions", JSON.stringify(missedQuestions));
    router.push(`/quiz?mode=review&id=${r.id}`);
  };

  // ✅ 平均計算
  const overallAvg = (() => {
    if (!results.length) return 0;
    const totalScore = results.reduce((a, r) => a + (r.score || 0), 0);
    const totalQ = results.reduce((a, r) => a + (r.total || 0), 0);
    return totalQ ? ((totalScore / totalQ) * 100).toFixed(1) : 0;
  })();

  const subjects = results.reduce((acc, r) => {
    const cat = r.category || "未分類";
    if (!acc[cat]) acc[cat] = { score: 0, total: 0 };
    acc[cat].score += r.score || 0;
    acc[cat].total += r.total || 0;
    return acc;
  }, {});

  // ==============================
  // ✅ レンダリング部分
  // ==============================
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">📊 成績一覧</h1>

        {/* ==== 平均点サマリー ==== */}
        {results.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 border text-sm">
            <p className="font-bold mb-1">全体平均：{overallAvg}%</p>
            {Object.keys(subjects).map((cat) => {
              const s = subjects[cat];
              const avg = s.total ? ((s.score / s.total) * 100).toFixed(1) : "0.0";
              return (
                <p key={cat}>
                  {cat}：{avg}%
                </p>
              );
            })}
          </div>
        )}

        {/* ==== 成績リスト ==== */}
        {results.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>まだ成績データがありません。</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:opacity-90"
            >
              ホームに戻る
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {results
              .slice()
              .reverse()
              .map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-4 bg-gray-50 shadow-sm transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="font-bold">{r.name || "無題の演習"}</h2>
                      <p className="text-sm text-gray-600">
                        {r.category || "未分類"} / {r.score ?? 0} / {r.total ?? 0}問（
                        {r.total ? ((r.score / r.total) * 100).toFixed(1) : "0.0"}%）
                      </p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>

                    {/* ✅ ボタン群 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className="text-blue-500 underline"
                      >
                        {expanded === r.id ? "閉じる" : "詳細"}
                      </button>
                      <button
                        onClick={() => startReview(r)}
                        className="text-green-600 underline"
                      >
                        復習
                      </button>
                      <button
                        onClick={() => deleteResult(r.id)}
                        className="text-red-500 underline"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  {/* ==== 詳細プレビュー ==== */}
                  {expanded === r.id && (
                    <div className="mt-3 border-t pt-3 text-sm text-gray-700">
                      <p className="font-semibold mb-2">❌ 間違えた問題：</p>
                      {!r.missed || r.missed.length === 0 ? (
                        <p className="text-gray-500">なし</p>
                      ) : (
                        <ul className="space-y-2">
                          {r.missed.map((id) => {
                            const q = questions.find((x) => x.id === id);
                            if (!q) return <li key={id}>ID: {id}（削除済み）</li>;
                            return (
                              <li
                                key={id}
                                className="border rounded-lg bg-white p-2 hover:bg-gray-100"
                              >
                                <p className="font-medium">{q.question}</p>
                                <ul className="ml-4 list-disc">
                                  {q.options.map((opt, i) => (
                                    <li key={i}>
                                      {i + 1}. {opt}
                                    </li>
                                  ))}
                                </ul>
                                <p className="mt-1 text-xs text-gray-500">
                                  正解：{q.options[q.answer]}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* 🏠 ホームボタン */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </main>
  );
}
