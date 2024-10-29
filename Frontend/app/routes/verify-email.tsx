import { Form, useNavigate, useSearchParams } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface VerifyEmailData {
    email: string;
    token: string;
}

interface VerifyResponse {
    message: string;
    status?: boolean;
}

async function verifyEmail(data: VerifyEmailData): Promise<VerifyResponse> {
    const response = await fetch("/api/user/activate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to activate");
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

export default function VerifyEmail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const [formData,] = useState<VerifyEmailData>({
        email: email || "",
        token: token || "",
    });

    const verifyEmailMutation = useMutation<VerifyResponse, Error, VerifyEmailData>({
        mutationFn: verifyEmail,
        onSuccess: (data: VerifyResponse) => {
            console.log("User activate account successfully:", data);
            if (data.status) {
                window.location.href = "/login";
                return;
            }
            alert(data.message);
            window.location.href = "/signup";
        },
        onError: (error: Error) => {
            console.error("Error verify in:", error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        verifyEmailMutation.mutate(formData);
    };

    useEffect(() => {
        verifyToken().then((data) => {
            if (data.isValid) {
                navigate('/dashboard');
            }
            if (data.usage !== "registration in progress") {
                navigate('/signup');
            }
        }).catch(() => {
            console.log("need to login");
        });
    }, [navigate]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="text-center">
                {email && token && (
                    <div>
                        <h1 className="text-4xl font-bold mb-8 text-black">
                            Verify Email
                        </h1>
                        <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <input
                                    type="text"
                                    name="email"
                                    className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
                                    value={formData.email}
                                    disabled
                                />
                            </div>

                            {verifyEmailMutation.isPending && <p>Verifying in...</p>}
                            {verifyEmailMutation.isError && <p className="text-red-500">Error: {verifyEmailMutation.error.message}</p>}

                            <button className="px-6 py-2 w-full bg-black text-white rounded hover:bg-gray-800" type="submit" disabled={verifyEmailMutation.isPending}>
                                Activate
                            </button>
                        </Form>
                    </div>
                )}
            </div>
        </div>
    );
}
