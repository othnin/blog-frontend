import VerifyEmailForm from '@/components/VerifyEmailForm';

export const metadata = {
  title: 'Verify Email | Blog',
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <VerifyEmailForm />
    </div>
  );
}
