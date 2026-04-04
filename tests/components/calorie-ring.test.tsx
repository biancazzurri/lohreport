import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CalorieRing } from "@/components/calorie-ring";

describe("CalorieRing", () => {
  it("renders current and target calories", () => {
    render(<CalorieRing current={1500} target={2100} />);
    expect(screen.getByText("1,500 / 2,100 cal")).toBeInTheDocument();
  });

  it("renders zero state correctly", () => {
    render(<CalorieRing current={0} target={2100} />);
    expect(screen.getByText("0 / 2,100 cal")).toBeInTheDocument();
  });
});
