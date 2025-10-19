import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

export default function BarcodeScanner({ onDetected }) {
  const [error, setError] = useState(null);

  return (
    <div>
      <BarcodeScannerComponent
        width={300}
        height={300}
        onUpdate={(err, result) => {
          if (err) {
            setError(err.message);
          }
          if (result) {
            onDetected(result.text);
          }
        }}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
