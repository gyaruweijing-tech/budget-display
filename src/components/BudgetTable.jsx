const BudgetTable = ({ title, items, accentColor, onEdit, onDelete, onAdd }) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const hasNote = items.some((i) => i.note !== undefined);

  return (
    <div className="budget-card">
      <div className="budget-card-header">
        <h2 className="budget-card-title" style={{ borderColor: accentColor }}>
          {title}
        </h2>
        <button className="btn-add" onClick={onAdd} title="項目を追加">
          ＋ 追加
        </button>
      </div>
      <table className="budget-table">
        <thead>
          <tr>
            <th>項目</th>
            {hasNote && <th>メモ</th>}
            <th className="amount-col">金額</th>
            <th className="action-col"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="budget-row">
              <td>{item.label}</td>
              {hasNote && <td className="note-col">{item.note || "—"}</td>}
              <td className="amount-col">¥{item.amount.toLocaleString()}</td>
              <td className="action-col">
                <button className="btn-icon" onClick={() => onEdit(i)} title="編集">
                  ✎
                </button>
                <button className="btn-icon btn-icon--danger" onClick={() => onDelete(i)} title="削除">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="subtotal-row">
            <td colSpan={hasNote ? 2 : 1}>小計</td>
            <td className="amount-col">¥{total.toLocaleString()}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default BudgetTable;
