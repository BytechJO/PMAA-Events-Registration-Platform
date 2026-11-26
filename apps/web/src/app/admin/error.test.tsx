import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminError from "./error";

/** Finds the first element in the tree whose props match. */
function find(node: ReactNode, match: (props: Record<string, unknown>) => boolean): ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = find(child, match);
      if (hit) return hit;
    }
    return null;
  }
  if (!isValidElement<Record<string, unknown>>(node)) return null;
  if (match(node.props)) return node;
  for (const value of Object.values(node.props)) {
    const hit = find(value as ReactNode, match);
    if (hit) return hit;
  }
  return null;
}

const serverError = () => Object.assign(new Error("An error occurred in the Server Components render."), { digest: "1234567890" });

describe("admin error page", () => {
  it("Try again calls Next's retry (re-fetch and re-render)", () => {
    const retry = vi.fn();
    const tree = AdminError({ error: serverError(), retry });
    const button = find(tree, (p) => typeof p.onClick === "function");
    expect(button).not.toBeNull();
    (button!.props.onClick as () => void)();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("shows the server log reference and a safe message, never the error text", () => {
    const html = renderToStaticMarkup(<AdminError error={serverError()} retry={() => {}} />);
    expect(html).toContain("Something went wrong");
    expect(html).toContain('<span data-testid="error-reference">1234567890</span>');
    expect(html).toContain("Try again");
    expect(html).not.toContain("Server Components render");
  });

  it("shows no reference for a value that is not an Error", () => {
    const html = renderToStaticMarkup(<AdminError error="boom" retry={() => {}} />);
    expect(html).not.toContain("Reference:");
    expect(html).not.toContain("boom");
  });
});
