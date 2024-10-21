import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form } from "@remix-run/react";

interface NotificationResponse {
    message: string;
    notification_uuid: string;
    authCode: string;
}

interface StatusResponse {
    status: string;
}

async function sendNotification(email: string): Promise<NotificationResponse> {
    const response = await fetch("/api/user/login/notification", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error("Failed to send notification");
    }

    return response.json();
}

async function checkNotificationStatus(): Promise<StatusResponse> {
    const response = await fetch("/api/user/login/notification/status");

    if (!response.ok) {
        throw new Error("Failed to fetch notification status");
    }

    return response.json();
}

export default function PushNotificationLogin() {
    const [email, setEmail] = useState<string>("");
    const [notificationAuthCode, setNotificationAuthCode] = useState<string>();
    const [checkStatus, setCheckStatus] = useState<boolean>(false);

    const notificationMutation = useMutation<NotificationResponse, Error, string>({
        mutationFn: sendNotification,
        onSuccess: (data) => {
            setNotificationAuthCode(data.authCode);
            console.log("Notification sent:", data);
            setCheckStatus(true);
        },
        onError: (error) => {
            console.error("Error sending notification:", error.message);
        },
    });

    const checkNotificationLoginQuery = useQuery<StatusResponse, Error>({
        queryKey: ["notificationStatus"],
        queryFn: checkNotificationStatus,
        refetchInterval: checkStatus ? 5000 : false,
        enabled: checkStatus,
    });

    if (checkNotificationLoginQuery.data?.status === "approved") {
        window.location.href = "/dashboard";
    }

    if (checkNotificationLoginQuery.data?.status === "rejected") {
        alert("Login rejected by logined device");
        window.location.href = "/login";
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        notificationMutation.mutate(email);
    };

    return (
        <div className="text-black">
            <p className="mb-2">Login via Push Notification</p>

            <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    className="px-4 py-2 border w-full rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
                    value={email}
                    onChange={handleChange}
                />

                {notificationMutation.isError && (
                    <p className="text-red-500">Error: {notificationMutation.error?.message}</p>
                )}

                <button
                    className="px-6 py-2 mt-4 w-full bg-black text-white rounded hover:bg-gray-800"
                    type="submit"
                    disabled={notificationMutation.isPending}
                >
                    {notificationMutation.isPending ? "Sending..." : "Send Notification"}
                </button>
            </Form>
            {notificationAuthCode && (
                <p className="font-bold mt-4 text-black">
                    Auth Code: {notificationAuthCode}
                </p>
            )}

            {checkNotificationLoginQuery.isFetching && <p>Checking notification status...</p>}
        </div>
    );
}
