import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MacroBars } from "@/components/macro-bars";

describe("MacroBars", () => {
  const defaultProps = {
    protein: { current: 80, target: 150 },
    carbs: { current: 110, target: 220 },
    fat: { current: 35, target: 70 },
  };

  it("renders Protein label", () => {
    render(<MacroBars {...defaultProps} />);
    expect(screen.getByText("Protein")).toBeInTheDocument();
  });

  it("renders Carbs label", () => {
    render(<MacroBars {...defaultProps} />);
    expect(screen.getByText("Carbs")).toBeInTheDocument();
  });

  it("renders Fat label", () => {
    render(<MacroBars {...defaultProps} />);
    expect(screen.getByText("Fat")).toBeInTheDocument();
  });

  it("renders protein current/target values", () => {
    render(<MacroBars {...defaultProps} />);
    expect(screen.getByText("80/150g")).toBeInTheDocument();
  });

  it("renders carbs current/target values", () => {
    render(<MacroBars {...defaultProps} />);
    expect(screen.getByText("110/220g")).toBeInTheDocument();
  });

  it("renders fat current/target values", () => {
    render(<MacroBars {...defaultProps} />);
    expect(screen.getByText("35/70g")).toBeInTheDocument();
  });
});
