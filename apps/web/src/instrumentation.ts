/** Runs once when the server starts: refuse to start if the admin test sign-in is on outside localhost. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { devSignInEnabled } = await import("@pmaa/core");
  devSignInEnabled(process.env);
}
