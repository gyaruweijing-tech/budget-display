const SummaryPanel = ({ income, fixedTotal, semiFixedTotal, minInvestment, stockTarget }) => {
  const totalExpense = fixedTotal + semiFixedTotal;
  const freeAmount = income - totalExpense;
  const remaining = freeAmount - minInvestment - stockTarget;

  const rows = [
    { label: "月収（想定）", amount: income, type: "income" },
    { label: "固定費", amount: -fixedTotal, type: "expense" },
    { label: "準固定費", amount: -semiFixedTotal, type: "expense" },
    { label: "支出合計", amount: -totalExpense, type: "total-expense" },
    { label: "自由に使えるお金", amount: freeAmount, type: "free" },
    { label: "　└ 投資（最低）", amount: -minInvestment, type: "sub" },
    { label: "　└ 個別株（目標）", amount: -stockTarget, type: "sub" },
    { label: "残り（娯楽・交際費など）", amount: remaining, type: "remaining" },
  ];

  return (
    <div className="budget-card summary-card">
      <h2 className="budget-card-title" style={{ borderColor: "#6366f1" }}>
        月次サマリー
      </h2>
      <table className="budget-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={`summary-row summary-row--${row.type}`}>
              <td>{row.label}</td>
              <td className="amount-col">
                {row.amount >= 0 ? "¥" : "－¥"}
                {Math.abs(row.amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryPanel;
