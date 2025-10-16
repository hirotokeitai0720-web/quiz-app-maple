"use client";
import { Suspense } from "react";
import AdminInner from "./AdminInner";

export default function AdminPageWrapper() {
  return (
    <Suspense fallback={<p className="text-center mt-10 text-gray-600">読み込み中...</p>}>
      <AdminInner />
    </Suspense>
  );
}
