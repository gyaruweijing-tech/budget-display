import { useState } from "react";
import BudgetTable from "./components/BudgetTable";
import SummaryPanel from "./components/SummaryPanel";
import EditModal from "./components/EditModal";
import { usePersistentState } from "./usePersistentState";
import {
  fixedCosts as initialFixed,
  semiFixedCosts as initialSemi,
  monthlyIncome as initialIncome,
  investmentItems as initialInvestments,
  slackItems as initialSlack,
} from "./data/budget";
import "./App.css";

const App = () => {
  const [fixedCosts, setFixedCosts] = usePersistentState("budget:fixed", initialFixed);
  const [semiFixedCosts, setSemiFixedCosts] = usePersistentState("budget:semi", initialSemi);
  const [monthlyIncome, setMonthlyIncome] = usePersistentState("budget:income", initialIncome);
  const [investments, setInvestments] = usePersistentState("budget:investments", initialInvestments);
  const [slackItems, setSlackItems] = usePersistentState("budget:slack", initialSlack);

  const [modal, setModal] = useState(null);

  const fixedTotal = fixedCosts.reduce((sum, i) => sum + i.amount, 0);
  const semiFixedTotal = semiFixedCosts.reduce((sum, i) => sum + i.amount, 0);
  const investmentTotal = investments.reduce((sum, i) => sum + i.amount, 0);

  const getList = (target) => {
    if (target === "fixed") return fixedCosts;
    if (target === "semi") return semiFixedCosts;
    if (target === "investment") return investments;
    return slackItems;
  };

  const setList = (target) => {
    if (target === "fixed") return setFixedCosts;
    if (target === "semi") return setSemiFixedCosts;
    if (target === "investment") return setInvestments;
    return setSlackItems;
  };

  const handleDelete = (target, index) => {
    const list = [...getList(target)];
    list.splice(index, 1);
    setList(target)(list);
  };

  const handleSave = (saved) => {
    const { target, mode, index } = modal;
    if (target === "income") {
      setMonthlyIncome(saved.amount);
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

  const modalItem =
    modal?.mode === "edit" && modal.index !== null
      ? getList(modal.target)[modal.index]
      : modal?.target === "income"
      ? { label: "月収（想定）", amount: monthlyIncome }
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
          onEdit={(i) => setModal({ target: "fixed", mode: "edit", index: i })}
          onDelete={(i) => handleDelete("fixed", i)}
          onAdd={() => setModal({ target: "fixed", mode: "add", index: null })}
        />
        <BudgetTable
          title="準固定費（絶対に使いたいもの）"
          items={semiFixedCosts}
          accentColor="#f97316"
          onEdit={(i) => setModal({ target: "semi", mode: "edit", index: i })}
          onDelete={(i) => handleDelete("semi", i)}
          onAdd={() => setModal({ target: "semi", mode: "add", index: null })}
        />
        <SummaryPanel
          income={monthlyIncome}
          fixedTotal={fixedTotal}
          semiFixedTotal={semiFixedTotal}
          investments={investments}
          investmentTotal={investmentTotal}
          slackItems={slackItems}
          onEditIncome={() => setModal({ target: "income", mode: "edit", index: null })}
          onEditInvestment={(i) => setModal({ target: "investment", mode: "edit", index: i })}
          onDeleteInvestment={(i) => handleDelete("investment", i)}
          onAddInvestment={() => setModal({ target: "investment", mode: "add", index: null })}
          onEditSlack={(i) => setModal({ target: "slack", mode: "edit", index: i })}
          onDeleteSlack={(i) => handleDelete("slack", i)}
          onAddSlack={() => setModal({ target: "slack", mode: "add", index: null })}
        />
      </main>

      {modal && (
        <EditModal
          mode={modal.mode}
          item={modalItem}
          hasNote={modal.target === "semi"}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default App;
