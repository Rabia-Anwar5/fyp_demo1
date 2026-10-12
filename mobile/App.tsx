/**
 * CATCH Mobile - Main App Entry Point
 * Physical Mall Retail Shopping Assistant
 */
import React, { useState } from "react";
import { StyleSheet, View, SafeAreaView, StatusBar, Text, TouchableOpacity } from "react-native";
import CameraScreen from "./src/screens/CameraScreen";
import DealsHaulScreen from "./src/screens/DealsHaulScreen";
import { usePushNotifications } from "./src/hooks/usePushNotifications";

export default function App() {
  const [activeTab, setActiveTab] = useState<"camera" | "history" | "settings">("camera");
  const { expoPushToken, notification } = usePushNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f17" />
      
      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🎯 CATCH</Text>
          <Text style={styles.subtitle}>Contextual In-Store Shopping Assistant</Text>
        </View>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenText}>{expoPushToken ? "● Push Active" : "○ Local Only"}</Text>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === "camera" && <CameraScreen />}
        {activeTab === "history" && <DealsHaulScreen />}
        {activeTab === "settings" && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>Preferences & Push Settings</Text>
            <Text style={styles.placeholderSubtitle}>Device Token: {expoPushToken || "Simulated (Dev Mode)"}</Text>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "camera" && styles.tabItemActive]}
          onPress={() => setActiveTab("camera")}
        >
          <Text style={[styles.tabLabel, activeTab === "camera" && styles.tabLabelActive]}>📷 Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "history" && styles.tabItemActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabLabel, activeTab === "history" && styles.tabLabelActive]}>🏷️ Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "settings" && styles.tabItemActive]}
          onPress={() => setActiveTab("settings")}
        >
          <Text style={[styles.tabLabel, activeTab === "settings" && styles.tabLabelActive]}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f17",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#161622",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(108,63,255,0.2)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  tokenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 12,
  },
  tokenText: {
    fontSize: 10,
    color: "#10b981",
    fontWeight: "700",
  },
  body: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#161622",
    borderTopWidth: 1,
    borderTopColor: "rgba(108,63,255,0.2)",
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: "#6c3fff",
  },
  tabLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#c084fc",
    fontWeight: "700",
  },
});
