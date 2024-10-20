import { useState, useRef, useEffect } from "react";
// eslint-disable-next-line import/no-unresolved
import { Setup2FADialog } from "~/components/Setup2FADialog";
import QrScanner from "qr-scanner";
import { useNavigate } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";

interface User {
    id: string;
    username: string;
    email: string;
}

interface Logs {
    "log_id": number;
    "user_id": number;
    "log_time": Date;
    "content": string;
}

interface Notification {
    notification_id: number;
    user_id: number;
    notification_uuid: string;
    sentNotificationDeviceName: string;
    sentNotificationLocation: string;
    sentNotificationAt: Date;
    sentNotificationIp: string;
    receiverAction: string;
    receiverActionAt: Date;
    authCode: string;
    alreadyUsed: boolean;
}

async function verifyToken() {
        const response = await fetch("/api/user/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "type": "token"
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to verify token");
    }

    return response.json();
}

async function checkNewNotificationLogin() {
    const response = await fetch("/api/user/login/notification");

    if (!response.ok) {
        throw new Error("Failed to fetch notification status");
    }

    return response.json();
}

export default function Dashboard() {
    const [user, setUser] = useState<User>({
        id: "",
        username: "",
        email: "",
    });
    const [open, setOpen] = useState(false);
    const [qrScanResult, setQrScanResult] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [logs, setLogs] = useState<Logs[]>([]);

    const navigate = useNavigate();

    const fetchLogs = async () => {
        const logsResponse = await fetch('/api/user/logs');
        if (!logsResponse.ok) {
            throw new Error("Failed to fetch logs");
        }
        const logsData = await logsResponse.json();
        setLogs(logsData);
    };

    useEffect(() => {
        verifyToken().then((data) => {
            if (data.isValid) {
                setUser(data.user);
                fetchLogs();
            }
        }).catch((error) => {
            console.log("Failed to verify token:", error);
            navigate('/login');
        });
        return () => {
            stopQrScanner();
        };
    });

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

    const checkNotificationLoginQuery = useQuery<Notification, Error>({
        queryKey: ["notificationStatus"],
        queryFn: checkNewNotificationLogin,
        refetchInterval: 5000,
        enabled: true,
    });

    if (checkNotificationLoginQuery.data && checkNotificationLoginQuery.data.notification_uuid) {
        const action = confirm(`
            New login notification request from device ${checkNotificationLoginQuery.data.sentNotificationDeviceName} at ${checkNotificationLoginQuery.data.sentNotificationLocation} received. Do you want to proceed?
        `);
        if (action) {
            const authCode = prompt("Enter the auth code");
            if (authCode) {
                fetch("/api/user/login/notification/action", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "approved",
                        notification_uuid: checkNotificationLoginQuery.data.notification_uuid,
                        authCode,
                    }),
                })
                .then(response => {
                    if (response.ok) {
                        alert("Login approved");
                    } else {
                        alert("Failed to approve login");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    alert("An error occurred while approving the login.");
                });
            }
        } else {
            fetch("/api/user/login/notification/action", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "rejected",
                    notification_uuid: checkNotificationLoginQuery.data.notification_uuid,
                }),
            })
            .then(response => {
                if (response.ok) {
                    alert("Login rejected");
                } else {
                    alert("Failed to reject login");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred while rejecting the login.");
            });
        }
    }

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

            <div className="mt-8 p-6 shadow-lg rounded-lg text-black">
                <h2 className="text-3xl font-bold mb-4">User Logs</h2>
                <ul className="mt-4 space-y-4">
                    {logs && logs.map((log, index) => (
                        <li key={index} className="p-4 border-l-4 border-gray-400 rounded-lg">
                            <span className="font-semibold">Log Time:</span> <span>{
                                log.log_time.toISOString().split("T")[0] + " " + log.log_time.toISOString().split("T")[1].split(".")[0]
                            }</span>
                            <br />
                            <span className="font-semibold">Content:</span> <span>{log.content}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
