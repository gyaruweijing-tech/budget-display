import { useState, useEffect } from "react";

const EditModal = ({ mode, item, hasNote, onSave, onClose }) => {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (mode === "edit" && item) {
      setLabel(item.label);
      setAmount(String(item.amount));
      setNote(item.note ?? "");
    }
  }, [mode, item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(amount.replace(/,/g, ""), 10);
    if (!label.trim() || isNaN(parsed) || parsed < 0) return;
    const saved = { label: label.trim(), amount: parsed };
    if (hasNote) saved.note = note;
    onSave(saved);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          {mode === "edit" ? "項目を編集" : "項目を追加"}
        </h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label">
            名目
            <input
              className="modal-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例：食費"
              autoFocus
            />
          </label>
          <label className="modal-label">
            金額（円）
            <input
              className="modal-input"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例：30000"
            />
          </label>
          {hasNote && (
            <label className="modal-label">
              メモ（任意）
              <input
                className="modal-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例：通勤・移動の学習"
              />
            </label>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-save">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
