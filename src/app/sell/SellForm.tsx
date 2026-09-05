"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createListing, type ListingResult } from "@/app/actions/listings";
import SubmitButton from "@/components/SubmitButton";
import { getCategoryFields } from "@/lib/categoryFields";

const initialState: ListingResult = { error: null };
const MAX_PHOTOS = 5;

export default function SellForm({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  const [state, formAction] = useActionState(createListing, initialState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [trimmedCount, setTrimmedCount] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const customFields = getCategoryFields(selectedCategory?.slug);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  function syncInputFiles(files: File[]) {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    if (fileInputRef.current) fileInputRef.current.files = dataTransfer.files;
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    const trimmed = chosen.slice(0, MAX_PHOTOS);
    setTrimmedCount(chosen.length - trimmed.length);
    setSelectedFiles(trimmed);
    syncInputFiles(trimmed);
  }

  function removePhoto(index: number) {
    const next = selectedFiles.filter((_, i) => i !== index);
    setTrimmedCount(0);
    setSelectedFiles(next);
    syncInputFiles(next);
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Engineering Mechanics textbook, 2nd edition"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Price (₹)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={0}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Condition
          </label>
          <select
            id="condition"
            name="condition"
            defaultValue="good"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="new">New</option>
            <option value="like-new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {customFields.length > 0 && (
        <div className="grid grid-cols-2 gap-4 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          {customFields.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`custom_${field.key}`}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {field.label}
              </label>
              <input
                id={`custom_${field.key}`}
                name={`custom_${field.key}`}
                type="text"
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="meetupSpot" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Suggested meetup spot
        </label>
        <input
          id="meetupSpot"
          name="meetupSpot"
          type="text"
          placeholder="e.g. Main gate, Library, Hostel block C"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="images" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Photos (up to {MAX_PHOTOS})
          </label>
          {selectedFiles.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedFiles.length} of {MAX_PHOTOS} selected
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          className="mt-1 w-full text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-dark"
        />
        {trimmedCount > 0 && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            Only the first {MAX_PHOTOS} photos were kept — {trimmedCount} more{" "}
            {trimmedCount === 1 ? "was" : "were"} not added.
          </p>
        )}
        {previewUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {previewUrls.map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}

      <SubmitButton>Post listing</SubmitButton>
    </form>
  );
}
