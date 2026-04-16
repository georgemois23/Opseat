import { Navigate, useParams } from "react-router-dom";

/** Old links: /browse/pizza → /browse?c=pizza ; /browse/all → /browse */
export default function BrowseLegacyRedirect() {
  const { category } = useParams<{ category: string }>();
  const c = category?.toLowerCase() ?? "";
  if (!c || c === "all") {
    return <Navigate to="/browse" replace />;
  }
  return <Navigate to={`/browse?c=${encodeURIComponent(c)}`} replace />;
}
