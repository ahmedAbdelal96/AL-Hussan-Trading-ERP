import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
}

export function PersonAvatar({
  src,
  alt = "User avatar",
  className,
  fallbackClassName,
  iconClassName,
}: PersonAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = Boolean(src) && !imgError;

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] flex items-center justify-center shrink-0",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={cn(
            "inline-flex items-center justify-center h-full w-full",
            fallbackClassName,
          )}
          aria-hidden="true"
        >
          <User
            className={cn("h-5 w-5 text-[var(--icon-secondary)]", iconClassName)}
          />
        </span>
      )}
    </div>
  );
}

