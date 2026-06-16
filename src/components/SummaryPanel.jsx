const SummaryPanel = ({
  income,
  fixedTotal,
  semiFixedTotal,
  investments,
  investmentTotal,
  onEditIncome,
  onEditInvestment,
  onDeleteInvestment,
  onAddInvestment,
}) => {
  const totalExpense = fixedTotal + semiFixedTotal;
  const freeAmount = income - totalExpense;
  const remaining = freeAmount - investmentTotal;

  return (
    <div className="budget-card summary-card">
      <h2 className="budget-card-title" style={{ borderColor: "#6366f1" }}>
        月次サマリー
      </h2>
      <table className="budget-table">
        <tbody>
          <tr className="summary-row summary-row--income">
            <td>月収（想定）</td>
            <td className="amount-col">¥{income.toLocaleString()}</td>
            <td className="action-col">
              <button className="btn-icon" onClick={onEditIncome} title="編集">✎</button>
            </td>
          </tr>
          <tr className="summary-row summary-row--expense">
            <td>固定費</td>
            <td className="amount-col">－¥{fixedTotal.toLocaleString()}</td>
            <td className="action-col"></td>
          </tr>
          <tr className="summary-row summary-row--expense">
            <td>準固定費</td>
            <td className="amount-col">－¥{semiFixedTotal.toLocaleString()}</td>
            <td className="action-col"></td>
          </tr>
          <tr className="summary-row summary-row--total-expense">
            <td>支出合計</td>
            <td className="amount-col">－¥{totalExpense.toLocaleString()}</td>
            <td className="action-col"></td>
          </tr>
          <tr className="summary-row summary-row--free">
            <td>自由に使えるお金</td>
            <td className="amount-col">¥{freeAmount.toLocaleString()}</td>
            <td className="action-col"></td>
          </tr>

          {investments.map((inv, i) => (
            <tr key={i} className="summary-row summary-row--sub">
              <td>　└ {inv.label}</td>
              <td className="amount-col">－¥{inv.amount.toLocaleString()}</td>
              <td className="action-col">
                <button className="btn-icon" onClick={() => onEditInvestment(i)} title="編集">✎</button>
                <button className="btn-icon btn-icon--danger" onClick={() => onDeleteInvestment(i)} title="削除">✕</button>
              </td>
            </tr>
          ))}

          <tr className="summary-row summary-row--sub-add">
            <td colSpan={3}>
              <button className="btn-add" onClick={onAddInvestment}>＋ 投資項目を追加</button>
            </td>
          </tr>

          <tr className="summary-row summary-row--remaining">
            <td>残り（娯楽・交際費など）</td>
            <td className="amount-col">
              {remaining >= 0 ? "¥" : "－¥"}{Math.abs(remaining).toLocaleString()}
            </td>
            <td className="action-col"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SummaryPanel;
