import * as Electron from "electron";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { msg } from "gt-i18n";

import { DesktopAssets } from "../../app/DesktopAssets.ts";
import { DesktopEnvironment } from "../../app/DesktopEnvironment.ts";
import { ElectronApp } from "../../electron/ElectronApp.ts";
import { m, onLocaleChange } from "../../i18n/messages.ts";
import { DesktopAppSettings } from "../../settings/DesktopAppSettings.ts";
import { DesktopWindow } from "../../window/DesktopWindow.ts";
import { GET_USAGE_TRAY_ENABLED_CHANNEL, SET_USAGE_TRAY_ENABLED_CHANNEL } from "../channels.ts";
import { DesktopIpc, makeIpcMethod, makeSyncIpcMethod } from "../DesktopIpc.ts";

class DesktopUsageTrayError extends Schema.TaggedError<DesktopUsageTrayError>()(
  "DesktopUsageTrayError",
  { cause: Schema.Defect() },
) {}

export const installUsageTray = Effect.fn("desktop.ipc.installUsageTray")(function* () {
  const environment = yield* DesktopEnvironment;
  if (environment.platform !== "win32") return;
  const ipc = yield* DesktopIpc;
  const app = yield* ElectronApp;
  const settings = yield* DesktopAppSettings;
  const window = yield* DesktopWindow;
  const { ico } = yield* (yield* DesktopAssets).iconPaths;
  let tray: Electron.Tray | undefined;
  let closing = false;
  const destroy = () => {
    tray?.destroy();
    tray = undefined;
  };
  const close = () => {
    closing = true;
    destroy();
  };
  const runFork = Effect.runForkWith(yield* Effect.context<never>());
  const openUsage = () => {
    runFork(
      window
        .dispatchMenuAction("open-usage", { reveal: true })
        .pipe(Effect.catchCause((cause) => Effect.logError("Could not open Usage", cause))),
    );
  };
  const updateMenu = () =>
    tray?.setContextMenu(
      Electron.Menu.buildFromTemplate([{ label: m(msg("Open Usage")), click: openUsage }]),
    );
  const reconcile = Effect.gen(function* () {
    if (!(yield* settings.get).usageTrayEnabled) {
      destroy();
    } else if (!closing && !tray) {
      if (Option.isNone(ico)) {
        yield* Effect.logWarning("Cannot show Usage tray icon: missing Windows icon");
        return;
      }
      yield* Effect.try({
        try: () => {
          tray = new Electron.Tray(ico.value);
          tray.setToolTip(environment.displayName);
          tray.on("click", openUsage);
          updateMenu();
        },
        catch: (cause) => new DesktopUsageTrayError({ cause }),
      }).pipe(
        Effect.catch((error) => {
          destroy();
          return Effect.logWarning("Cannot show Usage tray icon", error);
        }),
      );
    }
  });
  yield* app.on("before-quit", close);
  const unsubscribe = onLocaleChange(() =>
    runFork(
      Effect.try({
        try: updateMenu,
        catch: (cause) => new DesktopUsageTrayError({ cause }),
      }).pipe(Effect.catch((error) => Effect.logWarning("Cannot update Usage tray menu", error))),
    ),
  );
  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      unsubscribe();
      close();
    }),
  );
  yield* reconcile;
  yield* ipc.handleSync(
    makeSyncIpcMethod({
      channel: GET_USAGE_TRAY_ENABLED_CHANNEL,
      result: Schema.Boolean,
      handler: () => Effect.map(settings.get, (current) => current.usageTrayEnabled),
    }),
  );
  yield* ipc.handle(
    makeIpcMethod({
      channel: SET_USAGE_TRAY_ENABLED_CHANNEL,
      payload: Schema.Boolean,
      result: Schema.Void,
      handler: (enabled) => settings.setUsageTrayEnabled(enabled).pipe(Effect.andThen(reconcile)),
    }),
  );
});
