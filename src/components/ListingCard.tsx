import Link from "next/link";
import Image from "next/image";
import SaveButton from "./SaveButton";
import InterestedButton from "./InterestedButton";
import { conditionBadgeClasses, conditionLabel } from "@/lib/conditionBadge";

type ListingCardProps = {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  categoryName?: string | null;
  condition?: string | null;
  createdAt?: string;
  saved?: boolean;
  hideSave?: boolean;
  sellerId?: string;
  hideInterested?: boolean;
};

export default function ListingCard({
  id,
  title,
  price,
  images,
  status,
  categoryName,
  condition,
  createdAt,
  saved = false,
  hideSave = false,
  sellerId,
  hideInterested = false,
}: ListingCardProps) {
  const showInterested = !hideInterested && sellerId && status === "available";
  const isNew =
    createdAt && Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 3;

  return (
    <Link
      href={`/listings/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-xl hover:shadow-slate-300/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand/30 dark:hover:shadow-black/50"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-600">
            No photo
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {status === "sold" && (
            <span className="rounded-full bg-slate-900/85 px-2 py-1 text-xs font-semibold text-white">
              Sold
            </span>
          )}
          {status === "expired" && (
            <span className="rounded-full bg-slate-500/85 px-2 py-1 text-xs font-semibold text-white">
              Expired
            </span>
          )}
          {isNew && status !== "sold" && status !== "expired" && (
            <span className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-white">
              New
            </span>
          )}
        </div>

        {(!hideSave || showInterested) && (
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
            {!hideSave && <SaveButton listingId={id} initialSaved={saved} />}
            {showInterested && <InterestedButton listingId={id} sellerId={sellerId!} />}
          </div>
        )}
      </div>

      {/* Phones get a tighter version: no fixed title height, and the
          category pill is dropped so the badge row can't wrap onto a
          second line — at two columns on a 375px screen that wrap alone
          was adding ~30px of dead height to every card. */}
      <div className="flex flex-1 flex-col p-2 sm:p-3">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-900 dark:text-slate-100 sm:min-h-[2.5rem] sm:text-sm sm:leading-normal">
          {title}
        </p>

        {/* On phones the condition rides alongside the price. With the
            category pill hidden there, it was the only thing on the row
            below — a whole line spent on one small badge. It still wraps
            to its own line if a long price leaves it no room. */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:mt-1 sm:block">
          <p className="text-[15px] font-bold text-brand sm:text-base">
            {price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Free"}
          </p>
          {condition && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize sm:hidden ${conditionBadgeClasses(condition)}`}
            >
              {conditionLabel(condition)}
            </span>
          )}
        </div>

        {/* Tablet and up keep the category + condition row at the card foot,
            pinned to the bottom so cards in a row stay aligned. */}
        <div className="mt-auto hidden flex-wrap items-center gap-1 pt-2 sm:flex">
          {categoryName && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {categoryName}
            </span>
          )}
          {condition && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${conditionBadgeClasses(condition)}`}
            >
              {conditionLabel(condition)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
