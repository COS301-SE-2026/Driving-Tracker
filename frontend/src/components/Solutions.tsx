const PROBLEMSANDSOLUTIONS = [
  {
    problem: "Unsafe driving habits",
    solution: "Driving Tracker provides real-time safety monitoring, alerts, and driving scores.",
  },
  {
    problem: "Poor Fuel Efficiency and/or a rise in fuel prices",
    solution: "Driving Tracker gives you eco-driving analysis and fuel-saving recommendations.",
  },
  {
    problem: "Fragmented Driving Tools",
    solution: "Driving Tracker is an all-in-one platform integrating navigation, diagnostics, safety, and social features.",
  },
];

export default function Solutions() {
  return(
    <section id = "solutions" className = "px-6 py-16">
      <div className = "flex justify-between mb-12">
        <h2 className = "text-3xl font-bold">Modern Problems</h2>
        <h2 className = "text-3xl font-bold">Solutions</h2>
      </div>

      <div className = "flex flex-col gap-10">
        {PROBLEMSANDSOLUTIONS.map((pair) => (
          <div key = {pair.problem} className = "flex items-center gap-6">
            <div className = "flex-1 rounded-2xl border p-6">
              <p>{pair.problem}</p>
            </div>

            <span aria-hidden className = "flex-shrink-0">
              →
            </span>

            <div className = "flex-1 rounded-2xl border p-6">
              <p>{pair.solution}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}