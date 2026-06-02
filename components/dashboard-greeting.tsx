"use client";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting() {
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);

  return (
    <div>
      <h1 className="text-lg font-semibold tracking-tight text-cream">
        {greeting}, Analyst <span aria-hidden>👋</span>
      </h1>
      <p className="mt-0.5 text-[12px] text-muted">Here&apos;s what&apos;s happening across all your targets.</p>
    </div>
  );
}
