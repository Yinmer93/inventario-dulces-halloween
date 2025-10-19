import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Ingreso from "./pages/Ingreso";
import Consulta from "./pages/Consulta";
import Salida from "./pages/Salida";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-orange-50 text-gray-800">
        <header className="bg-orange-600 text-white p-4 flex justify-between">
          <h1 className="text-xl font-bold">🎃 Inventario Dulces</h1>
          <nav className="space-x-4">
            <Link to="/">Ingreso</Link>
            <Link to="/consulta">Consulta</Link>
            <Link to="/salida">Salida</Link>
          </nav>
        </header>

        <main className="p-6">
          <Routes>
            <Route path="/" element={<Ingreso />} />
            <Route path="/consulta" element={<Consulta />} />
            <Route path="/salida" element={<Salida />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
