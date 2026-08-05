"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageCircle, Trash2, UserCheck, Users, UserX } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AqiqahKhitanCommentsPage({ params }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/comments-ak/${params.formId}`
        );
        setComments(response.data?.form?.comments || []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Gagal memuat ucapan."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [params.formId]);

  const getConfirmationCounts = () => {
    const counts = {};
    comments.forEach((comment) => {
      const confirmation = comment.confirmation || "Masih ragu";
      counts[confirmation] = (counts[confirmation] || 0) + 1;
    });
    return counts;
  };

  const getConfirmationStyle = (confirmation) => {
    switch (confirmation?.toLowerCase()) {
      case "hadir":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: <UserCheck className="h-3 w-3" />,
        };
      case "tidak hadir":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          icon: <UserX className="h-3 w-3" />,
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          icon: <Users className="h-3 w-3" />,
        };
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingId(commentId);
    setError("");

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/comments-ak/${commentId}/${params.formId}`
      );
      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentId)
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Gagal menghapus ucapan."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const confirmationCounts = getConfirmationCounts();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-8">
        <section className="mx-auto w-full max-w-md rounded-lg bg-white shadow-sm">
          <Card>
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <section className="mx-auto w-full max-w-md rounded-lg bg-white shadow-sm">
        <Card>
          <CardHeader className="border-b">
            <div className="mb-2 flex items-center gap-3">
              <Button asChild variant="ghost" size="icon" title="Kembali">
                <Link
                  href={`/forms/aqiqah-khitan/${params.formId}/atur-foto/success/result`}
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Kembali</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Ucapan Tamu</h1>
                <p className="text-sm text-gray-500">{comments.length} ucapan</p>
              </div>
            </div>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {comments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(confirmationCounts).map(([status, count]) => {
                  const style = getConfirmationStyle(status);
                  return (
                    <div
                      key={status}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${style.bgColor} ${style.textColor}`}
                    >
                      {style.icon}
                      <span>
                        {status}: {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="p-0">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <MessageCircle className="mb-2 h-8 w-8" />
                <p>Belum ada ucapan</p>
              </div>
            ) : (
              <ul className="divide-y">
                {comments.map((comment) => {
                  const confirmationStyle = getConfirmationStyle(comment.confirmation);
                  const initial = comment.name?.charAt(0)?.toUpperCase() || "U";

                  return (
                    <li key={comment.id} className="p-4 hover:bg-gray-50">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{initial}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h2 className="min-w-0 break-words font-medium">
                              {comment.name || "Anonymous"}
                            </h2>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${confirmationStyle.bgColor} ${confirmationStyle.textColor}`}
                            >
                              {confirmationStyle.icon}
                              {comment.confirmation || "Masih Ragu"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </p>
                          <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-700">
                            {comment.comment}
                          </p>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-gray-500 hover:text-red-500"
                              aria-label="Hapus ucapan"
                              disabled={deletingId === comment.id}
                            >
                              {deletingId === comment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Ucapan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus ucapan ini? Aksi ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComment(comment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
