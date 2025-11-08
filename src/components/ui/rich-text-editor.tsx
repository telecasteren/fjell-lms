"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  X,
  Table2,
  Trash2,
  Minus,
  Image as ImageIcon,
} from "lucide-react";

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

/**
 * Rich Text Editor Component
 * 
 * A WYSIWYG editor built with Tiptap that matches the application's design system.
 * 
 * Styling is centralized in this component for easy maintenance.
 * To update styles, modify the classes in:
 * - editorContainer: Main editor wrapper
 * - toolbar: Toolbar container
 * - toolbarButton: Individual toolbar buttons
 * - editorContent: Editor content area
 * - editorProse: Prose styling for editor content
 */
export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
  minHeight = "16rem",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default heading levels we don't use
        heading: {
          levels: [1, 2, 3],
        },
      }),
      UnderlineExtension,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      LinkExtension.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-primary underline hover:text-primary/80 cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false, // Required for SSR compatibility in Next.js
  });

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedTable, setSelectedTable] = useState<HTMLElement | null>(null);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState<{ top: number; right: number } | null>(null);

  // Add keyboard handler for backspace/delete on tables
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle backspace/delete when table is selected
      if ((event.key === "Backspace" || event.key === "Delete") && editor.isActive("table")) {
        // Check if we're at the start of the table or table is selected
        const { selection } = editor.state;
        const { $anchor } = selection;
        
        // Find if we're in a table
        let depth = $anchor.depth;
        let tableNode = null;
        let tableDepth = -1;
        
        while (depth > 0) {
          const node = $anchor.node(depth);
          if (node.type.name === "table") {
            tableNode = node;
            tableDepth = depth;
            break;
          }
          depth--;
        }
        
        if (tableNode && tableDepth >= 0) {
          // Check if cursor is at the start of the table
          const tableStart = $anchor.start(tableDepth);
          const isAtTableStart = $anchor.pos === tableStart;
          
          // Or if the entire table is selected
          const isTableSelected = selection.$anchor.node(tableDepth) === tableNode;
          
          if (isAtTableStart || isTableSelected) {
            event.preventDefault();
            editor.chain().focus().deleteTable().run();
            return;
          }
        }
      }
    };

    // Add the keyboard handler
    const dom = editor.view.dom;
    dom.addEventListener("keydown", handleKeyDown);

    return () => {
      dom.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  // Handle table selection and show delete button
  useEffect(() => {
    if (!editor || !editorWrapperRef.current) return;

    const editorElement = editorWrapperRef.current.querySelector(".ProseMirror");
    if (!editorElement) return;

    const handleSelectionUpdate = () => {
      if (!editor.isActive("table")) {
        setSelectedTable(null);
        setDeleteButtonPosition(null);
        return;
      }

      // Get the current selection position
      const { from } = editor.state.selection;
      
      // Find the table node at the current position
      const $pos = editor.state.doc.resolve(from);
      let tableNode = null;
      let depth = $pos.depth;
      
      while (depth > 0 && !tableNode) {
        const node = $pos.node(depth);
        if (node.type.name === "table") {
          tableNode = node;
          break;
        }
        depth--;
      }

      if (tableNode) {
        // Find the DOM element for this table
        const domPos = editor.view.domAtPos($pos.start(depth));
        let tableElement: Node | null = domPos.node;
        
        // Walk up the DOM tree to find the table element
        while (tableElement && tableElement.nodeName !== "TABLE") {
          tableElement = (tableElement as HTMLElement).parentElement;
        }
        
        if (tableElement && tableElement.nodeName === "TABLE") {
          const table = tableElement as HTMLElement;
          setSelectedTable(table);
          updateDeleteButtonPosition(table);
        }
      }
    };

    const updateDeleteButtonPosition = (table: HTMLElement) => {
      if (!editorWrapperRef.current) return;
      
      const editorRect = editorWrapperRef.current.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const scrollTop = editorWrapperRef.current.scrollTop;
      const scrollLeft = editorWrapperRef.current.scrollLeft;
      
      setDeleteButtonPosition({
        top: tableRect.top - editorRect.top + scrollTop + 4,
        right: editorRect.right - tableRect.right + scrollLeft + 4,
      });
    };

    // Handle clicks on table borders or anywhere in table
    const handleTableClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const table = target.closest("table");
      if (table) {
        setSelectedTable(table as HTMLElement);
        updateDeleteButtonPosition(table as HTMLElement);
      }
    };

    // Update button position on scroll
    const handleScroll = () => {
      const currentTable = selectedTable;
      if (currentTable && editorWrapperRef.current) {
        const editorRect = editorWrapperRef.current.getBoundingClientRect();
        const tableRect = currentTable.getBoundingClientRect();
        const scrollTop = editorWrapperRef.current.scrollTop;
        const scrollLeft = editorWrapperRef.current.scrollLeft;
        
        setDeleteButtonPosition({
          top: tableRect.top - editorRect.top + scrollTop + 4,
          right: editorRect.right - tableRect.right + scrollLeft + 4,
        });
      }
    };

    const scrollContainer = editorWrapperRef.current;
    scrollContainer?.addEventListener("scroll", handleScroll);

    editorElement.addEventListener("click", handleTableClick);
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("update", handleSelectionUpdate);

    return () => {
      editorElement.removeEventListener("click", handleTableClick);
      scrollContainer?.removeEventListener("scroll", handleScroll);
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("update", handleSelectionUpdate);
    };
  }, [editor, selectedTable]);

  if (!editor) {
    return null;
  }

  function handleLinkButtonClick() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const existingLink = editor.getAttributes("link");

    if (existingLink.href) {
      // Editing existing link
      setLinkUrl(existingLink.href);
      setLinkText(selectedText || existingLink.href);
    } else {
      // Creating new link
      setLinkUrl("");
      setLinkText(selectedText);
    }
    setLinkDialogOpen(true);
  }

  function handleLinkSubmit() {
    if (!editor || !linkUrl.trim()) {
      return;
    }

    // Validate URL format
    let url = linkUrl.trim();
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`;
    }

    if (linkText.trim()) {
      // Replace selected text with link
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${linkText.trim()}</a>`)
        .run();
    } else {
      // Apply link to selected text
      editor.chain().focus().setLink({ href: url }).run();
    }

    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  }

  function handleRemoveLink() {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  }

  async function handleImageFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image size must be less than 10MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/editor/images", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (result.success && result.url) {
        // Insert image into editor
        editor
          .chain()
          .focus()
          .setImage({ src: result.url, alt: imageAlt || file.name })
          .run();
        setImageDialogOpen(false);
        setImageUrl("");
        setImageAlt("");
      } else {
        alert(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  function handleImageSubmit() {
    if (!editor || !imageUrl.trim()) {
      return;
    }

    // Validate URL format
    let url = imageUrl.trim();
    if (!url.match(/^https?:\/\//i) && !url.match(/^data:/i)) {
      url = `https://${url}`;
    }

    editor
      .chain()
      .focus()
      .setImage({ src: url, alt: imageAlt || "" })
      .run();

    setImageDialogOpen(false);
    setImageUrl("");
    setImageAlt("");
  }

  function handleImageButtonClick() {
    if (editor?.isActive("image")) {
      // If image is selected, show dialog with current image URL
      const attrs = editor.getAttributes("image");
      setImageUrl(attrs.src || "");
      setImageAlt(attrs.alt || "");
    }
    setImageDialogOpen(true);
  }

  // Toolbar button component for consistency
  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div
      className={cn(
        // Editor container - matches application border and background styling
        "border-input bg-background rounded-md border",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "transition-[color,box-shadow]",
        className
      )}
      style={{ minHeight }}
    >
      {/* Toolbar - matches application button styling */}
      <div
        className={cn(
          "border-input flex items-center gap-1 border-b px-2 py-1.5",
          "flex-wrap"
        )}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Heading Dropdown */}
        <Select
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : "paragraph"
          }
          onValueChange={(value) => {
            if (value === "h1") {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            } else if (value === "h2") {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            } else if (value === "h3") {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-[120px] px-2",
              (editor.isActive("heading", { level: 1 }) ||
                editor.isActive("heading", { level: 2 }) ||
                editor.isActive("heading", { level: 3 })) &&
                "bg-accent text-accent-foreground"
            )}
          >
            <SelectValue placeholder="Heading">
              {editor.isActive("heading", { level: 1 })
                ? "Heading 1"
                : editor.isActive("heading", { level: 2 })
                ? "Heading 2"
                : editor.isActive("heading", { level: 3 })
                ? "Heading 3"
                : "Paragraph"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
          </SelectContent>
        </Select>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Lists Dropdown */}
        <Select
          value={
            editor.isActive("bulletList")
              ? "bullet"
              : editor.isActive("orderedList")
              ? "numbered"
              : "none"
          }
          onValueChange={(value) => {
            if (value === "bullet") {
              // Remove numbered list if active, then set bullet list
              if (editor.isActive("orderedList")) {
                editor.chain().focus().toggleOrderedList().run();
              }
              if (!editor.isActive("bulletList")) {
                editor.chain().focus().toggleBulletList().run();
              }
            } else if (value === "numbered") {
              // Remove bullet list if active, then set numbered list
              if (editor.isActive("bulletList")) {
                editor.chain().focus().toggleBulletList().run();
              }
              if (!editor.isActive("orderedList")) {
                editor.chain().focus().toggleOrderedList().run();
              }
            } else if (value === "none") {
              // Remove list formatting
              if (editor.isActive("bulletList")) {
                editor.chain().focus().toggleBulletList().run();
              }
              if (editor.isActive("orderedList")) {
                editor.chain().focus().toggleOrderedList().run();
              }
            }
          }}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-10 p-0 flex items-center justify-center gap-0.5",
              "[&>div:last-child_svg]:size-2 [&>div:last-child_svg]:h-2 [&>div:last-child_svg]:w-2",
              "[&_svg:last-of-type]:size-2 [&_svg:last-of-type]:h-2 [&_svg:last-of-type]:w-2",
              "[&_[data-slot='select-value']]:gap-0.5",
              (editor.isActive("bulletList") || editor.isActive("orderedList")) &&
                "bg-accent text-accent-foreground"
            )}
          >
            <SelectValue>
              {editor.isActive("bulletList") ? (
                <List className="h-4 w-4" />
              ) : editor.isActive("orderedList") ? (
                <ListOrdered className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="p-1 min-w-fit w-auto [&_[data-slot='select-item']>span[class*='absolute']]:hidden">
            <SelectItem 
              value="bullet" 
              className={cn(
                "flex items-center justify-center px-2 py-1.5 pr-2",
                editor.isActive("bulletList") && "bg-accent text-accent-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </SelectItem>
            <SelectItem 
              value="numbered" 
              className={cn(
                "flex items-center justify-center px-2 py-1.5 pr-2",
                editor.isActive("orderedList") && "bg-accent text-accent-foreground"
              )}
            >
              <ListOrdered className="h-4 w-4" />
            </SelectItem>
            <SelectItem 
              value="none" 
              className={cn(
                "flex items-center justify-center px-2 py-1.5 pr-2",
                !editor.isActive("bulletList") && !editor.isActive("orderedList") && "bg-accent text-accent-foreground"
              )}
            >
              <X className="h-4 w-4" />
            </SelectItem>
          </SelectContent>
        </Select>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Table Dropdown */}
        <Select
          value=""
          onValueChange={(value) => {
            const [rows, cols] = value.split("x").map(Number);
            if (rows && cols) {
              editor
                .chain()
                .focus()
                .insertTable({
                  rows,
                  cols,
                  withHeaderRow: true,
                })
                .run();
            }
          }}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-10 p-0 flex items-center justify-center gap-0.5",
              "[&>div:last-child_svg]:size-2 [&>div:last-child_svg]:h-2 [&>div:last-child_svg]:w-2",
              "[&_svg:last-of-type]:size-2 [&_svg:last-of-type]:h-2 [&_svg:last-of-type]:w-2",
              "[&_[data-slot='select-value']]:gap-0.5",
              editor.isActive("table") && "bg-accent text-accent-foreground"
            )}
          >
            <Table2 className="h-4 w-4" />
            <SelectValue className="hidden" />
          </SelectTrigger>
          <SelectContent className="p-1 min-w-fit w-auto">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              <span>Insert Table</span>
            </div>
            <SelectItem value="2x2" className="px-2 py-1.5">
              2×2
            </SelectItem>
            <SelectItem value="3x3" className="px-2 py-1.5">
              3×3
            </SelectItem>
            <SelectItem value="4x4" className="px-2 py-1.5">
              4×4
            </SelectItem>
            <SelectItem value="5x5" className="px-2 py-1.5">
              5×5
            </SelectItem>
            <SelectItem value="3x2" className="px-2 py-1.5">
              3×2
            </SelectItem>
            <SelectItem value="2x3" className="px-2 py-1.5">
              2×3
            </SelectItem>
            {editor.isActive("table") && (
              <>
                <div className="mx-2 my-1 h-px bg-border" />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Table Actions
                </div>
                <SelectItem
                  value="delete-row"
                  className="px-2 py-1.5 text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    editor.chain().focus().deleteRow().run();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4" />
                    <span>Delete Row</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="delete-column"
                  className="px-2 py-1.5 text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    editor.chain().focus().deleteColumn().run();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4" />
                    <span>Delete Column</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="clear-cell"
                  className="px-2 py-1.5"
                  onSelect={(e) => {
                    e.preventDefault();
                    // Clear the content of the current cell by selecting all and deleting
                    editor.chain().focus().selectAll().deleteSelection().run();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>Clear Cell</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="delete-table"
                  className="px-2 py-1.5 text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    editor.chain().focus().deleteTable().run();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Table</span>
                  </div>
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={handleLinkButtonClick}
          isActive={editor.isActive("link")}
          title={editor.isActive("link") ? "Edit Link" : "Add Link"}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleImageButtonClick}
          isActive={editor.isActive("image")}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor content area - matches application input styling */}
      <div className="overflow-y-auto relative" ref={editorWrapperRef}>
        <EditorContent
          editor={editor}
          className={cn(
            // Editor content wrapper
            "prose prose-sm dark:prose-invert max-w-none",
            "px-3 py-2",
            // Placeholder styling
            "[&_.tiptap-placeholder]:text-muted-foreground [&_.tiptap-placeholder]:opacity-50",
            // Focus styling
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]",
            // Typography styling to match application
            "[&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p]:last:mb-0",
            "[&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6",
            "[&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
            "[&_.ProseMirror_li]:my-1",
            "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mt-4 [&_.ProseMirror_h1]:mb-2",
            "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-2",
            "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-2 [&_.ProseMirror_h3]:mb-2",
            "[&_.ProseMirror_strong]:font-bold",
            "[&_.ProseMirror_em]:italic",
            "[&_.ProseMirror_u]:underline",
            "[&_.ProseMirror_mark]:bg-yellow-200 [&_.ProseMirror_mark]:dark:bg-yellow-800 [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded",
            "[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono",
            "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-2",
            "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:hover:text-primary/80",
            "[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:my-4",
            // Table styling
            "[&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:border [&_.ProseMirror_table]:border-border [&_.ProseMirror_table]:my-4 [&_.ProseMirror_table]:w-full",
            "[&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-border [&_.ProseMirror_table_td]:px-3 [&_.ProseMirror_table_td]:py-2 [&_.ProseMirror_table_td]:min-w-[100px]",
            "[&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-border [&_.ProseMirror_table_th]:px-3 [&_.ProseMirror_table_th]:py-2 [&_.ProseMirror_table_th]:bg-muted [&_.ProseMirror_table_th]:font-semibold [&_.ProseMirror_table_th]:text-left",
            "[&_.ProseMirror_table_tr]:border-b [&_.ProseMirror_table_tr]:border-border",
            "[&_.ProseMirror_table_resizer]:absolute [&_.ProseMirror_table_resizer]:right-0 [&_.ProseMirror_table_resizer]:top-0 [&_.ProseMirror_table_resizer]:h-full [&_.ProseMirror_table_resizer]:w-1 [&_.ProseMirror_table_resizer]:cursor-col-resize [&_.ProseMirror_table_resizer]:bg-primary/20 [&_.ProseMirror_table_resizer]:opacity-0 [&_.ProseMirror_table_resizer]:hover:opacity-100 [&_.ProseMirror_table_resizer]:transition-opacity",
            // Text alignment styling
            "[&_.ProseMirror_[style*='text-align:left']]:text-left",
            "[&_.ProseMirror_[style*='text-align:center']]:text-center",
            "[&_.ProseMirror_[style*='text-align:right']]:text-right",
            "[&_.ProseMirror_[style*='text-align:justify']]:text-justify"
          )}
        />
        
        {/* Table Delete Button - appears when table is selected */}
        {selectedTable && deleteButtonPosition && (
          <div
            className="absolute z-50 pointer-events-auto"
            style={{
              top: `${deleteButtonPosition.top}px`,
              right: `${deleteButtonPosition.right}px`,
            }}
          >
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-6 w-6 p-0 shadow-md"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.chain().focus().deleteTable().run();
                setSelectedTable(null);
                setDeleteButtonPosition(null);
              }}
              title="Delete table"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor.isActive("link") ? "Edit Link" : "Add Link"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text (optional)</Label>
              <Input
                id="link-text"
                type="text"
                placeholder="Link text (uses selected text if empty)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, the selected text will be used as the link text.
              </p>
            </div>
          </div>
          <DialogFooter>
            {editor.isActive("link") && (
              <Button
                variant="destructive"
                onClick={handleRemoveLink}
                type="button"
              >
                Remove Link
              </Button>
            )}
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkSubmit} disabled={!linkUrl.trim()}>
              {editor.isActive("link") ? "Update Link" : "Add Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor.isActive("image") ? "Edit Image" : "Insert Image"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Image</Label>
              <input
                ref={imageInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                disabled={isUploadingImage}
              />
              {isUploadingImage && (
                <p className="text-xs text-muted-foreground">Uploading...</p>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleImageSubmit();
                  }
                }}
                disabled={isUploadingImage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text (optional)</Label>
              <Input
                id="image-alt"
                type="text"
                placeholder="Describe the image"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleImageSubmit();
                  }
                }}
                disabled={isUploadingImage}
              />
            </div>
          </div>
          <DialogFooter>
            {editor.isActive("image") && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().deleteSelection().run();
                  }
                  setImageDialogOpen(false);
                  setImageUrl("");
                  setImageAlt("");
                }}
                type="button"
                disabled={isUploadingImage}
              >
                Remove Image
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setImageDialogOpen(false);
                setImageUrl("");
                setImageAlt("");
              }}
              disabled={isUploadingImage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImageSubmit}
              disabled={!imageUrl.trim() || isUploadingImage}
            >
              {editor.isActive("image") ? "Update Image" : "Insert Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

