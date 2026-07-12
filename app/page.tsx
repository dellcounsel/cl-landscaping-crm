import { redirect } from "next/navigation";

// The middleware bounces unauthenticated users to /login before they reach
// here, so an authenticated visit to "/" lands on the Today view.
export default function RootPage() {
  redirect("/today");
}
