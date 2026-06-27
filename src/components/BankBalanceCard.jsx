import { useState, useEffect, useCallback } from "react";

const GAS_URL = import.meta.env.VITE_GAS_URL;
const GAS_TOKEN = import.meta.env.VITE_GAS_TOKEN;

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

  const fetchBalance = useCallback(async () => {
    if (!GAS_URL) {
      setStatus("error");
      setError(".env.local または環境変数に VITE_GAS_URL を設定してください");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const url = `${GAS_URL}?token=${encodeURIComponent(GAS_TOKEN || "")}`;
      const res = await fetch(url);
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
    fetchBalance();
  }, [fetchBalance]);

  const balance = data?.balance;
  const txs = data?.transactions || [];

  return (
    <div className="budget-card bank-card">
      <div className="budget-card-header">
        <h2 className="budget-card-title" style={{ borderColor: "#0ea5e9" }}>
          銀行 残高
        </h2>
        <button className="btn-add" onClick={fetchBalance} disabled={status === "loading"}>
          {status === "loading" ? "更新中…" : "🔄 更新"}
        </button>
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
