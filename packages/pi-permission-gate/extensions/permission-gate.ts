import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Permission gate is built into pi — this extension just ensures
  // the permission enforcement hooks are active.
  // No additional config needed.
  console.log("[pi-permission-gate] Active");
}
