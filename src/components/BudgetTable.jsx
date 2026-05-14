const BudgetTable = ({ title, items, accentColor }) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="budget-card">
      <h2 className="budget-card-title" style={{ borderColor: accentColor }}>
        {title}
      </h2>
      <table className="budget-table">
        <thead>
          <tr>
            <th>項目</th>
            {items.some((i) => i.note !== undefined) && <th>メモ</th>}
            <th className="amount-col">金額</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.label}>
              <td>{item.label}</td>
              {items.some((i) => i.note !== undefined) && (
                <td className="note-col">{item.note || "—"}</td>
              )}
              <td className="amount-col">
                ¥{item.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="subtotal-row">
            <td colSpan={items.some((i) => i.note !== undefined) ? 2 : 1}>
              小計
            </td>
            <td className="amount-col">¥{total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default BudgetTable;
