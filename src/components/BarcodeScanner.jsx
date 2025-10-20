import { useState, useRef, useEffect } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

export default function BarcodeScanner({ onDetected }) {
  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef(null);

  // Función para activar/desactivar flash si el dispositivo lo permite
  const toggleTorch = async () => {
    if (!videoRef.current) return;
    const stream = videoRef.current.srcObject;
    if (!stream) return;
    const [track] = stream.getVideoTracks();
    if (!track) return;

    const capabilities = track.getCapabilities();
    if ("torch" in capabilities) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.log("No se pudo activar el flash:", e);
      }
    } else {
      alert("Tu dispositivo no soporta flash en la cámara.");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <BarcodeScannerComponent
        width={400}  // Aumentamos ancho
        height={400} // Aumentamos alto
        ref={videoRef} // Referencia para controlar flash
        onUpdate={(err, result) => {
          if (err) {
            setError(err.message);
          }
          if (result) {
            onDetected(result.text);
          }
        }}
        // Forzar cámara trasera en móviles
        constraints={{ video: { facingMode: "environment" } }}
      />
      <button
        onClick={toggleTorch}
        className="mt-2 px-3 py-1 bg-yellow-400 rounded text-black"
      >
        {torchOn ? "💡 Flash On" : "💡 Flash Off"}
      </button>
      {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
    </div>
  );
}
