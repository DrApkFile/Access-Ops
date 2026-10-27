import { ActionsScreen } from "@/components/workspace/actions-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <ActionsScreen
      findingId={typeof query.findingId === "string" ? query.findingId : ""}
    />
  );
}
