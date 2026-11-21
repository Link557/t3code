import {
  EnvironmentId,
  ProviderDriverKind,
  ProviderInstanceId,
  type ServerProvider,
} from "@t3tools/contracts";
import { CHATGPT_USAGE_URL } from "@t3tools/shared/usageLimits";
import { GTProvider } from "gt-react";
import { describe, expect, it } from "vite-plus/test";

import { render } from "../../../test/render";
import zh from "../../i18n/translations/zh.json";
import { UsageLimitsPooled } from "./UsageLimitsPooled";

const checkedAt = "2026-10-25T16:00:00.000Z";

function managedChatGpt(instanceId: string, displayName: string): ServerProvider {
  return {
    instanceId: ProviderInstanceId.make(instanceId),
    driver: ProviderDriverKind.make("codex"),
    displayName,
    enabled: true,
    installed: true,
    version: "0.164.0",
    status: "ready",
    auth: { status: "authenticated" },
    checkedAt,
    models: [],
    slashCommands: [],
    skills: [],
    usageLimits: {
      checkedAt,
      windows: [],
      unavailable: { reason: "unsupported", message: "Track usage in ChatGPT." },
      externalUsage: { label: "ChatGPT usage", url: CHATGPT_USAGE_URL },
    },
  };
}

describe("UsageLimitsPooled ChatGPT usage card", () => {
  it("names the managed connections it covers", async () => {
    const presentations = new Map([
      [
        EnvironmentId.make("desk"),
        {
          entry: { target: { label: "Desk" } },
          serverConfig: {
            providers: [
              managedChatGpt("chatgpt_work", "ChatGPT Work"),
              managedChatGpt("chatgpt_personal", "ChatGPT Personal"),
            ],
          },
        },
      ],
    ]);
    await using screen = await render(
      <UsageLimitsPooled presentations={presentations} now={Date.parse(checkedAt)} />,
    );

    await expect
      .element(screen.getByText("ChatGPT Work on Desk, ChatGPT Personal on Desk"))
      .toBeVisible();
    await expect
      .element(screen.getByText("View usage in ChatGPT with your connected account."))
      .toBeVisible();
  });
});

it("localizes built-in window labels and preserves provider-specific labels", async () => {
  const provider = {
    ...managedChatGpt("codex", "Codex"),
    usageLimits: {
      checkedAt,
      windows: [
        { id: "primary", kind: "session", label: "Session", usedPercent: 26 },
        { id: "secondary", kind: "weekly", label: "Weekly · Test Model", usedPercent: 38 },
        { id: "custom", kind: "other", label: "Custom API limit", usedPercent: 10 },
      ],
    },
  } satisfies ServerProvider;
  const presentations = new Map([
    [
      EnvironmentId.make("desk"),
      { entry: { target: { label: "Desk" } }, serverConfig: { providers: [provider] } },
    ],
  ]);
  await using screen = await render(
    <GTProvider
      locale="zh"
      translations={{
        zh: {
          "35934ab67a435d71": zh["35934ab67a435d71"],
          "4633d5b11e248ed6": zh["4633d5b11e248ed6"],
        },
      }}
    >
      <UsageLimitsPooled presentations={presentations} now={Date.parse(checkedAt)} />
    </GTProvider>,
  );

  await expect.element(screen.getByText("短期用量", { exact: true })).toBeVisible();
  await expect.element(screen.getByText("每周用量 · Test Model", { exact: true })).toBeVisible();
  await expect.element(screen.getByText("Custom API limit", { exact: true })).toBeVisible();
});
