"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { saveAutoBackup } from "@/utils/backup"; // ✅ Supabaseバックアップ機能を利用

/** 選択肢を常に5つに整える関数 */
function normalizeOptions(opts) {
  const a = Array.isArray(opts) ? [...opts] : [];
  while (a.length < 5) a.push("");
  return a.slice(0, 5);
}

/** 空の初期フォーム */
const EMPTY_FORM = {
  id: null,
  category: "",
  question: "",
  options: ["", "", "", "", ""],
  answer: 0,
  explanation: "",
  image: "",
};

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [jsonInput, setJsonInput] = useState("");
  const initOnce = useRef(false);

  // ------- 初期ロード -------
  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    (async () => {
      try {
        const base = await fetch("/questions.json").then((r) => r.json()).catch(() => []);
        const custom = JSON.parse(localStorage.getItem("customQuestions") || "[]");
        const all = [...base, ...custom];

        let picked = null;
        if (editIdParam) {
          const idNum = Number(editIdParam);
          picked = all.find((q) => Number(q.id) === idNum) || null;
        }

        if (!picked) {
          const blob = localStorage.getItem("editQuestionData");
          if (blob) {
            try {
              picked = JSON.parse(blob);
            } catch {}
          }
        }

        if (picked) {
          setForm({
            id: picked.id ?? null,
            category: picked.category ?? "",
            question: picked.question ?? "",
            options: normalizeOptions(picked.options),
            answer: Number.isFinite(picked.answer) ? picked.answer : 0,
            explanation: picked.explanation ?? "",
            image: picked.image ?? "",
          });
          setIsEditing(true);
        } else {
          setForm(EMPTY_FORM);
          setIsEditing(false);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [editIdParam]);

  // ------- 入力更新 -------
  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const onOptionChange = (i, val) =>
    setForm((f) => {
      const next = normalizeOptions(f.options);
      next[i] = val;
      return { ...f, options: next };
    });

  // ------- 画像アップロード -------
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) {
        onChange("image", data.url);
        alert("✅ 画像をアップロードしました");
      } else {
        alert("❌ アップロードに失敗しました");
      }
    } catch {
      alert("❌ アップロードに失敗しました");
    }
  };

  // ------- 保存（新規/更新） -------
  const onSubmit = () => {
    if (loading) return;
    if (!form.question.trim()) return alert("問題文を入力してください");
    if (!Array.isArray(form.options) || !form.options.filter((s) => s?.trim()).length)
      return alert("少なくとも1つの選択肢を入力してください");

    const stored = JSON.parse(localStorage.getItem("customQuestions") || "[]");
    let updated;

    if (isEditing && form.id != null) {
      updated = stored.map((q) =>
        Number(q.id) === Number(form.id)
          ? { ...form, options: normalizeOptions(form.options) }
          : q
      );
      alert("✏️ 問題を更新しました！");
    } else {
      const newQ = {
        ...form,
        id: Date.now(),
        options: normalizeOptions(form.options),
      };
      updated = [...stored, newQ];
      alert("✅ 新しい問題を追加しました！");
    }

    localStorage.setItem("customQuestions", JSON.stringify(updated));
    saveAutoBackup(); // ✅ Supabaseへ自動バックアップ
    setIsEditing(false);
    setForm(EMPTY_FORM);
  };

  // ------- JSON一括追加 -------
  const onImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const sanitized = arr.map((q) => ({
        id: q.id ?? Date.now() + Math.random(),
        category: q.category ?? "",
        question: q.question ?? "",
        options: normalizeOptions(q.options),
        answer: Number.isFinite(q.answer) ? q.answer : 0,
        explanation: q.explanation ?? "",
        image: q.image ?? "",
      }));
      const stored = JSON.parse(localStorage.getItem("customQuestions") || "[]");
      const merged = [...stored, ...sanitized];
      localStorage.setItem("customQuestions", JSON.stringify(merged));
      alert(`✅ ${sanitized.length}件 取り込みました`);
      saveAutoBackup(); // ✅ 一括追加後もバックアップ
      setJsonInput("");
    } catch {
      alert("❌ JSONの形式が不正です");
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">読み込み中…</p>;
  }

  // ------- UI -------
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {isEditing ? "✏️ 問題編集" : "🧩 新規問題追加"}
          </h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 underline hover:text-gray-800"
          >
            🏠 ホームへ戻る
          </button>
        </div>

        {/* ID 表示 */}
        {isEditing && form.id != null && (
          <p className="text-xs text-gray-500 mb-3">ID: {form.id}</p>
        )}

        {/* 入力フォーム */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="科目"
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="問題文"
            value={form.question}
            onChange={(e) => onChange("question", e.target.value)}
            className="border p-2 rounded w-full"
          />

          {form.options.map((opt, i) => (
            <input
              key={i}
              type="text"
              placeholder={`選択肢 ${i + 1}`}
              value={opt}
              onChange={(e) => onOptionChange(i, e.target.value)}
              className="border p-2 rounded w-full"
            />
          ))}

          <input
            type="number"
            min={0}
            max={4}
            placeholder="正解番号（0〜4）"
            value={form.answer}
            onChange={(e) => onChange("answer", Number(e.target.value))}
            className="border p-2 rounded w-full"
          />

          <textarea
            placeholder="解説"
            value={form.explanation}
            onChange={(e) => onChange("explanation", e.target.value)}
            className="border p-2 rounded w-full"
          />

          {/* 画像アップロード */}
          <div>
            <input type="file" accept="image/*" onChange={onUpload} />
            {form.image && (
              <img
                src={form.image}
                alt="プレビュー"
                className="w-full max-h-60 object-contain rounded mt-2"
              />
            )}
          </div>

          <button
            onClick={onSubmit}
            disabled={loading}
            className={`${
              isEditing ? "bg-blue-500" : "bg-green-500"
            } text-white px-4 py-2 rounded w-full font-bold hover:opacity-90 disabled:opacity-50`}
          >
            {isEditing ? "更新する" : "追加する"}
          </button>
        </div>

        {/* JSON一括追加 */}
        <div className="mt-8">
          <h2 className="font-bold mb-2">🧠 JSONペーストで一括追加</h2>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='例: [{"id":1,"category":"保存修復",...}, {...}]'
            className="border p-2 rounded w-full h-32"
          />
          <button
            onClick={onImportJson}
            className="bg-gray-800 text-white px-4 py-2 rounded w-full mt-2 hover:opacity-90"
          >
            JSONを読み込む
          </button>
        </div>
      </div>
    </main>
  );
}
