import { Suspense } from "react";
import { LoginForm } from "@/components/AuthForm";
export const metadata = { title: "Login" };
export default function LoginPage() {
  return (
    <main className="container-x flex justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to manage enquiries, products and quotes.</p>
        <Suspense><LoginForm /></Suspense>
      </div>
    </main>
  );
}
