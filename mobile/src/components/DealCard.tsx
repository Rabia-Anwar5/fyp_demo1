/**
 * DealCard component - displays a single ranked deal.
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Deal } from "../services/apiService";

interface Props { deal: Deal; }

export default function DealCard({ deal }: Props) {
  const expiryDate = new Date(deal.expiry).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });

  const copyCode = async () => {
    if (deal.coupon_code) await Clipboard.setStringAsync(deal.coupon_code);
  };

  return (
    <View style={[styles.card, deal.rank === 1 && styles.cardTop]}>
      {deal.rank === 1 && <View style={styles.topBadge}><Text style={styles.topBadgeText}>BEST DEAL</Text></View>}
      <View style={styles.row}>
        <Text style={styles.saving}>{deal.saving_percent}% off</Text>
        <Text style={styles.netSaving}>Save RM {deal.net_saving.toFixed(2)}</Text>
      </View>
      <Text style={styles.prices}>
        RM {deal.original_price.toFixed(2)} → RM {deal.discounted_price.toFixed(2)}
      </Text>
      <Text style={styles.store}>{deal.store_name}</Text>
      {deal.coupon_code && (
        <TouchableOpacity style={styles.codeBox} onPress={copyCode}>
          <Text style={styles.codeLabel}>CODE</Text>
          <Text style={styles.code}>{deal.coupon_code}</Text>
          <Text style={styles.copyHint}>tap to copy</Text>
        </TouchableOpacity>
      )}
      {deal.why_top && <Text style={styles.why}>{deal.why_top}</Text>}
      <Text style={styles.expiry}>Expires {expiryDate}</Text>
      {deal.terms ? <Text style={styles.terms}>{deal.terms}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#2a2a45",
  },
  cardTop: { borderColor: "#c84fff", borderWidth: 2 },
  topBadge: {
    alignSelf: "flex-start", backgroundColor: "#c84fff",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8,
  },
  topBadgeText: { color: "white", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saving: { fontSize: 20, fontWeight: "800", color: "#7cf7b0" },
  netSaving: { fontSize: 14, color: "#7cf7b0", fontWeight: "600" },
  prices: { color: "#c0c0e0", fontSize: 13, marginTop: 4 },
  store: { color: "#a0a0c0", fontSize: 12, marginTop: 6 },
  codeBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#0f0f17", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 10,
  },
  codeLabel: { fontSize: 10, color: "#606080", fontWeight: "700" },
  code: { flex: 1, color: "white", fontWeight: "700", fontSize: 15, letterSpacing: 1 },
  copyHint: { fontSize: 10, color: "#6c3fff" },
  why: { color: "#9060ff", fontSize: 11, marginTop: 8, fontStyle: "italic" },
  expiry: { color: "#606080", fontSize: 11, marginTop: 6 },
  terms: { color: "#404060", fontSize: 10, marginTop: 4 },
});