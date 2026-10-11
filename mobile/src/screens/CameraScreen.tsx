/**
 * CameraScreen - Main scanning screen.
 * Uses expo-camera for capture, compresses image before upload,
 * shows recognition result and deal overlay.
 */
import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, Dimensions, ScrollView,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { recognizeImage, fetchDeals, RecognitionResult, Deal } from "../services/apiService";
import DealCard from "../components/DealCard";
import FabricBadge from "../components/FabricBadge";

const { width: SCREEN_W } = Dimensions.get("window");

type AppState = "idle" | "capturing" | "uploading" | "deals" | "uncertain" | "error";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<AppState>("idle");
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const cameraRef = useRef<any>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || state === "capturing" || state === "uploading") return;

    setState("capturing");
    try {
      // Capture
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });

      // Compress: target ~200KB for fast upload (Tier-1 edge processing)
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );

      setState("uploading");
      const result = await recognizeImage(compressed.uri, "mobile_user_01", "mall_001");
      setRecognition(result);

      if (result.status === "uncertain") {
        setState("uncertain");
        return;
      }

      if (result.status === "recognized" && result.item_context_id) {
        // Fetch deals (agentic - no manual search)
        const dealsResp = await fetchDeals(
          result.item_context_id,
          result.category!,
          result.subcategory!,
          { fabricType: result.fabric?.type, userId: "mobile_user_01", mallId: "mall_001" }
        );
        setDeals(dealsResp.deals);
        setState("deals");
      } else {
        setErrorMsg(result.message ?? "Recognition failed");
        setState("error");
      }
    } catch (err: any) {
      console.error("Capture error:", err);
      setErrorMsg(err?.message ?? "Network error");
      setState("error");
    }
  }, [state]);

  const reset = () => {
    setState("idle");
    setRecognition(null);
    setDeals([]);
    setErrorMsg("");
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>CATCH needs camera access to recognise products.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera viewfinder */}
      {(state === "idle" || state === "capturing") && (
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          {/* Scan frame overlay */}
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>Point at a product to scan</Text>
          <TouchableOpacity
            style={[styles.captureBtn, state === "capturing" && styles.captureBtnActive]}
            onPress={handleCapture}
            disabled={state === "capturing"}
          >
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
        </CameraView>
      )}

      {/* Loading state */}
      {state === "uploading" && (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color="#c84fff" />
          <Text style={styles.loadingText}>Recognising product...</Text>
          <Text style={styles.loadingSubtext}>Analysing with AI...</Text>
        </View>
      )}

      {/* Uncertain - ask for retake */}
      {state === "uncertain" && (
        <View style={styles.resultView}>
          <Text style={styles.uncertainIcon}>📷</Text>
          <Text style={styles.resultTitle}>Not quite clear</Text>
          <Text style={styles.resultSub}>
            {recognition?.message ?? "Low confidence. Please retake in better lighting."}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={reset}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Deals view */}
      {state === "deals" && recognition && (
        <View style={styles.resultView}>
          <View style={styles.recognitionHeader}>
            <Text style={styles.categoryLabel}>
              {recognition.category?.toUpperCase()} · {recognition.subcategory}
            </Text>
            <Text style={styles.confidence}>{((recognition.confidence ?? 0) * 100).toFixed(0)}% confident</Text>
          </View>

          {recognition.fabric && (
            <FabricBadge type={recognition.fabric.type} quality={recognition.fabric.quality_tier} />
          )}

          <Text style={styles.dealsHeading}>
            {deals.length > 0 ? `${deals.length} deals found` : "No deals found"}
          </Text>

          <ScrollView style={styles.dealsList} showsVerticalScrollIndicator={false}>
            {deals.map((d) => <DealCard key={d.deal_id} deal={d} />)}
            {deals.length === 0 && (
              <Text style={styles.noDeals}>No matching promotions at nearby stores.</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.btn} onPress={reset}>
            <Text style={styles.btnText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error state */}
      {state === "error" && (
        <View style={styles.resultView}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.resultTitle}>Something went wrong</Text>
          <Text style={styles.resultSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.btn} onPress={reset}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f17" },
  camera: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  scanFrame: {
    position: "absolute", top: "20%", left: "15%",
    width: "70%", height: "50%",
    borderWidth: 2, borderColor: "#c84fff", borderRadius: 16,
    opacity: 0.7,
  },
  hint: { position: "absolute", top: "15%", color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: "white",
    justifyContent: "center", alignItems: "center",
    marginBottom: 40,
  },
  captureBtnActive: { borderColor: "#c84fff" },
  captureBtnInner: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "white",
  },
  loadingView: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: "white", fontSize: 18, fontWeight: "700" },
  loadingSubtext: { color: "#a0a0c0", fontSize: 13 },
  resultView: { flex: 1, padding: 24, paddingTop: 60 },
  recognitionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  categoryLabel: { color: "white", fontSize: 18, fontWeight: "700" },
  confidence: { color: "#7cf7b0", fontSize: 13, alignSelf: "center" },
  dealsHeading: { color: "#c084fc", fontSize: 15, fontWeight: "600", marginVertical: 12 },
  dealsList: { flex: 1 },
  noDeals: { color: "#606080", textAlign: "center", marginTop: 32 },
  btn: {
    backgroundColor: "#6c3fff", borderRadius: 12,
    paddingVertical: 14, marginTop: 16, alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "700", fontSize: 16 },
  permissionText: { color: "white", textAlign: "center", margin: 32, fontSize: 15 },
  uncertainIcon: { fontSize: 48, textAlign: "center", marginBottom: 16 },
  resultTitle: { color: "white", fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  resultSub: { color: "#a0a0c0", fontSize: 14, textAlign: "center", marginBottom: 24 },
  errorIcon: { fontSize: 48, textAlign: "center", marginBottom: 16 },
});