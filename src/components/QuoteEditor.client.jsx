"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

export default function QuoteEditor({ value = "", onChange }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                underline: true, // aktifkan underline bawaan
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // Sync editor content when parent value changes
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, false);
        }
    }, [value, editor]);

    return (
        <div className="mb-4">
            <label className="block text-gray-700 mb-1">Quote</label>
            <div className="border border-gray-300 rounded-lg">
                <div className="flex flex-wrap gap-1 p-2 border-b">
                    <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className="p-1 rounded"
                        title="Bold"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className="p-1 rounded"
                        title="Italic"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        className="p-1 rounded"
                        title="Underline"
                    >
                        <u>U</u>
                    </button>
                </div>

                <EditorContent
                    editor={editor}
                    className="p-2 prose prose-sm max-w-none"
                    style={{
                        minHeight: "72px", // 3 rows x ~24px
                        height: "auto",
                        overflowY: "auto",
                        lineHeight: "1.5",
                        fontSize: "1rem",
                    }}
                />
            </div>
        </div>
    );
}