import { useEffect, useState } from "react";
import { LockClosedIcon, QrCodeIcon, BellIcon } from "@heroicons/react/24/outline";
import NormalLogin from "../components/NormalLogin";
import QRCodeLogin from "../components/QRCodeLogin";
import PushNotificationLogin from "../components/PushNotificationLogin";
import { useNavigate } from "@remix-run/react";
import PasskeyLogin from "../components/PasskeyLogin";

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
  }, [navigate]);

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

          <div
            className="cursor-pointer flex flex-col items-center"
            role="button"
            tabIndex={0}
            onClick={() => setLoginMethod("passkey")}
            onKeyDown={(event) => handleKeyPress(event, "passkey")}
          >
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10"><g fill="#5c5f62"><path d="m17.5313 12.3506c-.3348.239-.4399.7408-.149 1.0317.3411.3411.3411.8943 0 1.2354l-.1752.1752c-.3905.3905-.3905 1.0237 0 1.4142l.0858.0858c.3905.3905.3905 1.0237 0 1.4142l-.9393.9393c-.1953.1953-.5119.1953-.7072 0l-1.3535-1.3535c-.1875-.1875-.2929-.4419-.2929-.7071v-3.9226c-1.1825-.5617-2-1.767-2-3.1632 0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5c0 1.1756-.5796 2.2159-1.4687 2.8506zm-2.0313-4.3506c.5523 0 1 .44772 1 1s-.4477 1-1 1-1-.44772-1-1 .4477-1 1-1z"/><path d="m11.5 5.55556c0 1.96367-1.567 3.55555-3.5 3.55555s-3.5-1.59188-3.5-3.55555c0-1.96368 1.567-3.55556 3.5-3.55556s3.5 1.59188 3.5 3.55556z"/><path d="m3.625 18c-1.44975 0-2.625-1.1939-2.625-2.6667 0-1.4727 1.3125-4.4444 7-4.4444 1.08076 0 2.0035.1073 2.7894.2912.3327.9327.9345 1.737 1.7106 2.3199v4.497c-.0414.002-.0831.003-.125.003z"/></g></svg>
            <span className="mt-2 text-sm text-gray-700">Passkey</span>
          </div>
        </div>

        {loginMethod === "password" && <NormalLogin />}
        {loginMethod === "qr" && <QRCodeLogin />}
        {loginMethod === "notification" && <PushNotificationLogin />}
        {loginMethod === "passkey" && <PasskeyLogin />}
      </div>
    </div>
  );
}
