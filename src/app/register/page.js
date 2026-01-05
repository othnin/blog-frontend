import RegisterForm from '@/components/RegisterForm';

export const metadata = {
  title: 'Register | Blog',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RegisterForm />
    </div>
  );
}
