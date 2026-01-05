import ResetPasswordForm from '@/components/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password | Blog',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ResetPasswordForm />
    </div>
  );
}
