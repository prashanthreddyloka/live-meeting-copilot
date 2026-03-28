import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import TabNav from './components/TabNav';
import About from './pages/About';
import Diagnose from './pages/Diagnose';
import History from './pages/History';
import RevivalPlan from './pages/RevivalPlan';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Diagnose />} />
            <Route path="/revival-plan" element={<RevivalPlan />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <TabNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
