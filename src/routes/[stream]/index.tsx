import { useParams, type RouteDefinition } from "@solidjs/router";
import { Match, Switch } from "solid-js";
import { allCollegesQuery, courseQuery, streamQuery } from "~/lib/queries";
import StreamLanding from "~/pages/StreamLanding";
import CourseInfo from "~/pages/CourseInfo";
import Directory from "~/pages/Directory";

/*
  Top-level single-segment dispatcher. "/university" is the all-institutions
  directory; "/mba-pgdm-course" is a course page (ends in "-course"); anything
  else (e.g. "/mba") is a stream landing. Static routes such as /about and
  /search take priority over this dynamic segment.
*/
const isCourse = (seg: string) => seg.endsWith("-course");
const courseSlug = (seg: string) => seg.replace(/-course$/, "");
const isDirectory = (seg: string) => seg === "university";

export const route = {
  preload: ({ params }) => {
    const seg = params.stream ?? "";
    if (isDirectory(seg)) void allCollegesQuery();
    else if (isCourse(seg)) void courseQuery(courseSlug(seg));
    else void streamQuery(seg);
  },
} satisfies RouteDefinition;

export default function StreamOrCourse() {
  const params = useParams();
  const seg = () => params.stream ?? "";
  return (
    <Switch fallback={<StreamLanding slug={seg()} />}>
      <Match when={isDirectory(seg())}>
        <Directory />
      </Match>
      <Match when={isCourse(seg())}>
        <CourseInfo slug={courseSlug(seg())} />
      </Match>
    </Switch>
  );
}
