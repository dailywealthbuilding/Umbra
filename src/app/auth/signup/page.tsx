// Destination: app/auth/signup/page.tsx
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'UMBRA — Founding Access',
};

export default function SignupPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="signup" />
      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: #030305;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
      `}</style>
    </main>
  );
}
