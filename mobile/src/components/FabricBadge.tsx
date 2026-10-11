import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props { type?: string; quality?: string; }

const FABRIC_COLORS: Record<string, string> = {
  denim: "#3b82f6", cotton: "#22c55e", polyester: "#f59e0b",
  wool: "#a78bfa", blend: "#94a3b8",
};

export default function FabricBadge({ type, quality }: Props) {
  if (!type) return null;
  const color = FABRIC_COLORS[type] ?? "#6c3fff";
  return (
    <View style={styles.container}>
      <View style={[styles.typeBadge, { backgroundColor: color + "22", borderColor: color }]}>
        <Text style={[styles.typeText, { color }]}>{type.toUpperCase()}</Text>
      </View>
      {quality && (
        <View style={styles.qualityBadge}>
          <Text style={styles.qualityText}>{quality === "premium" ? "⭐ Premium" : "Standard"}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 8, marginVertical: 8 },
  typeBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  qualityBadge: { backgroundColor: "#2a2a45", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  qualityText: { color: "#c0c0e0", fontSize: 11 },
});