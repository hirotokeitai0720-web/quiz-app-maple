import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    // 🔒 パスコード認証（同じコードをadmin側で送る）
    const auth = req.headers.get("x-auth-code");
    if (auth !== "1234") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // 📦 フォームデータを取得
    const data = await req.formData();
    const file = data.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 📁 保存先フォルダを自動生成
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 📄 保存ファイル名
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // 💾 書き込み処理
    await writeFile(filePath, buffer);

    // ✅ 成功レスポンス
    return new Response(
      JSON.stringify({
        message: "アップロード完了",
        url: `/uploads/${fileName}`,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
    });
  }
}
