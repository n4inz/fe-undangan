"use client";

import DataTableFormAk from "@/components/DataTableFormAk";

export default function AqiqahKhitanListPage() {
  return (
    <>
      <div className="fixed h-10 w-full border-b bg-white" />
      <div className="flex min-h-screen pt-10">
        <div className="fixed z-40 hidden h-full w-64 bg-gray-800 md:relative md:block" />

        <main className="flex min-w-0 w-full flex-grow flex-col xl:pl-24">
          <div className="p-4">
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
