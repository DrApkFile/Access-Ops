import { InvestigationDetail } from "@/components/workspace/investigation-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvestigationDetail id={id} />;
}
