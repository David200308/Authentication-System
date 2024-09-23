import { Form } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface SignupData {
  name: string;
  email: string;
  password: string;
}

async function signupUser(data: SignupData): Promise<void> {
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to signup");
  }

  return response.json();
}

export default function Signup() {
  const [formData, setFormData] = useState<SignupData>({
    name: "",
    email: "",
    password: "",
  });

  const signupMutation = useMutation<void, Error, SignupData>({
    mutationFn: signupUser,
    onSuccess: (data) => {
      console.log("User signed up successfully:", data);
      // Handle 
    },
    onError: (error: Error) => {
      console.error("Error signing up:", error.message);
      // Handle 
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
          <div>
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="px-4 py-2 border rounded w-80 mb-2 bg-white text-black focus:outline-none focus:ring focus:border-blue-300"
              value={formData.name}
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
            />
          </div>

          {signupMutation.isPending && <p>Signing up...</p>}
          {signupMutation.isError && <p className="text-red-500">Error: {signupMutation.error.message}</p>}

          <button className="px-6 py-2 w-80 bg-black text-white rounded hover:bg-gray-800" type="submit" disabled={signupMutation.isPending}>
            Signup
          </button>
        </Form>
      </div>
    </div>
  );
}