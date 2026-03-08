import { describe, expect, it, vi } from "vitest";

import { launchGitHubBootstrap, launchGitHubInstall } from "./browser";
import { backendClient } from "@/lib/api/backend-client";

vi.mock("@/lib/api/backend-client", () => ({
  backendClient: {
    createGitHubBootstrapManifest: vi.fn(),
  },
  buildBackendUrl: (path: string) => `https://api.example.com${path}`,
}));

const mockedClient = vi.mocked(backendClient);

describe("github browser helpers", () => {
  it("submits a hidden manifest form during bootstrap", async () => {
    mockedClient.createGitHubBootstrapManifest.mockResolvedValue({
      submitUrl: "https://github.com/settings/apps/new?state=abc",
      manifest: { name: "OH-MY-COLLAB" },
    } as never);

    const submit = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => undefined);

    await launchGitHubBootstrap();

    expect(submit).toHaveBeenCalledTimes(1);
    expect(document.querySelector('form[action^="https://github.com/settings/apps/new"]')).toBeNull();
    submit.mockRestore();
  });

  it("redirects to the backend install endpoint", () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { assign },
      writable: true,
    });

    launchGitHubInstall();

    expect(assign).toHaveBeenCalledWith("https://api.example.com/integrations/github/install");
  });
});
