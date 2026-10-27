import { ScenariosScreen } from "@/components/workspace/scenarios-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <ScenariosScreen initialId={typeof query.id === "string" ? query.id : ""} />
  );
}
