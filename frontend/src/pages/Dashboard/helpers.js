export const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
          })
        : null;

export const formatLongDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;