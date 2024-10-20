import { useEffect, useState } from "react";
import { LockClosedIcon, QrCodeIcon, BellIcon } from "@heroicons/react/24/outline";
import NormalLogin from "../components/NormalLogin";
import QRCodeLogin from "../components/QRCodeLogin";
import PushNotificationLogin from "../components/PushNotificationLogin";
import { useNavigate } from "@remix-run/react";

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

export default function Login() {
  const [loginMethod, setLoginMethod] = useState("password");
  const navigate = useNavigate();

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>, method: string) => {
    if (event.key === "Enter" || event.key === " ") {
      setLoginMethod(method);
    }
  };

  useEffect(() => {
    verifyToken().then((data) => {
      if (data.isValid) {
        navigate('/dashboard');
      }
    }).catch(() => {
      console.log("need to login");
    });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-black">Login</h1>

        <div className="flex justify-center space-x-6 mb-8">
          <div
            className="cursor-pointer flex flex-col items-center"
            role="button"
            tabIndex={0}
            onClick={() => setLoginMethod("password")}
            onKeyDown={(event) => handleKeyPress(event, "password")}
          >
            <LockClosedIcon
              className={`h-10 w-10 ${loginMethod === "password" ? "text-black" : "text-gray-700"
                } hover:text-black`}
            />
            <span className="mt-2 text-sm text-gray-700">Password</span>
          </div>

          <div
            className="cursor-pointer flex flex-col items-center"
            role="button"
            tabIndex={0}
            onClick={() => setLoginMethod("qr")}
            onKeyDown={(event) => handleKeyPress(event, "qr")}
          >
            <QrCodeIcon
              className={`h-10 w-10 ${loginMethod === "qr" ? "text-black" : "text-gray-700"
                } hover:text-black`}
            />
            <span className="mt-2 text-sm text-gray-700">QR Code</span>
          </div>

          <div
            className="cursor-pointer flex flex-col items-center"
            role="button"
            tabIndex={0}
            onClick={() => setLoginMethod("notification")}
            onKeyDown={(event) => handleKeyPress(event, "notification")}
          >
            <BellIcon
              className={`h-10 w-10 ${loginMethod === "notification" ? "text-black" : "text-gray-700"
                } hover:text-black`}
            />
            <span className="mt-2 text-sm text-gray-700">Notification</span>
          </div>
        </div>

        {loginMethod === "password" && <NormalLogin />}
        {loginMethod === "qr" && <QRCodeLogin />}
        {loginMethod === "notification" && <PushNotificationLogin />}
      </div>
    </div>
  );
}
