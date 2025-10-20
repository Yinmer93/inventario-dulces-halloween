import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function Consulta() {
  const [dulces, setDulces] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, nombre: "" });

  // Cargar dulces
  const fetchDulces = async () => {
    const querySnapshot = await getDocs(collection(db, "dulces"));
    const lista = [];
    for (let docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      if (data.cajas <= 0) {
        await deleteDoc(doc(db, "dulces", docSnap.id));
      } else {
        lista.push({ id: docSnap.id, ...data });
      }
    }
    // Ordenar alfabéticamente
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
    setDulces(lista);
  };

  useEffect(() => {
    fetchDulces();
  }, []);

  // Confirmación de borrado
  const borrarDulce = async (id) => {
    await deleteDoc(doc(db, "dulces", id));
    fetchDulces();
    setConfirmModal({ open: false, id: null, nombre: "" });
    document.body.style.overflow = "auto";
  };

  const abrirConfirmacion = (id, nombre) => {
    setConfirmModal({ open: true, id, nombre });
    document.body.style.overflow = "hidden"; // Bloquea scroll de fondo
  };

  const cerrarConfirmacion = () => {
    setConfirmModal({ open: false, id: null, nombre: "" });
    document.body.style.overflow = "auto"; // Restaura scroll
  };

  // Filtro de búsqueda
  const dulcesFiltrados = dulces.filter((d) =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPiezas = dulces.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 p-6 relative">
      <h2 className="text-2xl font-bold mb-4 text-[#FF6F3C]">🍬 Inventario de Dulces 🎃</h2>

      {/* Campo de búsqueda */}
      <input
        type="text"
        placeholder="Buscar dulce..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-4 w-80 border border-[#FF6F3C] rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      {/* Tabla */}
      <table className="border-collapse border border-[#FF6F3C] w-80 text-center bg-white rounded-lg shadow-md">
        <thead className="bg-orange-200">
          <tr>
            <th className="border border-[#FF6F3C] p-1">Nombre</th>
            <th className="border border-[#FF6F3C] p-1">Cajas</th>
            <th className="border border-[#FF6F3C] p-1">Piezas</th>
            <th className="border border-[#FF6F3C] p-1">Acción</th>
          </tr>
        </thead>
        <tbody>
          {dulcesFiltrados.map((d) => (
            <tr key={d.id}>
              <td className="border border-[#FF6F3C] p-1">{d.nombre}</td>
              <td className="border border-[#FF6F3C] p-1">{d.cajas}</td>
              <td className="border border-[#FF6F3C] p-1">{d.total}</td>
              <td className="border border-[#FF6F3C] p-1">
                <button
                  onClick={() => abrirConfirmacion(d.id, d.nombre)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
          {dulcesFiltrados.length === 0 && (
            <tr>
              <td colSpan="4" className="p-2">
                No hay dulces que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-4 font-bold text-[#FF6F3C]">
        Total de piezas en inventario: {totalPiezas}
      </p>

      {/* MODAL sobre toda la pantalla */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 99999,
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center border-4 border-[#FF6F3C] animate-fadeIn"
            style={{
              zIndex: 100000,
              position: "relative",
            }}
          >
            <h3 className="text-lg font-bold text-[#FF6F3C] mb-2">
              ⚠️ Confirmar eliminación
            </h3>
            <p className="mb-4 text-gray-700">
              ¿Seguro que quieres borrar <strong>{confirmModal.nombre}</strong> del inventario?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => borrarDulce(confirmModal.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Sí, borrar
              </button>
              <button
                onClick={cerrarConfirmacion}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animación del modal */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
}
