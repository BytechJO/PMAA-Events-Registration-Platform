import { redirect } from "next/navigation";

/** /admin opens the first section. The Overview dashboard (T070) takes this place later. */
export default function AdminHome() {
  redirect("/admin/events");
}
