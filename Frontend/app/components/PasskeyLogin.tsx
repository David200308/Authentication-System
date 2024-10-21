import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Form, useNavigate } from "@remix-run/react";
import { startAuthentication } from '@simplewebauthn/browser';
import { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';

interface PasskeyLoginRequestResponse {
    message: string;
    status?: string;
    passkeyOptions?: PublicKeyCredentialRequestOptionsJSON;
}

interface PasskeyLoginVerifyResponse {
    message: string;
    veirfied?: boolean;
}

async function requestPasskeyLogin(email: string): Promise<PasskeyLoginRequestResponse> {
    const response = await fetch("/api/user/login/passkey/request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error("Failed to initiate passkey login");
    }

    return response.json();
}

async function completePasskeyLogin(passkeyOptions: AuthenticationResponseJSON): Promise<PasskeyLoginVerifyResponse> {
    const response = await fetch("/api/user/login/passkey/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(passkeyOptions),
    });

    if (!response.ok) {
        throw new Error("Passkey login verification failed");
    }

    return response.json();
}

export default function PasskeyLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>("");

    const passkeyLoginMutation = useMutation<PasskeyLoginRequestResponse, Error, string>({
        mutationFn: requestPasskeyLogin,
        onSuccess: async (data) => {
            console.log("Login Start Success:", data);
            if (!data.status && !data.passkeyOptions) {
                alert("Passkey login request failed");
                navigate("/login");
                return;
            }
            
            try {
                const passkeyOptions = data.passkeyOptions;
                if (!passkeyOptions) {
                    throw new Error("Passkey options not provided");
                }
                const requestResponse = await startAuthentication({ optionsJSON: passkeyOptions });

                passkeyVerificationMutation.mutate(requestResponse);
            } catch (error) {
                console.error("Error during WebAuthn authentication:", error);
                alert("Passkey login request failed");
                navigate("/login");
            }
        },
        onError: (error) => {
            console.error("Login Start Error:", error.message);
            alert("Passkey login request failed");
            navigate("/login");
        },
    });

    const passkeyVerificationMutation = useMutation<PasskeyLoginVerifyResponse, Error, AuthenticationResponseJSON>({
        mutationFn: completePasskeyLogin,
        onSuccess: (data) => {
            console.log("Login Finish Success:", data);
            if (!data.veirfied) {
                alert("Passkey login failed");
                navigate("/login");
                return;
            }
            navigate("/dashboard");
        },
        onError: (error) => {
            console.log("Login Finish Error:", error.message);
            alert("Passkey login failed");
            navigate("/login");
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passkeyLoginMutation.mutate(email);
    };

    return (
        <div className="text-black">
            <p className="mb-2">Login via Passkey</p>

            <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    className="px-4 py-2 border w-full rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
                    value={email}
                    onChange={handleChange}
                    required
                />

                {passkeyLoginMutation.isError && (
                    <p className="text-red-500">Error: {passkeyLoginMutation.error?.message}</p>
                )}

                <button
                    className="px-6 py-2 mt-4 w-full bg-black text-white rounded hover:bg-gray-800"
                    type="submit"
                    disabled={passkeyLoginMutation.isPending || passkeyVerificationMutation.isPending}
                >
                    {passkeyLoginMutation.isPending || passkeyVerificationMutation.isPending
                        ? "Requesting..."
                        : "Passkey Login"}
                </button>
            </Form>
        </div>
    );
}
