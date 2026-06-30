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

  // /api/balance を叩く共通処理（トークンはサーバー側が持つ＝ブラウザは秘密を知らない）。
  const callApi = useCallback(async (query = "") => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/balance${query}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(String(e.message || e));
    }
  }, []);

  // 開いただけ＝読むだけ（残高はブレない）。🔄ボタンだけメール取り込みを実行。
  const fetchBalance = useCallback((refresh = false) => callApi(refresh ? "?refresh=1" : ""), [callApi]);

  useEffect(() => {
    fetchBalance(false); // 開いたときは読むだけ（取り込みはしない）
  }, [fetchBalance]);

  const parseAmount = (input) => Math.round(Number(String(input).replace(/[^\d.-]/g, "")));

  // ＋入金：金額を聞いて（初期値3万）残高に足す。
  const addIncome = useCallback(() => {
    const input = window.prompt("入金額を入力（円）", "30000");
    if (input == null) return;
    const amount = parseAmount(input);
    if (!amount) return window.alert("金額が正しくありません");
    callApi(`?action=addIncome&amount=${amount}`);
  }, [callApi]);

  // －減らす：金額を聞いて残高から引く（押し間違いの取り消し用）。
  const subtract = useCallback(() => {
    const input = window.prompt("減らす金額を入力（円）", "30000");
    if (input == null) return;
    const amount = parseAmount(input);
    if (!amount) return window.alert("金額が正しくありません");
    callApi(`?action=subtract&amount=${amount}`);
  }, [callApi]);

  const balance = data?.balance;
  const txs = data?.transactions || [];

  // 残高を直接修正：今の残高を初期値にして、入れた金額に上書きする。
  const editBalance = useCallback(() => {
    const input = window.prompt("残高をいくらに直す？（円）", balance != null ? String(balance) : "");
    if (input == null) return;
    const amount = parseAmount(input);
    if (!Number.isFinite(amount)) return window.alert("金額が正しくありません");
    callApi(`?action=setBalance&amount=${amount}`);
  }, [callApi, balance]);

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
          <button className="btn-add" onClick={subtract} disabled={status === "loading"}>
            － 減らす
          </button>
          <button className="btn-add" onClick={editBalance} disabled={status === "loading"}>
            ✎ 残高修正
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
