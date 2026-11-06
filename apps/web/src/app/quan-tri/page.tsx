import { redirect } from "next/navigation";
import { ADMIN_SECTIONS } from "@/lib/roles";

/** /quan-tri → mục quản trị đầu tiên. */
export default function Page() {
  redirect(`/quan-tri/${ADMIN_SECTIONS[0].id}`);
}
