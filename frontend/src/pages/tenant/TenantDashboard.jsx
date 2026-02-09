import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tenantService from "../../services/tenantService";
import toast from "react-hot-toast";
import GoldButton from "../../components/ui/GoldButton";
import ContactModal from "../../components/common/ContactModal";
import InputField from "../../components/ui/InputField";
import SidebarItem from "../../components/common/SidebarItem";
import StaffManagementTab from "../../components/tenantAdmin/StaffManagementTab";
import PlayersManagementTab from "../../components/tenantAdmin/PlayersManagementTab";
import JackpotManagementTab from "../../components/tenantAdmin/JackpotManagementTab";
import GameManagementTab from "../../components/tenantAdmin/GameManagementTab";
import CampaignManagementTab from "../../components/tenantAdmin/CampaignManagementTab";
import PlayerApprovalsTab from "../../components/tenantAdmin/PlayerApprovalsTab";
import KYCSubmissionTab from "../../components/tenantAdmin/KYCSubmissionTab";
import UpdateDefaultsTab from "../../components/tenantAdmin/UpdateDefaultsTab";
import {
  Users,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Briefcase,
  Lock,
  UserPlus,
  Gamepad2,
  Gift,
  Trophy,
  HelpCircle,
} from "lucide-react";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("kyc-submission");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [tenantProfile, setTenantProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: "", new: "" });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    default_daily_bet_limit: "",
    default_daily_loss_limit: "",
    default_max_single_bet: "",
  });

  // const [myKycForm, setMyKycForm] = useState({
  //   type: "BUSINESS_LICENSE",
  //   url: "",
  // });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await tenantService.getTenantProfile();
      setTenantProfile(res.data);
      const approved =
        res.data.kyc_status === "VERIFIED" ||
        res.data.kyc_status === "APPROVED";
      setIsApproved(approved);
      if (!approved) setActiveTab("kyc-submission");

      if (res.data) {
        setSettingsForm({
          default_daily_bet_limit: res.data.default_daily_bet_limit || 1000,
          default_daily_loss_limit: res.data.default_daily_loss_limit || 500,
          default_max_single_bet: res.data.default_max_single_bet || 100,
        });
      }
    } catch (err) {
      if (err.response?.status === 401) navigate("/auth");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await tenantService.updateMyPassword(passwordForm.old, passwordForm.new);
      toast.success("Password Updated! Login again.");
      localStorage.clear();
      navigate("/auth");
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#040029] text-white overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#040029] border-b border-white/10 flex items-center px-4 z-40 justify-between shadow-lg">
        <span className="text-xl font-display text-casino-gold tracking-wider">
          TENANT ADMIN
        </span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white p-2 rounded hover:bg-white/10"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#040029] border-r border-white/20 p-6 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-display text-casino-gold block">
              DASHBOARD
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="px-3 py-2 bg-white/10 rounded border border-white/10">
            <p className="text-xs text-gray-300 uppercase">Status</p>
            <p
              className={`font-bold ${isApproved ? "text-green-400" : "text-yellow-400"}`}
            >
              {tenantProfile?.kyc_status || "LOADING..."}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-3 min-h-0 custom-scrollbar pr-2">
          <SidebarItem
            icon={<Briefcase size={20} />}
            label="KYC Submission"
            active={activeTab === "kyc-submission"}
            onClick={() => changeTab("kyc-submission")}
          />
          {isApproved ? (
            <>
              <SidebarItem
                icon={<Settings size={20} />}
                label="Global Settings"
                active={activeTab === "settings"}
                onClick={() => changeTab("settings")}
              />
              <SidebarItem
                icon={<Gamepad2 size={20} />}
                label="Games"
                active={activeTab === "games"}
                onClick={() => changeTab("games")}
              />
              <SidebarItem
                icon={<Gift size={20} />}
                label="Campaigns"
                active={activeTab === "campaigns"}
                onClick={() => changeTab("campaigns")}
              />
              <SidebarItem
                icon={<Trophy size={20} />}
                label="Jackpots"
                active={activeTab === "jackpots"}
                onClick={() => changeTab("jackpots")}
              />

              <div className="pt-4 pb-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                Management
              </div>
              <SidebarItem
                icon={<Shield size={20} />}
                label="KYC Review"
                active={activeTab === "approvals"}
                onClick={() => changeTab("approvals")}
              />
              <SidebarItem
                icon={<Users size={20} />}
                label="Players"
                active={activeTab === "players"}
                onClick={() => changeTab("players")}
              />
              <SidebarItem
                icon={<UserPlus size={20} />}
                label="Staff / Team"
                active={activeTab === "staff"}
                onClick={() => changeTab("staff")}
              />

              <div className="pt-4 pb-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                Profile
              </div>
              <SidebarItem
                icon={<Lock size={20} />}
                label="My Password"
                active={activeTab === "change-password"}
                onClick={() => changeTab("change-password")}
              />
            </>
          ) : (
            <div className="mt-8 p-4 border border-red-500/30 bg-red-500/20 rounded text-sm text-white">
              <Lock size={16} className="inline mb-1 text-red-400" /> Locked
            </div>
          )}
        </nav>

        <div className="flex-shrink-0 pt-4 border-t border-white/20 mt-2 space-y-2">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <HelpCircle size={20} />
            <span>Contact Admin</span>
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              navigate("/auth");
            }}
            className="flex items-center text-casino-red gap-2 w-full p-3 hover:bg-red-900/10 rounded transition-colors hover:cursor-pointer"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full bg-[#040029]">
        {activeTab === "games" && isApproved && <GameManagementTab />}
        {activeTab === "campaigns" && isApproved && <CampaignManagementTab />}
        {activeTab === "jackpots" && isApproved && <JackpotManagementTab />}
        {activeTab === "approvals" && isApproved && <PlayerApprovalsTab />}
        {activeTab === "players" && isApproved && <PlayersManagementTab />}
        {activeTab === "staff" && isApproved && <StaffManagementTab />}
        {activeTab === "kyc-submission" && (
          <KYCSubmissionTab tenantProfile={tenantProfile} />
        )}
        {activeTab === "settings" && isApproved && (
          <UpdateDefaultsTab
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
          />
        )}

        {activeTab === "change-password" && isApproved && (
          <div className="max-w-xl mx-auto bg-white/5 p-6 rounded border border-white/10">
            <h2 className="text-xl text-casino-gold mb-4">My Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative">
                <InputField
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Old"
                  value={passwordForm.old}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, old: e.target.value })
                  }
                />
              </div>
              <div className="relative">
                <InputField
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New"
                  value={passwordForm.new}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new: e.target.value })
                  }
                />
              </div>
              <GoldButton fullWidth type="submit">
                Update
              </GoldButton>
            </form>
          </div>
        )}
      </main>

      <ContactModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        userRole="TENANT_ADMIN"
      />
    </div>
  );
};

export default TenantDashboard;
