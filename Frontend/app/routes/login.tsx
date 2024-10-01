import { useState } from "react";
import { Form } from "@remix-run/react";
import { LockClosedIcon, QrCodeIcon, BellIcon } from "@heroicons/react/24/outline";
// import { useMutation } from "@tanstack/react-query";

// const validateEmail = (email: string) => {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// };

export default function Login() {
  const [loginMethod, setLoginMethod] = useState("password");
  // const [email, setEmail] = useState("");
  // const [emailError, setEmailError] = useState("");

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>, method: string) => {
    if (event.key === "Enter" || event.key === " ") {
      setLoginMethod(method);
    }
  };

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
              className={`h-10 w-10 ${
                loginMethod === "password" ? "text-black" : "text-gray-700"
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
              className={`h-10 w-10 ${
                loginMethod === "qr" ? "text-black" : "text-gray-700"
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
              className={`h-10 w-10 ${
                loginMethod === "notification" ? "text-black" : "text-gray-700"
              } hover:text-black`}
            />
            <span className="mt-2 text-sm text-gray-700">Notification</span>
          </div>
        </div>

        {loginMethod === "password" && (
          <Form method="post" className="space-y-4">
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <button className="px-6 py-2 w-full bg-black text-white rounded hover:bg-gray-800">
              Login
            </button>
          </Form>
        )}

        {loginMethod === "qr" && (
          <div className="text-black">
            <p>Scan the QR code to login</p>
            <div className="mt-4">
                {/* QR Code */}
            </div>
          </div>
        )}

        {loginMethod === "notification" && (
          <div className="text-black">
            <p>Login via Notification</p>
            <p className="mt-4">A login notification has been sent to your logined device.</p>

            <input 
              type="email" 
              placeholder="Email"
              className="px-4 py-2 mt-4 border w-full rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300" 
            />

            <button className="px-6 py-2 mt-4 w-full bg-black text-white rounded hover:bg-gray-800">
              Send Notification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
