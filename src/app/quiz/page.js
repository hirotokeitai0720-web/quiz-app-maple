"use client";
import { Suspense } from "react";
import QuizInner from "./QuizInner";

export default function QuizPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10 text-gray-600">読み込み中...</p>}>
      <QuizInner />
    </Suspense>
  );
}
