"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAutoBackup } from "@/utils/backup";

export default function QuizPage() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const categoryParam = params.get("category") || "全て";
  const mode = params.get("mode") || "random";

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [category, setCategory] = useState(categoryParam);

  // 🧠 データ読み込み
  useEffect(() => {
    const load = async () => {
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
        const all = [...base, ...custom];

        // --- 検索演習モード ---
        if (typeof window !== "undefined" && mode === "search") {
          const stored = JSON.parse(localStorage.getItem("searchQuestions") || "[]");
          if (stored.length > 0) {
            setQuestions(stored.map((q) => ({ ...q, userAnswer: null })));
            setCategory("検索結果演習");
            return;
          }
        }

        // --- 復習モード ---
        if (typeof window !== "undefined" && mode === "review") {
          const stored = JSON.parse(localStorage.getItem("reviewQuestions") || "[]");
          if (stored.length > 0) {
            setQuestions(stored.map((q) => ({ ...q, userAnswer: null })));
            setCategory("復習モード");
            return;
          }
        }

        // --- 一問演習モード ---
        if (typeof window !== "undefined" && selectedId) {
          const single = JSON.parse(localStorage.getItem("selectedQuiz") || "null");
          const found = single || all.find((q) => Number(q.id) === Number(selectedId));
          if (found) {
            setQuestions([found]);
            setCategory(found.category);
            return;
          }
        }

        // --- 通常モード ---
        let filtered = [];
        if (categoryParam === "全て") {
          filtered = [...all];
        } else {
          filtered = all.filter((q) => q.category === categoryParam);
        }

        // --- 間違いモード ---
        if (typeof window !== "undefined" && mode === "missed") {
          const results = JSON.parse(localStorage.getItem("quizResults") || "[]");
          const missedIds = [...new Set(results.flatMap((r) => r.missed))];
          filtered = all.filter((q) => missedIds.includes(q.id));
        }

        // --- ランダムシャッフル ---
        if (mode === "random") {
          filtered = filtered.sort(() => Math.random() - 0.5);
        }

        setQuestions(filtered.map((q) => ({ ...q, userAnswer: null })));
      } catch (err) {
        console.error("問題の読み込みエラー:", err);
      }
    };
    load();
  }, [selectedId, categoryParam, mode]);

  // --- 回答処理 ---
  const handleSelect = (index) => {
    const updated = [...questions];
    updated[current].userAnswer = index;
    setQuestions(updated);
    setSelected(index);
    setShowResult(true);
    if (index === updated[current].answer) setScore((s) => s + 1);
  };

  // --- 次へ ---
  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      handleFinish();
    }
  };

  // --- 成績保存 ---
  const saveResult = (category, score, total, missed) => {
    if (questions.length <= 1 || typeof window === "undefined") return;
    const name = prompt("この成績に名前をつけて保存します（例: 夜の復習）") || "無題の演習";
    const prev = JSON.parse(localStorage.getItem("quizResults") || "[]");
    const newResult = {
      id: Date.now(),
      name,
      category,
      score,
      total,
      missed,
      date: new Date().toLocaleString(),
    };
    localStorage.setItem("quizResults", JSON.stringify([...prev, newResult]));
    saveAutoBackup(); // ✅ 自動バックアップ
  };

  // --- 終了処理 ---
  const handleFinish = () => {
    const missedIds = questions
      .filter((q) => q.userAnswer !== null && q.userAnswer !== q.answer)
      .map((q) => q.id);

    if (typeof window === "undefined") return;

    // 🔹 復習モード
    if (mode === "review") {
      setFinished(true);
      if (score === questions.length) {
        const resultId = Number(params.get("id"));
        const results = JSON.parse(localStorage.getItem("quizResults") || "[]");
        const filtered = results.filter((r) => r.id !== resultId);
        setTimeout(() => {
          if (confirm("全問正解でした！この回の成績を削除しますか？")) {
            localStorage.setItem("quizResults", JSON.stringify(filtered));
            alert("成績を削除しました 🎉");
            saveAutoBackup(); // ✅ バックアップ更新
          }
        }, 300);
      }
      return;
    }

    // 🔹 通常モード
    saveResult(category, score, questions.length, missedIds);
    setFinished(true);
  };

  // --- 編集 ---
  const handleEdit = () => {
    if (typeof window === "undefined") return;
    const q = questions[current];
    localStorage.setItem("editQuestionData", JSON.stringify(q));
    router.push(`/admin?id=${q.id}`);
  };

  // --- ⭐ブックマーク登録・解除 ---
  const toggleBookmark = (type) => {
    if (typeof window === "undefined") return;
    const key = `bookmarks${type}`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    const q = questions[current];
    const exists = list.find((x) => x.id === q.id);
    const updated = exists ? list.filter((x) => x.id !== q.id) : [...list, q];
    localStorage.setItem(key, JSON.stringify(updated));
    alert(
      exists
        ? `ブックマーク${type}を解除しました。`
        : `ブックマーク${type}に追加しました。`
    );
  };

  // --- 再挑戦 ---
  const handleRestart = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setFinished(false);
    setQuestions(questions.map((q) => ({ ...q, userAnswer: null })));
  };

  // --- 問題が無いとき ---
  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <p>問題が見つかりません。</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          ホームに戻る
        </button>
      </main>
    );
  }

  // --- 結果画面 ---
  if (finished) {
    const isReview = mode === "review";
    return (
      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-2">
            {isReview ? "復習完了 ✅" : "結果発表 🎉"}
          </h2>
          <p className="text-lg mb-4">
            スコア：{score} / {questions.length}
          </p>
          <p className="text-gray-600 mb-6">科目：{category}</p>

          {!isReview && (
            <>
              <button
                onClick={handleRestart}
                className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
              >
                もう一度解く
              </button>
              <button
                onClick={() => router.push("/list")}
                className="bg-gray-500 text-white px-4 py-2 rounded w-full mb-2"
              >
                問題一覧へ
              </button>
            </>
          )}

          <button
            onClick={() => router.push(isReview ? "/results" : "/")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:opacity-90 w-full"
          >
            {isReview ? "成績一覧に戻る" : "ホームに戻る"}
          </button>
        </div>
      </main>
    );
  }

  const q = questions[current];

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">
            {category}：{current + 1} / {questions.length}
          </h1>
          <button
            onClick={handleFinish}
            className="text-sm text-gray-600 underline hover:text-gray-800"
          >
            終了
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-3">{q.question}</h2>

        {q.image && (
          <img
            src={q.image}
            alt="問題画像"
            className="w-full max-h-80 object-contain rounded mb-4"
          />
        )}

        <div className="space-y-2">
          {q.options.map(
            (opt, i) =>
              opt && (
                <button
                  key={i}
                  disabled={showResult}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left border px-4 py-2 rounded ${
                    showResult
                      ? i === q.answer
                        ? "bg-green-200 border-green-400"
                        : i === selected
                        ? "bg-red-200 border-red-400"
                        : "bg-gray-50"
                      : "hover:bg-blue-50"
                  }`}
                >
                  {i + 1}. {opt}
                </button>
              )
          )}
        </div>

        {showResult && (
          <div className="mt-4">
            <p className="font-bold">
              {selected === q.answer ? "✅ 正解！" : "❌ 不正解"}
            </p>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
              {q.explanation || "（解説なし）"}
            </p>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            <button
              onClick={() => toggleBookmark(1)}
              className="bg-yellow-400 text-white px-3 py-2 rounded hover:opacity-90"
            >
              ⭐①
            </button>
            <button
              onClick={() => toggleBookmark(2)}
              className="bg-orange-400 text-white px-3 py-2 rounded hover:opacity-90"
            >
              ⭐②
            </button>
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:opacity-90"
            >
              編集
            </button>
          </div>

          {showResult && (
            <button
              onClick={handleNext}
              className="bg-green-500 text-white px-4 py-2 rounded hover:opacity-90"
            >
              {current + 1 < questions.length ? "次へ →" : "結果を見る"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
