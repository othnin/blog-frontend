import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password | Blog',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ForgotPasswordForm />
    </div>
  );
}
