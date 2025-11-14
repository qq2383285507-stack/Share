import { useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { FeedSort, useFeed } from "@dome/hooks/useFeed";
import { useContentEvent } from "@dome/hooks/useContentEvents";

const tabs: { label: string; value: FeedSort }[] = [
  { label: "最新", value: "latest" },
  { label: "热度", value: "trending" },
  { label: "推荐", value: "recommended" },
];

export function FeedScreen() {
  const [active, setActive] = useState<FeedSort>("recommended");
  const { data, isFetching, refetch } = useFeed(active);
  const contentEvent = useContentEvent();

  const onItemPress = async (contentId: string) => {
    try {
      await contentEvent.mutateAsync({
        event: "content.viewed",
        contentId,
        sort: active,
      });
    } catch (error) {
      console.warn("事件上报失败", error);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.tabRow} accessibilityRole="tablist">
        {tabs.map((tab) => (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === tab.value }}
            style={[styles.tab, active === tab.value && styles.tabActive]}
            onPress={() => setActive(tab.value)}
          >
            <Text style={styles.tabLabel}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        accessibilityRole="list"
        data={data}
        refreshing={isFetching}
        onRefresh={refetch}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onItemPress(item.id)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
            <Text style={styles.meta}>{item.topic} · {item.tags.slice(0, 2).join(" / ")}</Text>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>暂无内容</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12 },
  tabRow: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d5deff",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tabLabel: { color: "#111827", fontWeight: "600" },
  card: { padding: 16, borderRadius: 16, backgroundColor: "#fff", marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  summary: { marginTop: 4, color: "#4b5563" },
  meta: { marginTop: 8, color: "#64748b" },
  empty: { textAlign: "center", marginTop: 40, color: "#94a3b8" },
});
