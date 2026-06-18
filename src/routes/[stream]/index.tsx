import { useParams, type RouteDefinition } from "@solidjs/router";
import { Show } from "solid-js";
import { courseQuery, streamQuery } from "~/lib/queries";
import StreamLanding from "~/pages/StreamLanding";
import CourseInfo from "~/pages/CourseInfo";

/*
  Top-level single-segment dispatcher. Both "/mba" (stream landing) and
  "/mba-pgdm-course" (course info) are single path segments, so this one route
  serves both and branches on the "-course" suffix. Static routes such as
  /about and /search take priority over this dynamic segment.
*/
const isCourse = (seg: string) => seg.endsWith("-course");
const courseSlug = (seg: string) => seg.replace(/-course$/, "");

export const route = {
  preload: ({ params }) => {
    const seg = params.stream ?? "";
    if (isCourse(seg)) void courseQuery(courseSlug(seg));
    else void streamQuery(seg);
  },
} satisfies RouteDefinition;

export default function StreamOrCourse() {
  const params = useParams();
  const seg = () => params.stream ?? "";
  return (
    <Show when={isCourse(seg())} fallback={<StreamLanding slug={seg()} />}>
      <CourseInfo slug={courseSlug(seg())} />
    </Show>
  );
}
