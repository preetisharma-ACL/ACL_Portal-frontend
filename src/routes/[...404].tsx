import Seo from "~/components/Seo";
import { NotFound } from "~/components/states";

export default function CatchAll() {
  return (
    <>
      <Seo title="Page not found" description="The page you requested could not be found." noindex />
      <NotFound />
    </>
  );
}
