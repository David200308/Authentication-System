import { Form, useNavigate } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { getRecaptchaScore } from "~/utils/getRecaptchaScore";

interface InputData {
  captchaToken: string;
  username: string;
  email: string;
  password: string;
}
interface SignupData {
  username: string;
  email: string;
  password: string;
}
interface SignupResponse {
  message: string;
}

async function signupUser(data: InputData): Promise<SignupResponse> {
  const recaptchaResult = await getRecaptchaScore(data.captchaToken);
  if (recaptchaResult) {
    throw new Error("Verify captcha failed");
  }

  const bodyData: SignupData = {
    username: data.username,
    email: data.email,
    password: data.password
  }
  const response = await fetch(`/api/user/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) {
    throw new Error("Failed to signup");
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

export default function Signup() {
  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      return;
    }

    const token = await executeRecaptcha();
    setCaptchaToken(token);
  }, [executeRecaptcha]);

  const [needVerifyMessage, setNeedVerifyMessage] = useState<string>("");
  const [formData, setFormData] = useState<InputData>({
    captchaToken: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    handleReCaptchaVerify();
    verifyToken().then((data) => {
      if (data.isValid) {
        navigate('/dashboard');
      }
    }).catch(() => {
      console.log("need to login");
    });
  }, [navigate, handleReCaptchaVerify]);

  const signupMutation = useMutation<SignupResponse, Error, InputData>({
    mutationFn: signupUser,
    onSuccess: (data: SignupResponse) => {
      console.log("User signed up successfully:", data);
      if (data.message === "Register successful") {
        setNeedVerifyMessage("Please check your email to verify your account.");
      }
    },
    onError: (error: Error) => {
      console.error("Error signing up:", error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(formData);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-black">Signup</h1>
        <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
          {captchaToken ? <input type="hidden" name="_captcha" value={captchaToken}></input> : null}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Name"
              className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
              value={formData.password}
              onChange={handleChange}
              disabled={signupMutation.isPending || needVerifyMessage !== ""}
            />
          </div>

          {signupMutation.isPending && <p>Signing up...</p>}
          {signupMutation.isError && <p className="text-red-500">Error: {signupMutation.error.message}</p>}

          <button className="px-6 py-2 w-80 bg-black text-white rounded hover:bg-gray-800" type="submit" disabled={signupMutation.isPending}>
            Signup
          </button>
          {needVerifyMessage && <p className="text-gray-700">{needVerifyMessage}</p>}
        </Form>
      </div>
    </div>
  );
}
