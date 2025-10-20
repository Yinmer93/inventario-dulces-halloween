import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

export default function BarcodeScanner({ onDetected }) {
  const [error, setError] = useState(null);

  const handleManualInput = () => {
    const manualCode = prompt("Ingrese el código de barras manualmente:");
    if (manualCode && manualCode.trim() !== "") {
      onDetected(manualCode.trim());
    }
  };

  return (
    <div className="flex flex-col items-center">
      <BarcodeScannerComponent
        width={400}  // Área de video más grande
        height={400}
        onUpdate={(err, result) => {
          if (err) {
            setError(err.message);
          }
          if (result) {
            onDetected(result.text);
          }
        }}
        constraints={{ video: { facingMode: "environment" } }} // Forzar cámara trasera
      />

      <button
        onClick={handleManualInput}
        className="mt-2 px-3 py-1 bg-blue-500 rounded text-white"
      >
        ✏️ Ingresar código manualmente
      </button>

      {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
    </div>
  );
}
