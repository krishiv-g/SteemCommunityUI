import { useState, useRef, useCallback } from 'react';
import MDEditor, { commands, ICommand } from '@uiw/react-md-editor';
import { ImagePlus, Smile } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  preview?: 'live' | 'edit' | 'preview';
}

export function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps) {
  const responsiveHeight = typeof window !== 'undefined' ? Math.max(height, Math.round(window.innerHeight * 0.55)) : height;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const imageMarkdown = `![${file.name}](${dataUrl})\n`;
        onChange(value + imageMarkdown);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  }, [value, onChange]);

  const handleEmojiSelect = useCallback((emoji: any) => {
    onChange(value + emoji.native);
    setShowEmojiPicker(false);
  }, [value, onChange]);

  const imageUploadCommand: ICommand = {
    name: 'image-upload',
    keyCommand: 'image-upload',
    buttonProps: { 'aria-label': 'Upload image', title: 'Upload image' },
    icon: <ImagePlus className="h-3.5 w-3.5" />,
    execute: () => {
      fileInputRef.current?.click();
    },
  };

  const emojiCommand: ICommand = {
    name: 'emoji',
    keyCommand: 'emoji',
    buttonProps: { 'aria-label': 'Insert emoji', title: 'Insert emoji' },
    icon: <Smile className="h-3.5 w-3.5" />,
    execute: () => {
      setShowEmojiPicker(prev => !prev);
    },
  };

  return (
    <div className="relative" ref={editorRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />

      <div data-color-mode="auto">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={responsiveHeight}
          preview="edit"
          className="md-editor-themed"
          commands={[
            commands.bold,
            commands.italic,
            commands.strikethrough,
            commands.hr,
            commands.title,
            commands.divider,
            commands.link,
            commands.quote,
            commands.code,
            commands.codeBlock,
            commands.image,
            commands.table,
            commands.divider,
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.checkedListCommand,
            commands.divider,
            imageUploadCommand,
            emojiCommand,
          ]}
          extraCommands={[]}
        />
      </div>

      {showEmojiPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div className="absolute right-0 top-10 z-50">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="auto"
              previewPosition="none"
              skinTonePosition="search"
              maxFrequentRows={2}
            />
          </div>
        </>
      )}
    </div>
  );
}
