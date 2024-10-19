import { Form } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
}

async function loginUser(data: LoginData): Promise<LoginResponse> {
  const response = await fetch("/user/login/password", {
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

export default function NormalLogin() {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });

  const loginMutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: loginUser,
    onSuccess: (data: LoginResponse) => {
      console.log("User logged in successfully:", data);
      // Store the token in localStorage or another appropriate place
      localStorage.setItem("authToken", data.token);
      window.location.href = "/dashboard"; // Redirect after successful login
    },
    onError: (error: Error) => {
      console.error("Error logging in:", error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
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
        />
      </div>

      {loginMutation.isPending && <p>Logging in...</p>}
      {loginMutation.isError && <p className="text-red-500">Error: {loginMutation.error.message}</p>}

      <button className="px-6 py-2 w-full bg-black text-white rounded hover:bg-gray-800" type="submit" disabled={loginMutation.isPending}>
        Login
      </button>
    </Form>
  );
}
