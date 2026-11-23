import { DEFAULT_CLIENT_SETTINGS } from "@t3tools/contracts/settings";
import { expect, it, vi } from "vite-plus/test";

import { act, render, stubGlobal } from "../../../test/render";
import "../../index.css";
import { GeneralSettingsPanel } from "./SettingsPanels";
import { SettingsScopeProvider } from "./SettingsScopeContext";

vi.mock("../../env", () => ({ isElectron: true }));

const usageTrayName = "Show Usage in the notification area";

function generalSettings() {
  return (
    <SettingsScopeProvider search={{}} onChange={() => {}}>
      <GeneralSettingsPanel />
    </SettingsScopeProvider>
  );
}

function usageTrayBridge(platform: string, enabled: boolean) {
  return {
    getClientSettings: async () => DEFAULT_CLIENT_SETTINGS,
    getClientPlatform: () => platform,
    getUsageTrayEnabled: () => enabled,
    setUsageTrayEnabled: vi.fn(async (_checked: boolean) => {}),
  };
}

it.each([false, true])(
  "loads the persisted Windows tray preference (%s) and saves a toggle",
  async (enabled) => {
    const bridge = usageTrayBridge("win32", enabled);
    using _bridge = stubGlobal("desktopBridge", bridge);
    using _platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32");
    await using screen = await render(generalSettings());
    const toggle = screen.getByRole("switch", { name: usageTrayName });

    expect(toggle.element().getAttribute("aria-checked")).toBe(String(enabled));
    await act(() => toggle.click());
    expect(bridge.setUsageTrayEnabled).toHaveBeenCalledExactlyOnceWith(!enabled);
    expect(toggle.element().getAttribute("aria-checked")).toBe(String(!enabled));
  },
);

it.each([
  { platform: "win32", browserPlatform: "Linux x86_64", visible: true },
  { platform: "darwin", browserPlatform: "Win32", visible: false },
  { platform: "linux", browserPlatform: "Linux x86_64", visible: false },
  { platform: undefined, browserPlatform: "Win32", visible: false },
])(
  "uses the desktop bridge platform ($platform) to decide whether to show the tray setting",
  async ({ platform, browserPlatform, visible }) => {
    using _bridge = stubGlobal(
      "desktopBridge",
      platform ? usageTrayBridge(platform, false) : undefined,
    );
    using _platform = vi.spyOn(navigator, "platform", "get").mockReturnValue(browserPlatform);
    await using screen = await render(generalSettings());

    expect(screen.getByRole("heading", { name: "Confirmations" }).query()).not.toBeNull();
    expect(screen.getByRole("switch", { name: usageTrayName }).query() !== null).toBe(visible);
  },
);
