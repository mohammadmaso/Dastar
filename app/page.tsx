import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

const HomePage = dynamic(() => import('./HomePage'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600">Loading Dastar...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <HomePage />;
}
