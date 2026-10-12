import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function DealsHaulScreen() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const haulItems = [
    {
      id: "1",
      name: "Denim Trucker Jacket",
      store: "Denim Republic",
      unit: "Unit L2-204 (Level 2)",
      origPrice: 199.0,
      netPrice: 139.3,
      saving: 59.7,
      percent: 30,
      code: "DENIM30",
    },
    {
      id: "2",
      name: "Tailored Wool Trench Coat",
      store: "Zara Central Mall",
      unit: "Unit L1-102 (Level 1)",
      origPrice: 249.0,
      netPrice: 186.75,
      saving: 62.25,
      percent: 25,
      code: "ZARA25",
    },
  ];

  const totalOrig = haulItems.reduce((a, b) => a + b.origPrice, 0);
  const totalNet = haulItems.reduce((a, b) => a + b.netPrice, 0);
  const totalSaved = haulItems.reduce((a, b) => a + b.saving, 0);
  const target = 200.0;
  const progressPct = Math.min(100, Math.round((totalNet / target) * 100));

  const handleCopy = (code: string) => {
    setCopiedCode(code);
    Alert.alert("Code Copied", `Promo code "${code}" ready for cashier.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mall Milestone Card */}
      <View style={styles.milestoneCard}>
        <View style={styles.milestoneHeader}>
          <Text style={styles.milestoneTitle}>🏆 Mall VIP Spend Milestone</Text>
          <Text style={styles.milestoneAmount}>${totalNet.toFixed(2)} / ${target.toFixed(2)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.milestoneHint}>
          {totalNet >= target
            ? "🎉 UNLOCKED! Show pass at concierge for Free Valet + $20 Mall Voucher."
            : `Spend $${(target - totalNet).toFixed(2)} more to unlock Free Valet Parking.`}
        </Text>
      </View>

      {/* Savings Summary Banner */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Tag Price</Text>
          <Text style={styles.summaryValue}>${totalOrig.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net You Pay</Text>
          <Text style={[styles.summaryValue, styles.highlightNet]}>${totalNet.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Saved</Text>
          <Text style={[styles.summaryValue, styles.highlightGreen]}>-${totalSaved.toFixed(2)}</Text>
        </View>
      </View>

      {/* Items List */}
      <Text style={styles.sectionTitle}>🛍️ My Mall Haul Items</Text>
      {haulItems.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemStore}>{item.store} • {item.unit}</Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.percent}%</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.origPrice}>${item.origPrice.toFixed(2)}</Text>
            <Text style={styles.netPrice}>${item.netPrice.toFixed(2)}</Text>
            <Text style={styles.savedTag}>Saved ${item.saving.toFixed(2)}</Text>
          </View>

          <View style={styles.barcodeBox}>
            <Text style={styles.barcodeLabel}>REGISTER CASHIER BARCODE</Text>
            <View style={styles.barcodeLines} />
            <Text style={styles.barcodeCode}>*{item.code}-CATCH*</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => handleCopy(item.code)}
            >
              <Text style={styles.copyBtnText}>
                {copiedCode === item.code ? "✓ Copied" : "📋 Copy Promo Code"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f17",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  milestoneCard: {
    backgroundColor: "#161622",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fbbf24",
  },
  milestoneAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "Courier",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    marginVertical: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 999,
  },
  milestoneHint: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#161622",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(108, 63, 255, 0.2)",
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  highlightNet: {
    color: "#38bdf8",
  },
  highlightGreen: {
    color: "#10b981",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: "#161622",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 14,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  itemStore: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  discountText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "800",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 12,
  },
  origPrice: {
    fontSize: 13,
    color: "#64748b",
    textDecorationLine: "line-through",
  },
  netPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10b981",
  },
  savedTag: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
  },
  barcodeBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  barcodeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 6,
  },
  barcodeLines: {
    width: "90%",
    height: 28,
    backgroundColor: "#0f172a",
    marginVertical: 4,
  },
  barcodeCode: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: 2,
    marginVertical: 4,
  },
  copyBtn: {
    marginTop: 8,
    backgroundColor: "#6c3fff",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});
