"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { BiArrowBack } from 'react-icons/bi';

export default function CommentSection({ params }) {

    const { id, phoneNumber } = useParams();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/comments/${params.formId}/${params.phoneNumber}`);
                setComments(response.data.form.comments || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch comments');
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [id, phoneNumber]);

    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}/${params.formId}/${params.phoneNumber}`);
            setComments(comments.filter(comment => comment.id !== commentId));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete comment');
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await axios.post(`/api/forms/${id}/comments`, {
                comment: newComment
            });
            setComments([...comments, response.data.comment]);
            setNewComment('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post comment');
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    if (loading) {
        return (
            <div className="relative min-h-screen">
                <div className="fixed inset-0 bg-gray-100" />
                <div className="relative z-10 flex flex-col items-center justify-start min-h-screen py-8">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-sm">
                        <Card>
                            <CardHeader className="border-b">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-24 mt-2" />
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-3">
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
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-gray-100" />
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8">
                <div className="w-full max-w-md p-6 bg-white rounded-lg shadow shadow-gray-200 flex flex-col items-center">
                <div className="text-red-600 text-center font-medium mb-4">{error}</div>
                <Link href="/forms" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <BiArrowBack className="h-5 w-5" />
                    <span>Kembali</span>
                </Link>
                </div>
            </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-gray-100" />
            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen py-8">
                <div className="w-full max-w-md bg-white rounded-lg shadow-sm">
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center mb-2">
                                <Link href="/forms" className="mr-4">
                                    <BiArrowBack className="h-8 w-8" />
                                </Link>
                                <h2 className="text-xl font-semibold">Komentar Tamu</h2>
                            </div>

                            <p className="text-sm text-gray-500">{comments.length} komentar</p>
                        </CardHeader>

                        <CardContent className="p-0">
                            {comments.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    Belum ada komentar
                                </div>
                            ) : (
                                <ul className="divide-y">
                                    {comments.map((comment) => (
                                        <li key={comment.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>
                                                        {comment.name.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium">
                                                            {comment.name || 'Anonymous'}
                                                        </h4>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-700">
                                                        {comment.comment}
                                                    </p>
                                                </div>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-red-500"
                                                            aria-label="Hapus komentar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Hapus Komentar?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Apakah Anda yakin ingin menghapus komentar ini? Aksi ini tidak dapat dibatalkan.
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
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}