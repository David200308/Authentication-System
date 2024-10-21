import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { startRegistration } from '@simplewebauthn/browser';
import { useState } from 'react';

interface SetupPasskeyDialogProps {
  open: boolean;
  closeDialog: () => void;
}

export function SetupPasskeyDialog({ open, closeDialog }: SetupPasskeyDialogProps) {
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  const handleSetupPasskey = async () => {
    try {
      setMessage('Initiating passkey setup...');
      setIsError(false);

      const response = await fetch('/api/user/request/passkey/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rPasskey: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to get registration options from server');
      }
      const res = await response.json();
      if (!res.status && !res.passkeyOptions) {
        throw new Error('Passkey setup failed');
      }

      const challenge: string = res.challenge;
      const attestationResponse = await startRegistration({
        optionsJSON: res.passkeyOptions
      });

      const verificationResponse = await fetch('/api/user/request/passkey/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passkeyOptions: attestationResponse,
          challenge
        }),
      });

      if (verificationResponse.ok) {
        const data = await verificationResponse.json();
        if (!data.verified) {
          throw new Error('Passkey setup failed during verification');
        }
        setMessage('Passkey setup successful');
      } else {
        throw new Error('Passkey setup failed during verification');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
      setIsError(true);
    }
  };

  return (
    <Dialog open={open} onClose={closeDialog} className="relative z-50 text-black">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true"></div>

      {/* Centered panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-6 border bg-white p-12 rounded-md shadow-md">
          <DialogTitle className="font-bold text-2xl">Setup Passkey</DialogTitle>
          <div className="space-y-6">
            <p className="text-gray-700">
              Set up a passkey for enhanced security. You can use biometrics like Face ID, Touch ID, or a security key.
            </p>

            {message && (
              <p className={isError ? 'text-red-500' : 'text-green-500'}>{message}</p>
            )}

            <button
              className="px-6 py-2 w-full bg-black text-white rounded hover:bg-gray-800"
              onClick={handleSetupPasskey}
            >
              Setup Passkey
            </button>
          </div>

          <button
            className="px-6 py-2 w-full bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mt-4"
            onClick={closeDialog}
          >
            Cancel
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
