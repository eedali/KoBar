import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

const NoteEditor: React.FC = () => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true },
                orderedList: { keepMarks: true },
            }),
            Underline,
            Image.configure({ inline: true }),
            Placeholder.configure({
                placeholder: 'Start writing your note…',
            }),
        ],
        content: `
            <p>Here are some initial thoughts for the upcoming quarter:</p>
            <ul>
                <li><strong>Revamp the Dashboard:</strong> Focus on user-customizable widgets. We need to allow users to drag and drop their most used metrics.</li>
                <li><strong>Integrate new API:</strong> The third-party data needs to be pulled in real-time. Discuss with the backend team regarding rate limits.</li>
                <li><strong>Performance optimization:</strong> Investigate the slow load times on the reporting module. Could be a database indexing issue.</li>
            </ul>
            <p>Next steps are to schedule a sync with design to review wireframes by next Tuesday.</p>
        `,
        editorProps: {
            attributes: {
                class: 'flex-1 text-slate-300 text-lg leading-relaxed outline-none no-drag-region overflow-y-auto prose prose-invert max-w-none',
            },
        },
    });

    const handleImageInsert = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="flex-1 p-8 flex flex-col overflow-y-auto w-full max-w-full">
            {/* Title area */}
            <div className="flex items-center gap-4 mb-6 no-drag-region">
                <input
                    className="bg-transparent text-4xl font-bold text-slate-100 border-none outline-none w-full focus:ring-0 placeholder-slate-700"
                    placeholder="Note Title..."
                    type="text"
                    defaultValue="Project Ideas: Q3 Roadmap"
                />
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#3f362b] text-slate-400 no-drag-region">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`hover:text-slate-200 transition-colors cursor-pointer ${editor.isActive('bold') ? 'text-primary' : ''}`}
                    title="Bold"
                >
                    <span className="material-symbols-outlined text-[20px]">format_bold</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`hover:text-slate-200 transition-colors cursor-pointer ${editor.isActive('italic') ? 'text-primary' : ''}`}
                    title="Italic"
                >
                    <span className="material-symbols-outlined text-[20px]">format_italic</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`hover:text-slate-200 transition-colors cursor-pointer ${editor.isActive('underline') ? 'text-primary' : ''}`}
                    title="Underline"
                >
                    <span className="material-symbols-outlined text-[20px]">format_underlined</span>
                </button>
                <div className="w-px h-5 bg-[#3f362b]"></div>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`hover:text-slate-200 transition-colors cursor-pointer ${editor.isActive('bulletList') ? 'text-primary' : ''}`}
                    title="Bullet List"
                >
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`hover:text-slate-200 transition-colors cursor-pointer ${editor.isActive('orderedList') ? 'text-primary' : ''}`}
                    title="Numbered List"
                >
                    <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
                </button>
                <div className="w-px h-5 bg-[#3f362b]"></div>
                <button
                    onClick={handleImageInsert}
                    className="hover:text-slate-200 transition-colors cursor-pointer"
                    title="Insert Image"
                >
                    <span className="material-symbols-outlined text-[20px]">image</span>
                </button>
            </div>

            {/* Tiptap Editor Content */}
            <EditorContent editor={editor} className="flex-1 overflow-y-auto no-drag-region" />
        </div>
    );
};

export default NoteEditor;
