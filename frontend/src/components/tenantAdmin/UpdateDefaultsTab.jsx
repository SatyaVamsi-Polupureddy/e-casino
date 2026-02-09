import { useState, useEffect } from "react";
import tenantService from "../../services/tenantService";
import toast from "react-hot-toast";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";

const UpdateDefaultsTab = ({ settingsForm, setSettingsForm }) => {
  // const [settingsForm, setSettingsForm] = useState({
  //   default_daily_bet_limit: "",
  //   default_daily_loss_limit: "",
  //   default_max_single_bet: "",
  // });
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await tenantService.updateDefaultLimits({
        default_daily_bet_limit: parseFloat(
          settingsForm.default_daily_bet_limit,
        ),
        default_daily_loss_limit: parseFloat(
          settingsForm.default_daily_loss_limit,
        ),
        default_max_single_bet: parseFloat(settingsForm.default_max_single_bet),
      });
      toast.success("Defaults Saved!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white/5 p-6 rounded border border-white/10">
      <h2 className="text-xl text-casino-gold mb-4">Global Limits</h2>
      <form onSubmit={handleUpdateSettings} className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 uppercase block mb-1">
            Default Daily Bet Limit
          </label>
          <InputField
            type="number"
            placeholder="e.g. 1000"
            value={settingsForm.default_daily_bet_limit}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                default_daily_bet_limit: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase block mb-1">
            Default Daily Loss Limit
          </label>
          <InputField
            type="number"
            placeholder="e.g. 500"
            value={settingsForm.default_daily_loss_limit}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                default_daily_loss_limit: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase block mb-1">
            Default Max Single Bet
          </label>
          <InputField
            type="number"
            placeholder="e.g. 100"
            value={settingsForm.default_max_single_bet}
            onChange={(e) =>
              setSettingsForm({
                ...settingsForm,
                default_max_single_bet: e.target.value,
              })
            }
          />
        </div>
        <GoldButton fullWidth type="submit">
          Save
        </GoldButton>
      </form>
    </div>
  );
};

export default UpdateDefaultsTab;
