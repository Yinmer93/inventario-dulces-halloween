import { useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

export default function Ingreso() {
  const [scanResult, setScanResult] = useState("");

  const handleDetected = async (codigo) => {
    setScanResult(codigo);

    const docRef = doc(db, "dulces", codigo);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const nombre = prompt("Nombre del dulce:");
      const cajas = parseInt(prompt("Número de cajas:"), 10) || 0;
      const piezasPorCaja = parseInt(prompt("Piezas por caja:"), 10) || 0;
      const total = cajas * piezasPorCaja;

      await setDoc(docRef, { nombre, cajas, piezasPorCaja, total });
      alert(`✅ "${nombre}" agregado con ${cajas} cajas (${total} piezas)`);
    } else {
      const dulce = docSnap.data();
      const cajas = parseInt(prompt(`Número de cajas adicionales para "${dulce.nombre}":`), 10) || 0;
      if (cajas > 0) {
        await updateDoc(docRef, {
          cajas: increment(cajas),
          total: increment(cajas * dulce.piezasPorCaja),
        });
        alert(`✅ "${dulce.nombre}" actualizado con ${cajas} cajas adicionales`);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF4E1] p-6">
      <h2 className="text-3xl font-bold mb-6 text-[#FF6F3C] text-center">📦 Ingreso de Dulces 🎃</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
        <BarcodeScanner onDetected={handleDetected} />
        {scanResult && <p className="mt-4 text-[#FF6F3C] font-semibold text-center">Código escaneado: {scanResult}</p>}
      </div>
    </div>
  );
}
