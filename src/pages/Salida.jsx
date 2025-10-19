import { useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { toJpeg } from "html-to-image";

export default function Salida() {
  const [items, setItems] = useState([]); // {codigo, nombre, cajas, piezas}
  const [receptor, setReceptor] = useState("");

  const handleDetected = async (codigo) => {
    const docRef = doc(db, "dulces", codigo);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Dulce no encontrado en inventario");
      return;
    }

    const dulce = docSnap.data();
    const cajasRetirar = parseInt(prompt(`Cajas a retirar de "${dulce.nombre}" (max ${dulce.cajas}):`), 10) || 0;
    if (cajasRetirar <= 0 || cajasRetirar > dulce.cajas) return;

    const nuevasCajas = dulce.cajas - cajasRetirar;
    const nuevasPiezas = dulce.total - cajasRetirar * dulce.piezasPorCaja;

    // Si ya no quedan cajas, eliminar del inventario
    if (nuevasCajas <= 0) {
      await deleteDoc(docRef);
    } else {
      await updateDoc(docRef, {
        cajas: nuevasCajas,
        total: nuevasPiezas
      });
    }

    // Actualizar lista local para ticket
    setItems(prev => {
      const existe = prev.find(i => i.codigo === codigo);
      if (existe) {
        return prev.map(i =>
          i.codigo === codigo
            ? { ...i, cajas: i.cajas + cajasRetirar, piezas: i.piezas + cajasRetirar * dulce.piezasPorCaja }
            : i
        );
      } else {
        return [...prev, { codigo, nombre: dulce.nombre, cajas: cajasRetirar, piezas: cajasRetirar * dulce.piezasPorCaja }];
      }
    });
  };

  const generarTicket = () => {
    const node = document.getElementById("resumen-salida");
    if (!node) return;

    toJpeg(node, { quality: 0.95, height: node.scrollHeight, width: node.scrollWidth })
      .then((dataUrl) => {
        const imgWindow = window.open("");
        imgWindow.document.write(
          `<h2 style="text-align:center;">🎃 Salida de Dulces 🎃</h2>
           <p><strong>Receptor:</strong> ${receptor || "—"}</p>
           <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
           <img src="${dataUrl}" style="width:100%; margin-top:10px;" />`
        );
      });
  };

  const totalPiezas = items.reduce((sum, i) => sum + i.piezas, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 p-6">
      <h2 className="text-2xl font-bold mb-4">👻 Módulo de Salida por Cajas</h2>

      <div className="mb-4">
        <label>Nombre del receptor:</label>
        <input
          type="text"
          value={receptor}
          onChange={(e) => setReceptor(e.target.value)}
          className="border border-gray-400 px-2 py-1 ml-2 rounded"
        />
      </div>

      <BarcodeScanner onDetected={handleDetected} />

      <div
        id="resumen-salida"
        style={{
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#000",
          backgroundColor: "#fff",
          width: "300px",
          padding: "16px",
          marginTop: "20px",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "8px" }}>🎃 Ticket de Salida 🎃</h3>
        <p><strong>Receptor:</strong> {receptor || "—"}</p>
        <p><strong>Fecha:</strong> {new Date().toLocaleString()}</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px dashed #000", padding: "4px", textAlign: "center" }}>Nombre</th>
              <th style={{ borderBottom: "1px dashed #000", padding: "4px", textAlign: "center" }}>Cajas</th>
              <th style={{ borderBottom: "1px dashed #000", padding: "4px", textAlign: "center" }}>Piezas</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.codigo}>
                <td style={{ borderBottom: "1px dashed #000", padding: "4px", textAlign: "center" }}>{i.nombre}</td>
                <td style={{ borderBottom: "1px dashed #000", padding: "4px", textAlign: "center" }}>{i.cajas}</td>
                <td style={{ borderBottom: "1px dashed #000", padding: "4px", textAlign: "center" }}>{i.piezas}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: "4px", textAlign: "center" }}>No se han agregado dulces.</td>
              </tr>
            )}
          </tbody>
        </table>
        {items.length > 0 && (
          <p style={{ marginTop: "8px", fontWeight: "bold" }}>Total de piezas: {totalPiezas}</p>
        )}
      </div>

      {items.length > 0 && (
        <button
          onClick={generarTicket}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
          📸 Generar ticket (JPEG)
        </button>
      )}
    </div>
  );
}
