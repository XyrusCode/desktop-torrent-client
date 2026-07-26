import { useTorrentStore } from "@/stores/torrentStore";
import { useTorrentEvents } from "@/hooks/useTorrentEvents";
import { useSettings } from "@/hooks/useSettings";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Dashboard from "@/pages/Dashboard";
import Active from "@/pages/Active";
import Completed from "@/pages/Completed";
import Categories from "@/pages/Categories";
import RSSPanel from "@/pages/RSSPanel";
import SettingsPage from "@/pages/SettingsPage";
import AddTorrentModal from "@/components/AddTorrentModal";

function App() {
  useTorrentEvents();
  useSettings();

  const view = useTorrentStore((s) => s.view);

  const renderPage = () => {
    switch (view) {
      case "active":
        return <Active />;
      case "completed":
        return <Completed />;
      case "categories":
        return <Categories />;
      case "rss":
        return <RSSPanel />;
      case "settings":
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
      <AddTorrentModal />
    </div>
  );
}

export default App;
