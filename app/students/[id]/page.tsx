import { Suspense } from "react";
import StudentClient from "./StudentClient";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentClient id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p style={{ padding: 16 }}>Loading...</p>}>
      <Content params={params} />
    </Suspense>
  );
}