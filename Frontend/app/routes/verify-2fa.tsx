import { Form, useNavigate } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface Verify2FAData {
    code: string;
}

interface VerifyResponse {
    message: string;
    status?: boolean;
}

async function verify2FA(data: Verify2FAData): Promise<VerifyResponse> {
    const response = await fetch("/api/user/mfa/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to login");
    }

    return response.json();
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

export default function NormalLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Verify2FAData>({
        code: "",
    });

    const verify2FAMutation = useMutation<VerifyResponse, Error, Verify2FAData>({
        mutationFn: verify2FA,
        onSuccess: (data: VerifyResponse) => {
            console.log("User logged in successfully:", data);
            if (data.status) {
                window.location.href = "/dashboard";
                return;
            }
            alert(data.message);
            window.location.reload();
        },
        onError: (error: Error) => {
            console.error("Error verify in:", error.message);
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        verify2FAMutation.mutate(formData);
    };

    useEffect(() => {
        verifyToken().then((data) => {
            if (data.isValid) {
                navigate('/dashboard');
            }
            if (data.usage !== "mfa verification") {
                navigate('/login');
            }
        }).catch(() => {
            console.log("need to login");
        });
    }, []);

    return (
        <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <input
                    type="text"
                    name="code"
                    placeholder="2FA OTP Code"
                    className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
                    value={formData.code}
                    onChange={handleChange}
                />
            </div>

            {verify2FAMutation.isPending && <p>Verifying in...</p>}
            {verify2FAMutation.isError && <p className="text-red-500">Error: {verify2FAMutation.error.message}</p>}

            <button className="px-6 py-2 w-full bg-black text-white rounded hover:bg-gray-800" type="submit" disabled={verify2FAMutation.isPending}>
                Verify
            </button>
        </Form>
    );
}
