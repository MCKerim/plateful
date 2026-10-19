import { beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  alarmId,
  dismissExactAlarmHint,
  shouldSuggestExactAlarms,
} from "@/lib/cooking/timerAlarms";

vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: vi.fn(), isNativePlatform: vi.fn(), isPluginAvailable: vi.fn() },
}));
vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: { checkPermissions: vi.fn(), checkExactNotificationSetting: vi.fn() },
}));

describe("alarmId", () => {
  it("is stable, positive and tells timers apart", () => {
    const a = alarmId("eeeeeeee-5555-5555-5555-555555555555");
    expect(alarmId("eeeeeeee-5555-5555-5555-555555555555")).toBe(a);
    expect(a).toBeGreaterThan(0);
    expect(Number.isInteger(a)).toBe(true);
    expect(alarmId("eeeeeeee-5555-5555-5555-555555555556")).not.toBe(a);
  });
});

describe("shouldSuggestExactAlarms", () => {
  function device(platform: string, display: string, exactAlarm: string) {
    vi.mocked(Capacitor.getPlatform).mockReturnValue(platform);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(platform !== "web");
    vi.mocked(Capacitor.isPluginAvailable).mockReturnValue(true);
    vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display } as never);
    vi.mocked(LocalNotifications.checkExactNotificationSetting).mockResolvedValue({
      exact_alarm: exactAlarm,
    } as never);
  }

  beforeEach(() => localStorage.clear());

  it("suggests on Android with notifications on and exact alarms off", async () => {
    device("android", "granted", "denied");
    expect(await shouldSuggestExactAlarms()).toBe(true);
  });

  it("stays quiet once exact alarms are allowed, without notifications, or off Android", async () => {
    device("android", "granted", "granted");
    expect(await shouldSuggestExactAlarms()).toBe(false);
    device("android", "denied", "denied");
    expect(await shouldSuggestExactAlarms()).toBe(false);
    device("ios", "granted", "denied");
    expect(await shouldSuggestExactAlarms()).toBe(false);
  });

  it("never comes back on this device once dismissed", async () => {
    device("android", "granted", "denied");
    dismissExactAlarmHint();
    expect(await shouldSuggestExactAlarms()).toBe(false);
  });
});
