import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

interface StatusResponse {
    status: string;
    message?: string;
}

interface QRCodeResponse {
    message: string;
    qr_uuid?: string;
    authCode?: string;
}

const checkQRCodeStatus = async (): Promise<StatusResponse> => {
    const response = await fetch("/api/user/login/qrcode/status");

    if (!response.ok) {
        throw new Error("Failed to fetch QR code status");
    }

    return response.json();
};


export default function QRCodeLogin() {
    const [qrCode, setQrCode] = useState<string>("");
    const [checkStatus, setCheckStatus] = useState<boolean>(false);

    const requestQrCodeMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/user/login/qrcode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch QR code");
            }

            const data = await response.json();
            return data as QRCodeResponse;
        },
        onSuccess: (data) => {
            setQrCode(`${data.qr_uuid}:${data.authCode}`);
            setCheckStatus(true);
        },
        onError: (error) => {
            console.error("Error fetching QR code:", error.message);
        },
    });

    const checkQRCodeLoginQuery = useQuery<StatusResponse, Error>({
        queryKey: ["qrcodeStatus"],
        queryFn: checkQRCodeStatus,
        refetchInterval: checkStatus ? 5000 : false,
        enabled: checkStatus,
    });

    if (checkQRCodeLoginQuery.data?.status === "approved") {
        window.location.href = "/dashboard";
    }

    if (checkQRCodeLoginQuery.data?.status === "rejected") {
        alert("Login rejected by logined device");
        window.location.href = "/login";
    }

    return (
        <div className="text-black">
            <p>Scan the QR code to login</p>
            <div className="mt-4">
                {qrCode ? (
                    <>
                        <QRCodeSVG value={qrCode} size={200} />
                        {checkStatus && <p className="text-center mt-2">Status: {checkStatus}</p>}
                    </>
                ) : (
                    <button
                        onClick={() => requestQrCodeMutation.mutate()}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                        Generate QR Code
                    </button>
                )}
            </div>
        </div>
    );
}
