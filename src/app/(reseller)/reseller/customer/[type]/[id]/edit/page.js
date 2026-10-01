'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import WeddingEditForm from '@/components/forms/WeddingEditForm';
import AqiqahKhitanEditForm from '@/components/forms/AqiqahKhitanEditForm';
import { useResellerRequest } from '@/components/reseller/api';
import { ResellerError } from '@/components/reseller/ResellerShared';
import { Button } from '@/components/ui/button';
import { createResellerEditorApi } from '@/lib/resellerEditor';

export default function ResellerEditPage({ params }) {
  const { request, ready } = useResellerRequest();
  const editorApi = useMemo(
    () => createResellerEditorApi(request, params.type, params.id),
    [request, params.type, params.id]
  );
  const returnPath = '/reseller/customer';

  if (!editorApi || !ready) {
    return <div className="space-y-4">
      <ResellerError message={!editorApi ? 'Pesanan tidak valid.' : 'Sesi tidak tersedia. Silakan masuk kembali.'} />
      <Button asChild variant="outline"><Link href={returnPath}>Kembali ke daftar customer</Link></Button>
    </div>;
  }

  const Editor = params.type === 'wedding' ? WeddingEditForm : AqiqahKhitanEditForm;
  return <Editor key={`${params.type}:${params.id}`} params={{ formId: params.id }} editorApi={editorApi} returnPath={returnPath} />;
}
