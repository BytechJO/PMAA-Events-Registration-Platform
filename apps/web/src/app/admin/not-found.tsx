import { AdminBody, AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminNotFoundView } from "@/components/admin/states";

export default function AdminNotFound() {
  return (
    <>
      <AdminTopBar crumbs={[{ label: "Not found" }]} />
      <AdminBody>
        <AdminNotFoundView />
      </AdminBody>
    </>
  );
}
