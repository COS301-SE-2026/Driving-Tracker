import Link from "next/link";

const APK_URL = "";

export default function Footer() {
  return (
    <footer className = "reverseHero-gradient border-t border-[var(--color-border)] px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row">
      {/*Logo*/}
      <div className = "flex flex-col gap-2">
        <div className="leading-none">
          <span className = "text-xl font-semibold text-[var(--color-bg)]">driving </span>
          <span className = "text-xl font-semibold text-[var(--color-text)]">tracker</span>
          </div>
  
      <p className="text-2xl font-bold text-[var(--color-text)]">
        Track · Analyze · Improve
      </p>
      </div>

      {/*Contact*/}
      <div className = "flex flex-col gap-2">
        <h3 className = "text-lg font-semibold"> Contact Us</h3>
        <a href="mailto:omnitech.capstone@gmail.com">omnitech.capstone@gmail.com</a>
        <p className="text-[var(--color-text)]"> University of Pretoria</p>
      </div>

      {/*Download*/}
      <div className = "flex flex-col gap-2">
        <h3 className = "text-lg font-semibold">Download the App</h3>
        <a href = {APK_URL}
        download
        className = "rounded-full border border-[var(--color-primary)] px-6 py-2 font-medium text-[var(--color-primary)] transition-all duration-200 hover:bg-[var(--color-secondary)] hover:text-white"
        >
        Download
        </a>
      </div>

      {/*Help*/}
      <div className = "flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Support</h3>
        <Link href = "/help" className="transition-colors hover:text-[var(--color-secondary)]">Help Center</Link>
      </div>
      </div>
    </footer>
  );
}