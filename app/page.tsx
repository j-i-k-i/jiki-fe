import ExercisePath from "@/components/index-page/exercise-path/ExercisePath";
import InfoPanel from "@/components/index-page/info-panel/InfoPanel";
import Sidebar from "@/components/index-page/sidebar/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="exercises" />
      <main className="w-2/4 p-6">
        <ExercisePath />
      </main>
      <InfoPanel />
    </div>
  );
}
