import type { Notice } from "../types/app";

type NoticeBannerProps = {
  notice: Notice;
};

export function NoticeBanner({ notice }: NoticeBannerProps) {
  return (
    <section className={`notice-banner notice-${notice.tone}`}>
      <span className="notice-dot" />
      <p>{notice.message}</p>
    </section>
  );
}
