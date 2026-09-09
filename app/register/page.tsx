import { RegisterForm } from "@/components/AuthForm";
export const metadata = { title: "Create buyer account" };
export default function RegisterPage() {
  return (
    <main className="container-x flex justify-center py-12">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold">Create your buyer account</h1>
        <p className="mb-6 text-sm text-slate-500">Track quotes, compare vendors and manage enquiries in one place.</p>
        <RegisterForm role="buyer" />
      </div>
    </main>
  );
}
