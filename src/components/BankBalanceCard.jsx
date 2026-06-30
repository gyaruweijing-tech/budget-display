import { useState, useEffect, useCallback } from "react";

// 秘密はフロントに置かない。サーバーレス関数 /api/balance 経由で取得する。
const fmtDate = (d) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d || "");
  return date.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  });
};

const BankBalanceCard = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");
  const [showTx, setShowTx] = useState(false);

  // refresh=true（🔄ボタン）のときだけメール取り込みを実行。
  // 初回ロードは読み取り専用なので、開くたびに残高がブレない。
  const fetchBalance = useCallback(async (refresh = false) => {
    setStatus("loading");
    setError("");
    try {
      // トークンはサーバー側(/api/balance)が持つ。ブラウザは秘密を一切知らない。
      const res = await fetch(refresh ? "/api/balance?refresh=1" : "/api/balance");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(String(e.message || e));
    }
  }, []);

  useEffect(() => {
    fetchBalance(false); // 開いたときは読むだけ（取り込みはしない）
  }, [fetchBalance]);

  // ＋入金ボタン：金額を聞いて（初期値3万）入金を1件追加する。
  const addIncome = useCallback(async () => {
    const input = window.prompt("入金額を入力（円）", "30000");
    if (input == null) return; // キャンセル
    const amount = Math.round(Number(input.replace(/[^\d.-]/g, "")));
    if (!amount) {
      window.alert("金額が正しくありません");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/balance?action=addIncome&amount=${amount}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(String(e.message || e));
    }
  }, []);

  const balance = data?.balance;
  const txs = data?.transactions || [];

  return (
    <div className="budget-card bank-card">
      <div className="budget-card-header">
        <h2 className="budget-card-title" style={{ borderColor: "#0ea5e9" }}>
          銀行 残高
        </h2>
        <div className="bank-actions">
          <button className="btn-add" onClick={addIncome} disabled={status === "loading"}>
            ＋ 入金
          </button>
          <button className="btn-add" onClick={() => fetchBalance(true)} disabled={status === "loading"}>
            {status === "loading" ? "更新中…" : "🔄 更新"}
          </button>
        </div>
      </div>

      {status === "error" ? (
        <p className="bank-error">⚠️ {error}</p>
      ) : (
        <>
          <div className="bank-balance">
            {balance == null ? "—" : `¥${Number(balance).toLocaleString()}`}
          </div>
          {data?.updatedAt && (
            <p className="bank-updated">
              最終更新：
              {new Date(data.updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </p>
          )}

          {txs.length > 0 && (
            <div className="bank-tx-wrap">
              <button className="bank-tx-toggle" onClick={() => setShowTx((v) => !v)}>
                {showTx ? "▲ 取引履歴を隠す" : `▼ 取引履歴を見る（${txs.length}件）`}
              </button>
              {showTx && (
                <div className="bank-tx-list">
                  <table className="budget-table bank-tx">
                    <tbody>
                      {txs.map((t) => (
                        <tr key={t.id} className="summary-row summary-row--sub">
                          <td className="bank-tx-date">{fmtDate(t.date)}</td>
                          <td>{t.shop}</td>
                          <td
                            className="amount-col"
                            style={{ color: t.type === "入金" ? "#16a34a" : "#dc2626" }}
                          >
                            {t.type === "入金" ? "＋" : "－"}¥{Math.abs(t.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BankBalanceCard;
