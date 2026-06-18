import { useParams, type RouteDefinition } from "@solidjs/router";
import { Show } from "solid-js";
import { examQuery } from "~/lib/queries";
import { NotFound } from "~/components/states";
import ExamInfo from "~/pages/ExamInfo";

/*
  Second-level dynamic segment under a stream. Exam URLs end with "-exam"
  (e.g. /mba/cat-exam). The static "colleges" segment ranks above this dynamic
  one, so listing URLs are never captured here. Anything without the "-exam"
  suffix returns a server 404.
*/
const isExam = (seg: string) => seg.endsWith("-exam");
const examSlug = (seg: string) => seg.replace(/-exam$/, "");

export const route = {
  preload: ({ params }) => {
    const seg = params.exam ?? "";
    if (isExam(seg)) void examQuery(examSlug(seg));
  },
} satisfies RouteDefinition;

export default function ExamRoute() {
  const params = useParams();
  const seg = () => params.exam ?? "";
  return (
    <Show when={isExam(seg())} fallback={<NotFound title="Page not found" />}>
      <ExamInfo stream={params.stream ?? ""} slug={examSlug(seg())} />
    </Show>
  );
}
