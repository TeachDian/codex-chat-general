import { invoke } from "@tauri-apps/api/core";
import { mockDashboard } from "./mock-dashboard";
import type { DashboardData } from "./usage-model";

const hasTauriRuntime = "__TAURI_INTERNALS__" in window;

export async function loadUsage(): Promise<DashboardData> {
  if (!hasTauriRuntime) {
    return mockDashboard;
  }

  return invoke<DashboardData>("load_usage");
}

export async function refreshUsage(): Promise<DashboardData> {
  if (!hasTauriRuntime) {
    return mockDashboard;
  }

  return invoke<DashboardData>("refresh_usage");
}
