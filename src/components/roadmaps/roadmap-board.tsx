"use client";

import {
  closestCenter,
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useRef, useState, useTransition } from "react";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  createLesson,
  createPhase,
  deleteLesson,
  deletePhase,
  renamePhase,
  reorderRoadmap,
} from "@/lib/roadmaps/actions";
import { reopenLesson } from "@/lib/progress/actions";
import type { LessonItem, PhaseWithLessons } from "@/lib/roadmaps/queries";
import { CompleteDialog } from "@/components/progress/complete-dialog";
import { DoneCheckbox } from "@/components/progress/done-checkbox";
import { ProgressMeter } from "@/components/progress/progress-meter";
import { iconBtn, inputCls } from "@/components/ui";
import { InlineAdd } from "./inline-add";
import { LessonDialog } from "./lesson-dialog";

type T = Dictionary["roadmaps"];
type TP = Dictionary["progress"];
type TV = Dictionary["lessonView"];
type TPr = Dictionary["practice"];
type TSp = Dictionary["speaking"];

// Draggable ids are namespaced so phases, lessons and drop zones never collide.
const P = (id: string) => `p:${id}`;
const L = (id: string) => `l:${id}`;
const D = (id: string) => `d:${id}`;
const kind = (id: string | number) => String(id).slice(0, 1) as "p" | "l" | "d";
const raw = (id: string | number) => String(id).slice(2);

const orderSignature = (list: PhaseWithLessons[]) =>
  list.map((p) => `${p.id}:${p.lessons.map((l) => l.id).join(",")}`).join("|");

const phaseOfLesson = (list: PhaseWithLessons[], lessonId: string) =>
  list.find((p) => p.lessons.some((l) => l.id === lessonId));

/** Phases only collide with phases; lessons prefer lesson targets, then empty-phase drop zones. */
const collisionDetection: CollisionDetection = (args) => {
  if (kind(args.active.id) === "p") {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => kind(c.id) === "p"),
    });
  }
  const targets = args.droppableContainers.filter((c) => kind(c.id) !== "p");
  const hits = pointerWithin({ ...args, droppableContainers: targets });
  const lessonHit = hits.find((c) => kind(c.id) === "l" && c.id !== args.active.id);
  if (lessonHit) return [lessonHit];
  if (hits.length) return hits;
  return closestCorners({ ...args, droppableContainers: targets });
};

export function RoadmapBoard({
  roadmapId,
  phases,
  t,
  tp,
  tv,
  tpr,
  tsp,
}: {
  roadmapId: string;
  phases: PhaseWithLessons[];
  t: T;
  tp: TP;
  tv: TV;
  tpr: TPr;
  tsp: TSp;
}) {
  // Local copy for optimistic drag & drop; re-sync whenever the server sends fresh data.
  const [prevPhases, setPrevPhases] = useState(phases);
  const [items, setItems] = useState(phases);
  if (phases !== prevPhases) {
    setPrevPhases(phases);
    setItems(phases);
  }

  const [editing, setEditing] = useState<LessonItem | null>(null);
  const [completing, setCompleting] = useState<LessonItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const snapshot = useRef<PhaseWithLessons[] | null>(null);
  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart() {
    snapshot.current = items;
    setError(null);
  }

  // Move a lesson into another phase while hovering, so the list opens up a slot.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || kind(active.id) !== "l") return;
    const lessonId = raw(active.id);

    setItems((prev) => {
      const from = phaseOfLesson(prev, lessonId);
      let toPhaseId: string | undefined;
      let toIndex = 0;
      if (kind(over.id) === "d") {
        toPhaseId = raw(over.id);
        toIndex = prev.find((p) => p.id === toPhaseId)?.lessons.length ?? 0;
      } else if (kind(over.id) === "l") {
        const to = phaseOfLesson(prev, raw(over.id));
        toPhaseId = to?.id;
        toIndex = to?.lessons.findIndex((l) => l.id === raw(over.id)) ?? 0;
      }
      if (!from || !toPhaseId || from.id === toPhaseId) return prev;

      const lesson = from.lessons.find((l) => l.id === lessonId)!;
      return prev.map((p) => {
        if (p.id === from.id) return { ...p, lessons: p.lessons.filter((l) => l.id !== lessonId) };
        if (p.id === toPhaseId) {
          const lessons = [...p.lessons];
          lessons.splice(toIndex, 0, lesson);
          return { ...p, lessons };
        }
        return p;
      });
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const before = snapshot.current;
    snapshot.current = null;
    if (!before) return;
    if (!over) return setItems(before);

    let next = items;
    if (kind(active.id) === "p" && kind(over.id) === "p" && active.id !== over.id) {
      const from = items.findIndex((p) => P(p.id) === active.id);
      const to = items.findIndex((p) => P(p.id) === over.id);
      next = arrayMove(items, from, to);
    } else if (kind(active.id) === "l" && kind(over.id) === "l" && active.id !== over.id) {
      const phase = phaseOfLesson(items, raw(active.id));
      if (phase && phase === phaseOfLesson(items, raw(over.id))) {
        const from = phase.lessons.findIndex((l) => l.id === raw(active.id));
        const to = phase.lessons.findIndex((l) => l.id === raw(over.id));
        next = items.map((p) => (p.id === phase.id ? { ...p, lessons: arrayMove(p.lessons, from, to) } : p));
      }
    }
    setItems(next);

    if (orderSignature(next) === orderSignature(before)) return;
    startTransition(async () => {
      const res = await reorderRoadmap({
        roadmapId,
        phases: next.map((p) => ({ id: p.id, lessonIds: p.lessons.map((l) => l.id) })),
      });
      if (!res.ok) {
        setItems(before);
        setError(t.saveError);
      }
    });
  }

  const setLessonDone = (lessonId: string, completed: boolean) =>
    setItems((prev) =>
      prev.map((p) => ({
        ...p,
        lessons: p.lessons.map((l) => (l.id === lessonId ? { ...l, completed } : l)),
      })),
    );

  /** Unchecked → open the "Nice work" dialog. Checked → reopen right away (optimistic). */
  function toggleDone(lesson: LessonItem) {
    setError(null);
    if (!lesson.completed) return setCompleting(lesson);
    setLessonDone(lesson.id, false);
    startTransition(async () => {
      const res = await reopenLesson(lesson.id);
      if (!res.ok) {
        setLessonDone(lesson.id, true);
        setError(tp.error);
      }
    });
  }

  function onDragCancel() {
    if (snapshot.current) setItems(snapshot.current);
    snapshot.current = null;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-zinc-500 dark:border-white/15">
          {t.noPhases}
        </div>
      )}

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <SortableContext items={items.map((p) => P(p.id))} strategy={verticalListSortingStrategy}>
          {items.map((phase, i) => (
            <SortablePhase
              key={phase.id}
              index={i}
              phase={phase}
              t={t}
              tp={tp}
              tpr={tpr}
              onEditLesson={setEditing}
              onToggleDone={toggleDone}
              onError={() => setError(t.saveError)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <InlineAdd
        variant="primary"
        label={t.addPhase}
        placeholder={t.phasePlaceholder}
        cancelLabel={t.form.cancel}
        errorLabel={t.saveError}
        onAdd={(title) => createPhase(roadmapId, title)}
      />

      {editing && (
        <LessonDialog
          lesson={editing}
          t={t}
          tv={tv}
          tp={tpr}
          tsp={tsp}
          markDoneLabel={tp.markDone}
          onMarkDone={() => setCompleting(editing)}
          onClose={() => setEditing(null)}
        />
      )}
      {completing && (
        <CompleteDialog
          lesson={completing}
          t={tp}
          onDone={() => setLessonDone(completing.id, true)}
          onClose={() => setCompleting(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function DragHandle({ label, ...props }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} className={`${iconBtn} cursor-grab touch-none active:cursor-grabbing`} {...props}>
      <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
        <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
        <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
        <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
      </svg>
    </button>
  );
}

function SortablePhase({
  phase,
  index,
  t,
  tp,
  tpr,
  onEditLesson,
  onToggleDone,
  onError,
}: {
  phase: PhaseWithLessons;
  index: number;
  t: T;
  tp: TP;
  tpr: TPr;
  onEditLesson: (l: LessonItem) => void;
  onToggleDone: (l: LessonItem) => void;
  onError: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: P(phase.id) });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: D(phase.id) });
  const [renaming, setRenaming] = useState(false);
  const [pending, startTransition] = useTransition();
  const totalMin = phase.lessons.reduce((s, l) => s + l.estimatedMinutes, 0);
  const doneCount = phase.lessons.filter((l) => l.completed).length;
  const doneLabel = format(tp.lessonsDone, { done: doneCount, total: phase.lessons.length });

  function rename(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    setRenaming(false);
    if (!title || title === phase.title) return;
    startTransition(async () => {
      if (!(await renamePhase(phase.id, title)).ok) onError();
    });
  }

  function remove() {
    if (!confirm(t.confirmDeletePhase)) return;
    startTransition(async () => {
      if (!(await deletePhase(phase.id)).ok) onError();
    });
  }

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`rounded-2xl border border-black/5 bg-background p-4 dark:border-white/10 ${
        isDragging ? "relative z-10 opacity-80 shadow-lg" : ""
      } ${pending ? "opacity-60" : ""}`}
    >
      <header className="flex items-center gap-2">
        <DragHandle label={t.dragHandle} {...attributes} {...listeners} />
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {index + 1}
        </span>
        {renaming ? (
          <form action={rename} className="flex-1">
            <input
              name="title"
              autoFocus
              defaultValue={phase.title}
              maxLength={200}
              className={inputCls}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
            />
          </form>
        ) : (
          <h2
            className="min-w-0 flex-1 cursor-text truncate font-semibold"
            title={t.rename}
            onDoubleClick={() => setRenaming(true)}
          >
            {phase.title}
          </h2>
        )}
        <span className="shrink-0 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {doneCount}/{phase.lessons.length}
          </span>
          <span className="hidden sm:inline"> · {totalMin} {t.minutes}</span>
        </span>
        <button type="button" className={iconBtn} aria-label={t.rename} title={t.rename} onClick={() => setRenaming(true)}>
          ✏️
        </button>
        <button type="button" className={iconBtn} aria-label={t.delete} title={t.delete} onClick={remove}>
          🗑️
        </button>
      </header>

      {phase.lessons.length > 0 && (
        <ProgressMeter value={doneCount} max={phase.lessons.length} label={doneLabel} size="sm" className="mt-3" />
      )}

      <div
        ref={setDropRef}
        className={`mt-3 space-y-2 rounded-xl transition-colors ${isOver ? "bg-indigo-50/60 dark:bg-indigo-500/5" : ""}`}
      >
        <SortableContext items={phase.lessons.map((l) => L(l.id))} strategy={verticalListSortingStrategy}>
          {phase.lessons.map((lesson) => (
            <SortableLesson
              key={lesson.id}
              lesson={lesson}
              t={t}
              tp={tp}
              tpr={tpr}
              onEdit={onEditLesson}
              onToggleDone={onToggleDone}
              onError={onError}
            />
          ))}
        </SortableContext>
        {phase.lessons.length === 0 && (
          <p className="rounded-xl border border-dashed border-black/10 p-4 text-center text-sm text-zinc-500 dark:border-white/15">
            {t.noLessons}
          </p>
        )}
      </div>

      <div className="mt-2">
        <InlineAdd
          label={t.addLesson}
          placeholder={t.lessonPlaceholder}
          cancelLabel={t.form.cancel}
          errorLabel={t.saveError}
          onAdd={(title) => createLesson(phase.id, title)}
        />
      </div>
    </section>
  );
}

function SortableLesson({
  lesson,
  t,
  tp,
  tpr,
  onEdit,
  onToggleDone,
  onError,
}: {
  lesson: LessonItem;
  t: T;
  tp: TP;
  tpr: TPr;
  onEdit: (l: LessonItem) => void;
  onToggleDone: (l: LessonItem) => void;
  onError: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: L(lesson.id) });
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm(t.confirmDeleteLesson)) return;
    startTransition(async () => {
      if (!(await deleteLesson(lesson.id)).ok) onError();
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border border-black/5 bg-zinc-50 px-2 py-1.5 dark:border-white/10 dark:bg-white/5 ${
        isDragging ? "relative z-20 shadow-md" : ""
      } ${pending ? "opacity-50" : ""}`}
    >
      <DragHandle label={t.dragHandle} {...attributes} {...listeners} />
      <DoneCheckbox
        checked={lesson.completed}
        label={lesson.completed ? tp.reopen : tp.markDone}
        onClick={() => onToggleDone(lesson)}
      />
      <button
        type="button"
        className={`min-w-0 flex-1 truncate text-left text-sm hover:underline ${
          lesson.completed ? "text-zinc-400 line-through decoration-zinc-400/60" : ""
        }`}
        onClick={() => onEdit(lesson)}
      >
        {lesson.title}
      </button>
      {lesson.exerciseCount > 0 && (
        <span
          className={`shrink-0 text-xs tabular-nums ${
            lesson.practiceCorrect >= lesson.exerciseCount ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
          }`}
          title={`${tpr.title}: ${lesson.practiceCorrect}/${lesson.exerciseCount}`}
        >
          📝 {lesson.practiceCorrect}/{lesson.exerciseCount}
        </span>
      )}
      {lesson.resourceUrls.length > 0 && (
        <span className="hidden shrink-0 text-xs text-zinc-500 sm:inline">
          🔗 {format(t.lesson.links, { n: lesson.resourceUrls.length })}
        </span>
      )}
      <span className="shrink-0 text-xs text-zinc-500">
        {lesson.estimatedMinutes} {t.minutes}
      </span>
      <button type="button" className={iconBtn} aria-label={t.edit} title={t.edit} onClick={() => onEdit(lesson)}>
        ✏️
      </button>
      <button type="button" className={iconBtn} aria-label={t.delete} title={t.delete} onClick={remove}>
        🗑️
      </button>
    </div>
  );
}
