"use client";
import React, { Suspense, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const endpoint = isLogin ? "/user/login" : "/user/register";
    const body = isLogin
      ? { username, password }
      : { username, email, password };
    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          isLogin
            ? "Login successful!"
            : data.message || "Registered successfully!"
        );
        // If registering, take user to onboarding welcome page; otherwise honor nextPath
        if (!isLogin) {
          router.push("/welcome");
        } else {
          router.push(nextPath);
        }
      } else {
        setMessage(data.error || data.message || "Something went wrong");
      }
    } catch {
      setMessage("Network error");
    }
  };

  // const handleGoogle = () => {
  //   window.location.href = 'http://localhost:3001/user/google';
  // };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: "url(/stars.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mb-4 px-2 flex items-center justify-center"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>
          <CardTitle className="text-2xl font-bold mb-6 text-center text-blue-700">
            {isLogin ? "Sign In" : "Register"}
          </CardTitle>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block font-medium mb-1 text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                />
              </div>
            )}
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="default"
              size="default"
            >
              {isLogin ? "Sign In" : "Register"}
            </Button>
          </form>
          <Button
            type="button"
            variant="link"
            className="w-full mt-2"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Need an account? Register"
              : "Already have an account? Sign In"}
          </Button>
          {message && (
            <p className="text-red-500 mt-2 font-medium text-center">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-6 text-blue-500">Loading…</div>}>
      <AuthForm />
    </Suspense>
  );
}
