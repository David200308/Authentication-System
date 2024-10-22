import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface Setup2FADialogProps {
  open: boolean;
  closeDialog: () => void;
}

export function Setup2FADialog({ open, closeDialog }: Setup2FADialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [otpKey, setOtpKey] = useState<string | null>(null);
  const [startVerify, setStartVerify] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");

  // Enable MFA mutation
  const enableMfaMutation = useMutation<
    { qrCode: string; secret: string },
    Error,
    { rMfa: boolean }
  >({
    mutationFn: async () => {
      const response = await fetch("/api/request/mfa/enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ rMfa: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to enable MFA");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      console.log("MFA enabled successfully:", data);
      setQrCode(data.qrCode);
      setOtpKey(data.secret);
      setStartVerify(false);
    },
    onError: (error) => {
      console.error("Error enabling MFA:", error.message);
    },
  });

  // Verify MFA mutation
  const verifyMfaMutation = useMutation<
    { message: string; status: boolean },
    Error,
    { code: string }
  >({
    mutationFn: async () => {
      const response = await fetch("/api/request/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Invalid MFA code");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      console.log("MFA verified successfully:", data);
      alert("MFA verified successfully");
      closeDialog();
    },
    onError: (error) => {
      console.error("Error verifying MFA:", error.message);
    },
  });

  return (
    <Dialog open={open} onClose={closeDialog} className="relative z-50 text-black">
      <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true"></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-6 border bg-white p-12 rounded-md">
          <DialogTitle className="font-bold text-2xl">Setup 2FA</DialogTitle>
          <div className="space-y-6">
            {!startVerify && qrCode ? (
              <>
                <div className="flex justify-center">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
                <p className="text-center">Scan this QR code with your 2FA app.</p>

                <hr className="border-t-2 border-dashed border-gray-300" />

                <div className="text-center">
                  <p className="font-semibold">Your OTP Key:</p>
                  <p className="font-mono text-lg bg-gray-100 p-2 rounded-md">{otpKey}</p>
                  <p className="text-sm text-gray-500">Use this key if you are unable to scan the QR code.</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setStartVerify(true)}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    Scanned? Next
                  </button>
                  <button
                    onClick={closeDialog}
                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              startVerify && (
                <>
                  <div className="text-center">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter MFA code"
                      className="border p-2 rounded w-full text-center"
                    />
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={closeDialog}
                      className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => verifyMfaMutation.mutate({ code })}
                      className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                      Verify
                    </button>
                  </div>
                </>
              )
            )}

            {!qrCode && (
              <button
                onClick={() => enableMfaMutation.mutate({ rMfa: true })}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
