import { APP_NAME } from "@/lib/data/nav";

/** Theme-switched Nabz wordmark logo (dark default when data-theme is unset). */
export default function BrandLogo() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nabz-logo-on-dark.svg"
        alt={APP_NAME}
        height={28}
        className="logo-on-dark h-7 w-auto shrink-0"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nabz-logo-on-light.svg"
        alt=""
        aria-hidden="true"
        height={28}
        className="logo-on-light h-7 w-auto shrink-0"
      />
    </>
  );
}
