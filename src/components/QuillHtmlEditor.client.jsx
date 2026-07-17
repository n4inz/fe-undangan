"use client";

import { useEffect, useRef } from "react";

const EMPTY_QUILL_HTML = "<p><br></p>";

const DEFAULT_TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline"],
  [{ align: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
];

const DEFAULT_ALLOWED_FORMATS = ["bold", "italic", "underline", "align", "list"];

const normalizeHtml = (html) => {
  const value = String(html || "").trim();
  return !value || value === EMPTY_QUILL_HTML ? "" : value;
};

const removeClassName = (element, className) => {
  element.classList.remove(className);

  if (!element.getAttribute("class")) {
    element.removeAttribute("class");
  }
};

const convertBlockLinesToBreaks = (wrapper) => {
  const children = Array.from(wrapper.childNodes).filter(
    (node) => node.nodeType !== 3 || node.textContent.trim() !== ""
  );

  if (
    children.length === 0 ||
    !children.every(
      (node) =>
        node.nodeType === 1 && ["P", "DIV"].includes(node.tagName)
    )
  ) {
    return;
  }

  const fragment = document.createDocumentFragment();

  children.forEach((child, index) => {
    if (index > 0) {
      fragment.appendChild(document.createElement("br"));
    }

    const isEmptyLine =
      child.innerHTML.trim().toLowerCase() === "<br>" ||
      child.textContent.trim() === "";

    if (!isEmptyLine) {
      while (child.firstChild) {
        fragment.appendChild(child.firstChild);
      }
    }
  });

  wrapper.replaceChildren(fragment);
};

const makeHtmlPortable = (html, { useBrLineBreaks = false } = {}) => {
  const normalized = normalizeHtml(html);

  if (!normalized || typeof document === "undefined") {
    return normalized;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = normalized;

  wrapper.querySelectorAll(".ql-ui").forEach((element) => element.remove());

  [
    ["ql-align-center", "center"],
    ["ql-align-right", "right"],
    ["ql-align-justify", "justify"],
  ].forEach(([className, alignment]) => {
    wrapper.querySelectorAll(`.${className}`).forEach((element) => {
      element.style.textAlign = alignment;
      removeClassName(element, className);
    });
  });

  if (useBrLineBreaks) {
    convertBlockLinesToBreaks(wrapper);
  }

  return normalizeHtml(wrapper.innerHTML);
};

const getQuillHtml = (quill) => {
  return quill.root.innerHTML;
};

export default function QuillHtmlEditor({
  id,
  name,
  value = "",
  onChange,
  placeholder,
  ariaInvalid,
  ariaDescribedBy,
  toolbarOptions = DEFAULT_TOOLBAR_OPTIONS,
  formats = DEFAULT_ALLOWED_FORMATS,
  useBrLineBreaks = false,
}) {
  const editorElementRef = useRef(null);
  const quillRef = useRef(null);
  const latestValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const textChangeHandlerRef = useRef(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    latestValueRef.current = value || "";
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let mounted = true;

    const initializeQuill = async () => {
      const Quill = (await import("quill")).default;

      if (!mounted || !editorElementRef.current || quillRef.current) return;

      const quill = new Quill(editorElementRef.current, {
        theme: "snow",
        placeholder,
        formats,
        modules: {
          toolbar: toolbarOptions,
        },
      });

      quillRef.current = quill;

      const initialValue = normalizeHtml(latestValueRef.current);
      if (initialValue) {
        syncingRef.current = true;
        quill.clipboard.dangerouslyPasteHTML(initialValue);
        syncingRef.current = false;
      }

      const handleTextChange = () => {
        if (syncingRef.current) return;
        onChangeRef.current?.(
          makeHtmlPortable(getQuillHtml(quill), { useBrLineBreaks })
        );
      };

      textChangeHandlerRef.current = handleTextChange;
      quill.on("text-change", handleTextChange);
    };

    initializeQuill();

    return () => {
      mounted = false;

      if (quillRef.current && textChangeHandlerRef.current) {
        quillRef.current.off("text-change", textChangeHandlerRef.current);
      }

      quillRef.current = null;
      textChangeHandlerRef.current = null;
    };
  }, [formats, placeholder, toolbarOptions, useBrLineBreaks]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const nextValue = normalizeHtml(value);
    const currentValue = makeHtmlPortable(getQuillHtml(quill), {
      useBrLineBreaks,
    });

    if (nextValue === currentValue) return;

    const selection = quill.getSelection();

    syncingRef.current = true;
    quill.clipboard.dangerouslyPasteHTML(nextValue);
    syncingRef.current = false;

    if (selection) {
      quill.setSelection(
        Math.min(selection.index, Math.max(quill.getLength() - 1, 0)),
        selection.length,
        "silent"
      );
    }
  }, [useBrLineBreaks, value]);

  return (
    <>
      <div
        className="quill-html-editor"
        data-invalid={ariaInvalid ? "true" : undefined}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      >
        <div id={id} ref={editorElementRef} />
      </div>
      <input type="hidden" name={name} value={value || ""} readOnly />
    </>
  );
}
