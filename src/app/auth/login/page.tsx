// Destination: app/auth/login/page.tsx
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'UMBRA — Enter',
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="login" />
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
