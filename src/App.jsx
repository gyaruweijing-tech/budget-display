import { useState } from "react";
import BudgetTable from "./components/BudgetTable";
import SummaryPanel from "./components/SummaryPanel";
import EditModal from "./components/EditModal";
import {
  fixedCosts as initialFixed,
  semiFixedCosts as initialSemi,
  monthlyIncome as initialIncome,
  minInvestment as initialMinInv,
  stockTarget as initialStock,
} from "./data/budget";
import "./App.css";

const App = () => {
  const [fixedCosts, setFixedCosts] = useState(initialFixed);
  const [semiFixedCosts, setSemiFixedCosts] = useState(initialSemi);
  const [monthlyIncome, setMonthlyIncome] = useState(initialIncome);
  const [minInvestment, setMinInvestment] = useState(initialMinInv);
  const [stockTarget, setStockTarget] = useState(initialStock);

  // modal state: { target: "fixed"|"semi"|"income"|"investment", mode: "edit"|"add", index: number|null }
  const [modal, setModal] = useState(null);

  const fixedTotal = fixedCosts.reduce((sum, i) => sum + i.amount, 0);
  const semiFixedTotal = semiFixedCosts.reduce((sum, i) => sum + i.amount, 0);

  const getList = (target) => (target === "fixed" ? fixedCosts : semiFixedCosts);
  const setList = (target) => (target === "fixed" ? setFixedCosts : setSemiFixedCosts);

  const openEdit = (target, index) => setModal({ target, mode: "edit", index });
  const openAdd = (target) => setModal({ target, mode: "add", index: null });

  const handleDelete = (target, index) => {
    const list = [...getList(target)];
    list.splice(index, 1);
    setList(target)(list);
  };

  const handleSave = (saved) => {
    const { target, mode, index } = modal;

    if (target === "income") {
      setMonthlyIncome(saved.amount);
    } else if (target === "minInvestment") {
      setMinInvestment(saved.amount);
    } else if (target === "stockTarget") {
      setStockTarget(saved.amount);
    } else {
      const list = [...getList(target)];
      if (mode === "edit") {
        list[index] = saved;
      } else {
        list.push(saved);
      }
      setList(target)(list);
    }
    setModal(null);
  };

  const hasNote = modal && (modal.target === "semi");
  const modalItem =
    modal?.mode === "edit" && modal.index !== null
      ? getList(modal.target)[modal.index]
      : modal?.target === "income"
      ? { label: "月収（想定）", amount: monthlyIncome }
      : modal?.target === "minInvestment"
      ? { label: "投資（最低）", amount: minInvestment }
      : modal?.target === "stockTarget"
      ? { label: "個別株（目標）", amount: stockTarget }
      : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>月次予算ダッシュボード</h1>
        <p className="app-subtitle">2026年 月次予算</p>
      </header>

      <main className="dashboard-grid">
        <BudgetTable
          title="固定費（絶対にかかるもの）"
          items={fixedCosts}
          accentColor="#ef4444"
          target="fixed"
          onEdit={(i) => openEdit("fixed", i)}
          onDelete={(i) => handleDelete("fixed", i)}
          onAdd={() => openAdd("fixed")}
        />
        <BudgetTable
          title="準固定費（絶対に使いたいもの）"
          items={semiFixedCosts}
          accentColor="#f97316"
          target="semi"
          onEdit={(i) => openEdit("semi", i)}
          onDelete={(i) => handleDelete("semi", i)}
          onAdd={() => openAdd("semi")}
        />
        <SummaryPanel
          income={monthlyIncome}
          fixedTotal={fixedTotal}
          semiFixedTotal={semiFixedTotal}
          minInvestment={minInvestment}
          stockTarget={stockTarget}
          onEditIncome={() => setModal({ target: "income", mode: "edit", index: null })}
          onEditMinInvestment={() => setModal({ target: "minInvestment", mode: "edit", index: null })}
          onEditStockTarget={() => setModal({ target: "stockTarget", mode: "edit", index: null })}
        />
      </main>

      {modal && (
        <EditModal
          mode={modal.mode}
          item={modalItem}
          hasNote={hasNote}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default App;
