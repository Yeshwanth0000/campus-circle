import Image from "next/image";

export default function Avatar({
  avatarUrl,
  name,
  size = 40,
  className = "",
}: {
  avatarUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-brand-light text-brand-dark ${className}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-bold"
          style={{ fontSize: size * 0.4 }}
        >
          {(name || "S").charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
