// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./app";

vi.mock("./tauri-api", () => ({
  loadUsage: vi.fn(() => new Promise(() => {})),
  refreshUsage: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("App boot state", () => {
  it("shows a dashboard skeleton while initial usage data is loading", () => {
    render(<App />);

    expect(screen.getByRole("status", { name: /scanning codex usage/i })).toBeInTheDocument();
    expect(screen.getByText("Scanning local usage")).toBeInTheDocument();
  });
});
