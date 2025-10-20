import { useState, useEffect } from "react";
import BarcodeScanner from "../components/BarcodeScanner";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  increment,
} from "firebase/firestore";
import { toJpeg } from "html-to-image";

export default function Salida() {
  const [items, setItems] = useState([]); // [{codigo, nombre, cajas, piezas}]
  const [receptor, setReceptor] = useState("");
  const [dulces, setDulces] = useState([]); // inventario
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔸 Cargar inventario para búsqueda manual
  useEffect(() => {
    const fetchDulces = async () => {
      const querySnapshot = await getDocs(collection(db, "dulces"));
      const lista = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      lista.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
      );
      setDulces(lista);
    };
    fetchDulces();
  }, []);

  // 🔹 Escáner detecta código
  const handleDetected = async (codigo) => {
    await procesarSalida(codigo);
  };

  // 🔹 Procesar salida
  const procesarSalida = async (codigo) => {
    const docRef = doc(db, "dulces", codigo);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Dulce no encontrado en inventario");
      return;
    }

    const dulce = docSnap.data();
    const cajasRetirar = parseInt(
      prompt(`Cajas a retirar de "${dulce.nombre}" (max ${dulce.cajas}):`),
      10
    );

    if (cajasRetirar <= 0 || cajasRetirar > dulce.cajas || isNaN(cajasRetirar))
      return;

    const nuevasCajas = dulce.cajas - cajasRetirar;
    const nuevasPiezas = dulce.total - cajasRetirar * dulce.piezasPorCaja;

    // Guardar cambio en Firestore
    if (nuevasCajas <= 0) {
      await deleteDoc(docRef);
    } else {
      await updateDoc(docRef, {
        cajas: nuevasCajas,
        total: nuevasPiezas,
      });
    }

    // Actualizar lista local
    setItems((prev) => {
      const existe = prev.find((i) => i.codigo === codigo);
      if (existe) {
        return prev.map((i) =>
          i.codigo === codigo
            ? {
                ...i,
                cajas: i.cajas + cajasRetirar,
                piezas: i.piezas + cajasRetirar * dulce.piezasPorCaja,
              }
            : i
        );
      } else {
        return [
          ...prev,
          {
            codigo,
            nombre: dulce.nombre,
            cajas: cajasRetirar,
            piezas: cajasRetirar * dulce.piezasPorCaja,
          },
        ];
      }
    });
  };

  // 🔹 Buscar dulce
  const dulcesFiltrados = dulces.filter((d) =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 🔹 Cancelar transacción
  const cancelarTransaccion = async () => {
    if (!window.confirm("¿Seguro que quieres cancelar la transacción?")) return;
    setLoading(true);

    for (const item of items) {
      const ref = doc(db, "dulces", item.codigo);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        await updateDoc(ref, {
          cajas: increment(item.cajas),
          total: increment(item.piezas),
        });
      } else {
        console.warn(`El dulce ${item.nombre} ya no existe en Firestore`);
      }
    }

    setItems([]);
    setLoading(false);
    alert("Transacción cancelada y stock restaurado correctamente.");
  };

  // 🔹 Generar ticket
  const generarTicket = () => {
    const node = document.getElementById("resumen-salida");
    if (!node) return;

    toJpeg(node, { quality: 0.95, height: node.scrollHeight, width: node.scrollWidth }).then(
      (dataUrl) => {
        const imgWindow = window.open("");
        imgWindow.document.write(
          `<h2 style="text-align:center;">🎃 Salida de Dulces 🎃</h2>
           <p><strong>Receptor:</strong> ${receptor || "—"}</p>
           <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
           <img src="${dataUrl}" style="width:100%; margin-top:10px;" />`
        );
      }
    );
  };

  const totalPiezas = items.reduce((sum, i) => sum + i.piezas, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 p-6">
      <h2 className="text-2xl font-bold mb-4 text-[#FF6F3C]">
        👻 Módulo de Salida por Cajas
      </h2>

      <div className="mb-4">
        <label>Nombre del receptor:</label>
        <input
          type="text"
          value={receptor}
          onChange={(e) => setReceptor(e.target.value)}
          className="border border-gray-400 px-2 py-1 ml-2 rounded"
        />
      </div>

      {/* 🔸 Escáner */}
      <BarcodeScanner onDetected={handleDetected} />

      {/* 🔸 Buscar manualmente */}
      <div className="mt-6 w-full max-w-lg text-center">
        <input
          type="text"
          placeholder="Buscar dulce..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-orange-400 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        {busqueda && (
          <div className="bg-white border border-orange-300 rounded shadow-lg max-h-80 overflow-y-auto p-2">
            {dulcesFiltrados.length > 0 ? (
              dulcesFiltrados.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-center border-b border-orange-200 py-2 px-2"
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{d.nombre}</p>
                    <p className="text-sm text-gray-600">
                      Cajas disponibles: {d.cajas}
                    </p>
                  </div>
                  <button
                    onClick={() => procesarSalida(d.id)}
                    className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600 transition"
                  >
                    ➕ Agregar
                  </button>
                </div>
              ))
            ) : (
              <p className="p-2 text-gray-500">No se encontraron dulces.</p>
            )}
          </div>
        )}
      </div>

      {/* 🔸 Ticket */}
      <div
        id="resumen-salida"
        style={{
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#000",
          backgroundColor: "#fff",
          width: "320px",
          padding: "16px",
          marginTop: "20px",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "8px" }}>
          🎃 Ticket de Salida 🎃
        </h3>
        <p>
          <strong>Receptor:</strong> {receptor || "—"}
        </p>
        <p>
          <strong>Fecha:</strong> {new Date().toLocaleString()}
        </p>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "8px",
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px dashed #000", padding: "4px" }}>
                Nombre
              </th>
              <th style={{ borderBottom: "1px dashed #000", padding: "4px" }}>
                Cajas
              </th>
              <th style={{ borderBottom: "1px dashed #000", padding: "4px" }}>
                Piezas
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.codigo}>
                <td
                  style={{
                    borderBottom: "1px dashed #000",
                    padding: "4px",
                    textAlign: "center",
                  }}
                >
                  {i.nombre}
                </td>
                <td
                  style={{
                    borderBottom: "1px dashed #000",
                    padding: "4px",
                    textAlign: "center",
                  }}
                >
                  {i.cajas}
                </td>
                <td
                  style={{
                    borderBottom: "1px dashed #000",
                    padding: "4px",
                    textAlign: "center",
                  }}
                >
                  {i.piezas}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: "4px", textAlign: "center" }}>
                  No se han agregado dulces.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {items.length > 0 && (
          <p style={{ marginTop: "8px", fontWeight: "bold" }}>
            Total de piezas: {totalPiezas}
          </p>
        )}
      </div>

      {/* 🔸 Botones finales */}
      {items.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={generarTicket}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            📸 Generar ticket (JPEG)
          </button>

          <button
            onClick={cancelarTransaccion}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            ❌ Cancelar transacción
          </button>
        </div>
      )}
    </div>
  );
}
