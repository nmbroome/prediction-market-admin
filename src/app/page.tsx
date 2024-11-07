import Navbar from "@/components/navbar";
import CreateMarketForm from "@/components/CreateMarket";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start h-screen w-screen p-4">
      <Navbar />
      <h1 className="text-lg font-bold mb-8">Prediction market testing</h1>
      <CreateMarketForm />
    </div>
  );
}
