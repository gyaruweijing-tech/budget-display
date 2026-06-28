// Vercel サーバーレス関数（Vercelのサーバー上で実行される＝ブラウザには中身が出ない）
// 秘密(GAS_URL / GAS_TOKEN)はここでだけ使う。VITE_ を付けないのがミソ。
// ブラウザは /api/balance を叩くだけで、トークンは一切受け取らない。
export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_URL;
  const GAS_TOKEN = process.env.GAS_TOKEN;

  if (!GAS_URL || !GAS_TOKEN) {
    return res
      .status(500)
      .json({ error: "サーバー側に環境変数 GAS_URL / GAS_TOKEN が設定されていません" });
  }

  try {
    const url = `${GAS_URL}?token=${encodeURIComponent(GAS_TOKEN)}`;
    const r = await fetch(url);
    const json = await r.json();
    // GAS側のエラーもそのまま返す
    return res.status(200).json(json);
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
