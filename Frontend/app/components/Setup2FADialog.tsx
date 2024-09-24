import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { QRCodeSVG } from 'qrcode.react';

interface Setup2FADialogProps {
  open: boolean;
  closeDialog: () => void;
}
const otpSK = "5TDEK75W2MNYCDAM"; // test otp
const appName = "COMP4334 Team 4 - Auth System";

export function Setup2FADialog({ open, closeDialog }: Setup2FADialogProps) {
  const otpAuthUrl = `otpauth://totp/${appName}?secret=${otpSK}&issuer=${appName}`;

  return (
    <Dialog open={open} onClose={closeDialog} className="relative z-50 text-black">
      <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true"></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-6 border bg-white p-12 rounded-md">
          <DialogTitle className="font-bold text-2xl">Setup 2FA</DialogTitle>
          <div className="space-y-6">
            <div className="flex justify-center">
              <QRCodeSVG value={otpAuthUrl} size={200} />
            </div>
            <p className="text-center">Scan this QR code with your 2FA app.</p>

            <hr className="border-t-2 border-dashed border-gray-300" />

            <div className="text-center">
              <p className="font-semibold">Your OTP Key:</p>
              <p className="font-mono text-lg bg-gray-100 p-2 rounded-md">{otpSK}</p>
              <p className="text-sm text-gray-500">Use this key if you are unable to scan the QR code.</p>
            </div>

            <hr className="border-t-2 border-dashed border-gray-300" />

            <div className="flex gap-4 justify-center">
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Scanned? Next
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
