import { SignUp } from "@clerk/clerk-react";

export default function Signup() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <SignUp routing="path" path="/signup" signInUrl="/login" forceRedirectUrl="/dashboard" />
    </div>
  );
}
