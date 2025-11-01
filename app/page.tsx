import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('@/components/HomeClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Dastar...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <HomeClient />;
}
