const SummaryPanel = ({
  income,
  fixedTotal,
  semiFixedTotal,
  investments,
  investmentTotal,
  slackItems,
  onEditIncome,
  onEditInvestment,
  onDeleteInvestment,
  onAddInvestment,
  onEditSlack,
  onDeleteSlack,
  onAddSlack,
}) => {
  const totalExpense = fixedTotal + semiFixedTotal;
  const slack = income - totalExpense - investmentTotal;
  const slackPlanned = slackItems.reduce((sum, i) => sum + i.amount, 0);
  const trueSlack = slack - slackPlanned;

  return (
    <div className="budget-card summary-card">
      <h2 className="budget-card-title" style={{ borderColor: "#6366f1" }}>
        月次サマリー
      </h2>
      <table className="budget-table">
        <tbody>
          {/* 収入 */}
          <tr className="summary-row summary-row--income">
            <td>月収（想定）</td>
            <td className="amount-col">¥{income.toLocaleString()}</td>
            <td className="action-col">
              <button className="btn-icon" onClick={onEditIncome} title="編集">✎</button>
            </td>
          </tr>

          {/* 固定費・準固定費 */}
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

          {/* 投資 */}
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

          {/* スラック */}
          <tr className="summary-row summary-row--slack">
            <td>スラック（自由に使えるお金）</td>
            <td className="amount-col">
              {slack >= 0 ? "¥" : "－¥"}{Math.abs(slack).toLocaleString()}
            </td>
            <td className="action-col"></td>
          </tr>

          {/* スラック内の使途 */}
          {slackItems.map((item, i) => (
            <tr key={i} className="summary-row summary-row--sub">
              <td>　└ {item.label}</td>
              <td className="amount-col">¥{item.amount.toLocaleString()}</td>
              <td className="action-col">
                <button className="btn-icon" onClick={() => onEditSlack(i)} title="編集">✎</button>
                <button className="btn-icon btn-icon--danger" onClick={() => onDeleteSlack(i)} title="削除">✕</button>
              </td>
            </tr>
          ))}
          <tr className="summary-row summary-row--sub-add">
            <td colSpan={3}>
              <button className="btn-add" onClick={onAddSlack}>＋ 使途を追加</button>
            </td>
          </tr>

          {/* 未割り当て（真のスラック） */}
          <tr className="summary-row summary-row--remaining">
            <td>未割り当て（真のスラック）</td>
            <td className="amount-col">
              {trueSlack >= 0 ? "¥" : "－¥"}{Math.abs(trueSlack).toLocaleString()}
            </td>
            <td className="action-col"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SummaryPanel;
