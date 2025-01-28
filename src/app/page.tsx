import Navbar from "@/components/navbar";
import { addMarket, Market } from "@/lib/addMarket";
import supabase from "@/lib/supabase/createClient";

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log(user.id);
  }
  return user ? user.id : null;
};

export default function Home() {
  const handleAddMarket = async () => {
    const userId = await getUserId();
    if (!userId) {
      alert("User is not logged in.");
      return;
    }

    const market: Market = {
      creator_id: userId,
      name: "Test Market",
      description: "This is a test market created by the button",
      token_pool: 100,
      market_maker: "CPMM",
    };

    try {
      const result = await addMarket(market);
      console.log("Market added successfully:", result);
      alert("Market added successfully!");
    } catch (error) {
      console.error("Error adding market:", error);
      alert("Failed to add market. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-start h-screen w-screen p-4">
      <Navbar />
      <button
        onClick={handleAddMarket}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
      >
        Add Market
      </button>
    </div>
  );
}
