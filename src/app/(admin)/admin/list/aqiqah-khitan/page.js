"use client";

import DataTableFormAk from "@/components/DataTableFormAk";

export default function AqiqahKhitanListPage() {
  return (
    <>
      <div className="fixed h-10 w-full border-b bg-white" />
      <div className="flex min-h-screen pt-10">
        <div
          aria-hidden="true"
          className="hidden h-full w-[300px] shrink-0 xl:block"
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-w-0 p-4">
            <div className="py-4">
              <p className="text-sm text-gray-500">List</p>
              <h1 className="text-xl font-semibold text-gray-950">
                Form Aqiqah / Khitan
              </h1>
            </div>
            <DataTableFormAk />
          </div>
        </main>
      </div>
    </>
  );
}
