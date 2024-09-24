import { useState, useRef, useEffect } from "react";
// eslint-disable-next-line import/no-unresolved
import { Setup2FADialog } from "~/components/Setup2FADialog";
import QrScanner from "qr-scanner";

interface User {
    username: string;
    email: string;
    logs: string[];
}

// testing data
const user: User = {
    username: "Test User",
    email: "test@user.com",
    logs: ["test 1", "test 2", "test 3"],
};

export default function Dashboard() {
    const [open, setOpen] = useState(false);
    const [qrScanResult, setQrScanResult] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);

    const startQrScanner = async () => {
        if (!scannerOpen) {
            setScannerOpen(true);
            setQrScanResult(null);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }

                qrScannerRef.current = new QrScanner(
                    videoRef.current!,
                    result => setQrScanResult(result.data),
                    {
                        onDecodeError: error => console.error("QR code scan error", error),
                    }
                );
                
                qrScannerRef.current.start();
                
            } catch (error) {
                console.error("Camera access denied or not available:", error);
            }
        }
    };

    const stopQrScanner = () => {
        if (scannerOpen) {
            qrScannerRef.current?.stop();
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            setScannerOpen(false);
        }
    };

    useEffect(() => {
        return () => {
            stopQrScanner();
        };
    }, []);

    return (
        <div className="max-w-4xl mx-auto mt-10">
            <h1 className="text-4xl font-bold text-black">Dashboard</h1>

            <div className="mt-8 p-6 bg-white shadow rounded-lg text-black">
                <h2 className="text-2xl font-semibold">User Information</h2>
                <div className="mt-4">
                    <p className="text-lg">
                        <span className="font-medium">Username:</span> {user.username}
                    </p>
                    <p className="text-lg mt-2">
                        <span className="font-medium">Email:</span> {user.email}
                    </p>
                    <button
                        onClick={() => setOpen(true)}
                        className="mt-4 px-6 py-2 w-[40%] bg-black text-white rounded hover:bg-gray-800"
                    >
                        Setup 2FA
                    </button>
                    <Setup2FADialog open={open} closeDialog={() => setOpen(false)} />

                    <div>
                        {scannerOpen && (
                            <div className="mt-6">
                                <video ref={videoRef} style={{ width: "40%", border: "1px solid black" }}>
                                    <track kind="captions" srcLang="en" label="QR Scanner Video" />
                                </video>
                            </div>
                        )}
                        {!scannerOpen && (
                            <button
                                onClick={startQrScanner}
                                className="mt-4 px-6 py-2 w-[40%] bg-black text-white rounded hover:bg-gray-800"
                            >
                                Login via Scan QR Code
                            </button>
                        )}
                        {scannerOpen && (
                            <button
                                onClick={stopQrScanner}
                                className="mt-4 px-6 py-2 w-[40%] bg-gray-100 text-black rounded hover:bg-gray-200"
                            >
                                Close
                            </button>
                        )}
                        {qrScanResult && <p className="text-lg mt-4">Scanned Data: {qrScanResult}</p>}
                    </div>
                </div>
            </div>

            <div className="mt-8 p-6 bg-white shadow rounded-lg text-black">
                <h2 className="text-2xl font-semibold">User Logs</h2>
                <ul className="mt-4 space-y-2">
                    {user.logs.map((log, index) => (
                        <li key={index} className="text-lg text-gray-700">
                            {log}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
