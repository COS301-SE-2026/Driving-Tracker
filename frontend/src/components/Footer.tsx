import Link from "next/link";

export default function Footer() {
  return (
    <footer className = "flex flex-col md:flex-row justify-between gap-10 px-6 py-12">
      {/*Logo*/}
      <div className = "flex flex-col gap-1">
        <span className = "text-xl font-semibold">driving tracker</span>
        <span> Track · Analyze · Improve</span>
      </div>

      {/*Contact*/}
      <div className = "flex flex-col gap-1">
        <span className = "font-semibold"> Contact Us</span>
        <a href="mailto:omnitech.capstone@gmail.com">omnitech.capstone@gmail.com</a>
        <span> University of Pretoria</span>
      </div>

      {/*Download*/}
      <div className = "flex flex-col gap-2">
        <span className = "font-semibold">Download the App</span>
        <button className = "rounded-full border px-6 py-2 w-fit">
          Download
        </button>
      </div>

      {/*Help*/}
      <div className = "flex flex-col gap-1">
        <Link href = "/help">Help</Link>
      </div>
    </footer>
  );
}