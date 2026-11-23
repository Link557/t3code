import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { expect, vi } from "vite-plus/test";
import { it } from "@effect/vitest";

import { DesktopAssets } from "../../app/DesktopAssets.ts";
import * as Env from "../../app/DesktopEnvironment.ts";
import * as Config from "../../app/DesktopConfig.ts";
import * as Path from "effect/Path";
import * as ElectronApp from "../../electron/ElectronApp.ts";
import * as Settings from "../../settings/DesktopAppSettings.ts";
import { DesktopWindow } from "../../window/DesktopWindow.ts";
import * as Ipc from "../DesktopIpc.ts";
import { SET_USAGE_TRAY_ENABLED_CHANNEL } from "../channels.ts";
import { installUsageTray } from "./usageTray.ts";

const native = vi.hoisted(() => ({
  listeners: new Map<string, () => void>(),
  create: vi.fn(),
  destroy: vi.fn(),
  setToolTip: vi.fn(),
  on: vi.fn<(event: string, click: () => void) => void>(),
  menu: vi.fn<(items: { label: string; click: () => void }[]) => void>(),
}));
vi.mock("electron", () => ({
  app: {
    on: (event: string, listener: () => void) => native.listeners.set(event, listener),
    removeListener: (event: string) => native.listeners.delete(event),
  },
  Tray: class {
    constructor(icon: string) {
      native.create(icon);
    }
    destroy = native.destroy;
    setToolTip = native.setToolTip;
    on = native.on;
    setContextMenu = vi.fn();
  },
  Menu: { buildFromTemplate: native.menu },
}));

it.effect.each([
  { platform: "win32", quit: true, fail: false },
  { platform: "win32", quit: false, fail: false },
  { platform: "win32", quit: false, fail: true },
  { platform: "darwin", quit: false, fail: false },
  { platform: "linux", quit: false, fail: false },
] as const)(
  "owns the optional Usage tray on $platform (quit=$quit, fail=$fail)",
  ({ platform, quit, fail }) =>
    Effect.gen(function* () {
      vi.clearAllMocks();
      const handlers = new Map<string, Ipc.DesktopIpcHandleListener>();
      const dispatchMenuAction = vi.fn(() => Effect.void);
      if (fail) {
        native.setToolTip.mockImplementationOnce(() => {
          throw new Error("native tray failure");
        });
      }
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* installUsageTray();
          if (platform !== "win32") {
            expect(native.create).not.toHaveBeenCalled();
            return;
          }
          expect(native.create.mock.calls).toEqual([["app.ico"]]);
          expect(native.setToolTip).toHaveBeenCalledWith(
            (yield* Env.DesktopEnvironment).displayName,
          );
          if (fail) {
            expect(native.destroy).toHaveBeenCalledTimes(1);
            expect(native.menu).not.toHaveBeenCalled();
            vi.clearAllMocks();
          }
          const toggle = (enabled: boolean) =>
            Effect.promise(() =>
              Promise.resolve(
                handlers.get(SET_USAGE_TRAY_ENABLED_CHANNEL)!({ sender: { id: 1 } }, enabled),
              ),
            );
          yield* toggle(true);
          expect(native.create).toHaveBeenCalledTimes(1);
          const [event, click] = native.on.mock.calls[0]!;
          expect(event).toBe("click");
          click();
          const [items] = native.menu.mock.calls[0]!;
          expect(items.map((item) => item.label)).toEqual(["Open Usage"]);
          items[0]!.click();
          expect(dispatchMenuAction.mock.calls).toEqual([
            ["open-usage", { reveal: true }],
            ["open-usage", { reveal: true }],
          ]);
          yield* toggle(false);
          expect(native.destroy).toHaveBeenCalledTimes(1);
          yield* toggle(true);
          expect(native.create).toHaveBeenCalledTimes(2);
          if (quit) native.listeners.get("before-quit")!();
          expect(native.destroy).toHaveBeenCalledTimes(quit ? 2 : 1);
        }),
      ).pipe(
        Effect.provide([
          Env.layer({
            dirname: "/repo",
            homeDirectory: "/home",
            platform,
            processArch: "x64",
            appVersion: "1.0.0",
            appPath: "/repo",
            isPackaged: true,
            resourcesPath: "/resources",
            runningUnderArm64Translation: false,
          }).pipe(Layer.provide([Path.layer, Config.layerTest({})])),
          Layer.mock(DesktopAssets, {
            iconPaths: Effect.succeed({
              ico: Option.some("app.ico"),
              png: Option.none(),
              icns: Option.none(),
            }),
          }),
          Layer.mock(DesktopWindow, { dispatchMenuAction }),
          ElectronApp.layer,
          Settings.layerTest({ ...Settings.DEFAULT_DESKTOP_SETTINGS, usageTrayEnabled: true }),
          Ipc.layerTest({
            handle: (channel, handler) => handlers.set(channel, handler),
            removeHandler: vi.fn(),
            on: vi.fn(),
            removeAllListeners: vi.fn(),
          }),
        ]),
      );
      expect(native.destroy).toHaveBeenCalledTimes(platform === "win32" ? 2 : 0);
    }),
);
