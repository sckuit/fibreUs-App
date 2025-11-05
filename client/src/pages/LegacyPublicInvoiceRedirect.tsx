import { useRoute, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function LegacyPublicInvoiceRedirect() {
  const [, params] = useRoute("/public/invoice/:token");
  const token = params?.token;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/public/invoice', token],
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const redirectData = data as { redirectTo?: string } | undefined;

  if (isError || !redirectData?.redirectTo) {
    return <Redirect to="/" />;
  }

  return <Redirect to={redirectData.redirectTo} />;
}
