"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import { updateListing, type ListingResult } from "@/app/actions/listings";
import SubmitButton from "@/components/SubmitButton";
import { getCategoryFields } from "@/lib/categoryFields";

const initialState: ListingResult = { error: null };

type Listing = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  condition: string | null;
  images: string[];
  meetup_spot: string | null;
  category_id: string | null;
  custom_fields: unknown;
};

export default function EditListingForm({
  listing,
  categories,
}: {
  listing: Listing;
  categories: { id: string; name: string; slug: string }[];
}) {
  const [state, formAction] = useActionState(updateListing, initialState);
  const [keptImages, setKeptImages] = useState<string[]>(listing.images);
  const [categoryId, setCategoryId] = useState(listing.category_id ?? "");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const customFields = useMemo(() => getCategoryFields(selectedCategory?.slug), [selectedCategory]);
  const existingCustomFields = (listing.custom_fields ?? {}) as Record<string, string>;

  function removeImage(url: string) {
    setKeptImages((prev) => prev.filter((img) => img !== url));
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="listingId" value={listing.id} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={150}
          defaultValue={listing.title}
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
          maxLength={3000}
          defaultValue={listing.description ?? ""}
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
            defaultValue={listing.price}
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
            defaultValue={listing.condition ?? "good"}
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
        <div className="grid grid-cols-2 gap-4">
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
                maxLength={200}
                defaultValue={existingCustomFields[field.key] ?? ""}
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
          maxLength={150}
          defaultValue={listing.meetup_spot ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {keptImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current photos</label>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {keptImages.map((img) => (
              <div key={img} className="group relative aspect-square overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                <Image src={img} alt="" fill className="object-cover" />
                <input type="hidden" name="keptImages" value={img} />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="images" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Add more photos (up to {5 - keptImages.length} more)
        </label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="mt-1 w-full text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-dark"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">{state.error}</p>
      )}

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
