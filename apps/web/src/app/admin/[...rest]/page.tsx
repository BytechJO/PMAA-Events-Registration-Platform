import { notFound } from "next/navigation";

/** Unknown admin URLs (including sections that arrive later) show "not found" inside the admin shell. */
export default function UnknownAdminPage() {
  notFound();
}
