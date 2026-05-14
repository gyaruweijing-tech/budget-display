import BudgetTable from "./components/BudgetTable";
import SummaryPanel from "./components/SummaryPanel";
import {
  fixedCosts,
  semiFixedCosts,
  monthlyIncome,
  minInvestment,
  stockTarget,
} from "./data/budget";
import "./App.css";

const fixedTotal = fixedCosts.reduce((sum, i) => sum + i.amount, 0);
const semiFixedTotal = semiFixedCosts.reduce((sum, i) => sum + i.amount, 0);

const App = () => {
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
        />
        <BudgetTable
          title="準固定費（絶対に使いたいもの）"
          items={semiFixedCosts}
          accentColor="#f97316"
        />
        <SummaryPanel
          income={monthlyIncome}
          fixedTotal={fixedTotal}
          semiFixedTotal={semiFixedTotal}
          minInvestment={minInvestment}
          stockTarget={stockTarget}
        />
      </main>
    </div>
  );
};

export default App;
