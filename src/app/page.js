"use client"
import useSWR from 'swr';
import { useAuth } from '@/components/authProvider';

const fetcher = (...args) => fetch(...args).then(res => res.json())

export default function Home() {
  const auth = useAuth()
  const {data} = useSWR("/api/hello", fetcher)

  return (
    <div className="flex flex-col items-center justify-center p-24 gap-8">
      <div>{data && data.apiEndpoint}</div>
      <div>
        {auth.isAuthenticated ? "Hello user" : "Hello guest"}
      </div>
    </div>
  );
}
