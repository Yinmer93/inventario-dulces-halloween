import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function Consulta() {
  const [dulces, setDulces] = useState([]);

  const fetchDulces = async () => {
    const querySnapshot = await getDocs(collection(db, "dulces"));
    const lista = [];
    for (let docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      if (data.cajas <= 0) {
        // Eliminar del inventario si hay 0 cajas
        await deleteDoc(doc(db, "dulces", docSnap.id));
      } else {
        lista.push({ id: docSnap.id, ...data });
      }
    }
    setDulces(lista);
  };

  useEffect(() => {
    fetchDulces();
  }, []);

  const borrarDulce = async (id) => {
    await deleteDoc(doc(db, "dulces", id));
    fetchDulces();
  };

  const totalPiezas = dulces.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 p-6">
      <h2 className="text-2xl font-bold mb-4">🍬 Inventario de Dulces 🎃</h2>
      <table className="border-collapse border border-[#FF6F3C] w-80 text-center">
        <thead>
          <tr>
            <th className="border border-[#FF6F3C] p-1">Nombre</th>
            <th className="border border-[#FF6F3C] p-1">Cajas</th>
            <th className="border border-[#FF6F3C] p-1">Piezas</th>
            <th className="border border-[#FF6F3C] p-1">Acción</th>
          </tr>
        </thead>
        <tbody>
          {dulces.map(d => (
            <tr key={d.id}>
              <td className="border border-[#FF6F3C] p-1">{d.nombre}</td>
              <td className="border border-[#FF6F3C] p-1">{d.cajas}</td>
              <td className="border border-[#FF6F3C] p-1">{d.total}</td>
              <td className="border border-[#FF6F3C] p-1">
                <button
                  onClick={() => borrarDulce(d.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
          {dulces.length === 0 && (
            <tr>
              <td colSpan="4" className="p-2">No hay dulces en inventario.</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-4 font-bold text-[#FF6F3C]">Total de piezas en inventario: {totalPiezas}</p>
    </div>
  );
}
