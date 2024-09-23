import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Authorization System" },
    { name: "description", content: "COMP4334 Final Project Team4: Authorization System" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-black">Authorization System</h1>
        <p className="text-gray-700 mb-8">
          COMP4334 Team 4 Final Project
        </p>
        <div className="space-x-4 mb-8 pb-4">
          <Link to="/login">
            <button className="px-6 py-2 bg-black text-white rounded hover:bg-black transition duration-300">
              Login
            </button>
          </Link>

          <Link to="/signup">
            <button className="px-6 py-2 bg-gray-100 text-black rounded hover:bg-gray-200 transition duration-300">
              Signup
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
