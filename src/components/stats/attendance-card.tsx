import { ProgressMeter } from "@/components/progress/progress-meter";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Attendance } from "@/lib/stats/queries";

/**
 * One ratio against a whole → a meter, not a pie. The counts sit beside it as text, each
 * with its own icon and label, so no meaning rests on colour alone.
 */
export function AttendanceCard({ attendance, t }: { attendance: Attendance; t: Dictionary["insights"] }) {
  const { done, missed, upcoming, rate } = attendance;
  const finished = done + missed;

  if (finished === 0) {
    return (
      <p className="text-sm text-zinc-500">
        {upcoming > 0 ? format(t.attendanceUpcoming, { n: upcoming }) : t.attendanceNone}
      </p>
    );
  }

  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight">{rate}%</p>
      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{format(t.attendanceOf, { n: finished })}</p>
      <ProgressMeter
        value={done}
        max={finished}
        label={format(t.attendanceLabel, { done, total: finished })}
        className="mt-3"
      />
      <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <li>
          <span aria-hidden>✅</span> {format(t.sessionsKept, { n: done })}
        </li>
        <li>
          <span aria-hidden>⚠️</span> {format(t.sessionsMissed, { n: missed })}
        </li>
      </ul>
    </div>
  );
}
