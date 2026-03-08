import { backendClient, buildBackendUrl } from "@/lib/api/backend-client";
import { endpoints } from "@/lib/api/endpoints";

export async function launchGitHubBootstrap() {
  const response = await backendClient.createGitHubBootstrapManifest();

  if (response.alreadyConfigured) {
    return response;
  }

  const form = document.createElement("form");
  form.method = "post";
  form.action = response.submitUrl;
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "manifest";
  input.value = JSON.stringify(response.manifest);
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
  form.remove();

  return response;
}

export function launchGitHubInstall() {
  window.location.assign(buildBackendUrl(endpoints.github.install));
}
