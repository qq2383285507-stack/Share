import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FeedScreen } from "../src/components/FeedScreen";
import { SafeAreaView, StatusBar } from "react-native";
import { useMemo } from "react";

export default function App() {
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnReconnect: true,
            retry: 2,
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={client}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f6fb" }}>
        <FeedScreen />
      </SafeAreaView>
    </QueryClientProvider>
  );
}
