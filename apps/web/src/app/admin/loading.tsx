import { AdminBody } from "@/components/admin/AdminTopBar";
import { AdminContentSkeleton } from "@/components/admin/states";

export default function AdminLoading() {
  return (
    <>
      <div className="h-[58px] flex-none border-b border-border bg-background" />
      <AdminBody>
        <AdminContentSkeleton />
      </AdminBody>
    </>
  );
}
