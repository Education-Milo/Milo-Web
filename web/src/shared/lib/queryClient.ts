import { QueryClient } from "@tanstack/react-query";

/**
 * Instance unique de QueryClient, partagée entre React (QueryClientProvider)
 * et le code hors composants (stores Zustand, contextes, callbacks réseau)
 * qui doit invalider des queries.
 */
export const queryClient = new QueryClient();
