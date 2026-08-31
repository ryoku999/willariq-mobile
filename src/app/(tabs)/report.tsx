import { incidentSchema } from "@/features/incidents/schemas/incident.schema";
import type { IncidentFormValues } from "@/features/incidents/schemas/incident.schema";
import { useSubmitIncident } from "@/infrastructure/hooks/use-incidents";
import { useIncidentDraftStore } from "@/infrastructure/storage/incident-draft-storage";
import { KeyboardAwareScrollView } from "@/presentation/components/KeyboardAwareScrollView";
import { getCurrentCoordinates } from "@/shared/utils/get-current-coordinates";
import {
  deleteIncidentImage,
  prepareIncidentImage,
} from "@/shared/utils/incident-images";
import Feather from "@expo/vector-icons/Feather";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const STEPS = ["Descripción", "Ubicación", "Evidencias", "Revisión"];
const MAX_EVIDENCES = 10;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

const ReportPage = () => {
  const isDark = useColorScheme() === "dark";
  const [step, setStep] = useState(0);
  const [isHydrated, setHydrated] = useState(
    useIncidentDraftStore.persist.hasHydrated(),
  );
  const [isLocating, setLocating] = useState(false);
  const [isPreparingImages, setPreparingImages] = useState(false);
  const draft = useIncidentDraftStore((state) => state.draft);
  const updateDetails = useIncidentDraftStore((state) => state.updateDetails);
  const setCoordinates = useIncidentDraftStore((state) => state.setCoordinates);
  const addEvidences = useIncidentDraftStore((state) => state.addEvidences);
  const removeEvidence = useIncidentDraftStore((state) => state.removeEvidence);
  const submitIncident = useSubmitIncident();

  const {
    control,
    getValues,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      originalMessage: draft.originalMessage,
      address: draft.address,
      addressReference: draft.addressReference,
    },
  });

  const message = watch("originalMessage");

  useEffect(() => {
    const unsubscribe = useIncidentDraftStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useIncidentDraftStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const restored = useIncidentDraftStore.getState().draft;
    reset({
      originalMessage: restored.originalMessage,
      address: restored.address,
      addressReference: restored.addressReference,
    });
  }, [isHydrated, reset]);

  const prepareAssets = async (
    assets: ImagePicker.ImagePickerAsset[],
    capturedAt?: string,
  ) => {
    const remaining = MAX_EVIDENCES - draft.evidences.length;
    if (remaining <= 0) {
      Alert.alert("Límite alcanzado", "Puedes adjuntar hasta 10 fotografías.");
      return;
    }

    setPreparingImages(true);
    const prepared = [];

    try {
      for (const asset of assets.slice(0, remaining)) {
        const evidence = await prepareIncidentImage(asset, capturedAt);
        const currentSize = draft.evidences.reduce(
          (total, item) => total + item.sizeBytes,
          0,
        );
        const pendingSize = prepared.reduce(
          (total, item) => total + item.sizeBytes,
          0,
        );

        if (currentSize + pendingSize + evidence.sizeBytes > MAX_TOTAL_SIZE) {
          deleteIncidentImage(evidence.uri);
          throw new Error("TOTAL_SIZE_EXCEEDED");
        }
        prepared.push(evidence);
      }

      if (prepared.length > 0) addEvidences(prepared);
    } catch (error) {
      prepared.forEach((evidence) => deleteIncidentImage(evidence.uri));
      Alert.alert(
        "No se pudo preparar la foto",
        error instanceof Error && error.message === "TOTAL_SIZE_EXCEEDED"
          ? "Las evidencias no pueden superar 100 MiB en total."
          : "Selecciona otra imagen e inténtalo nuevamente.",
      );
    } finally {
      setPreparingImages(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    void ImagePicker.getPendingResultAsync().then((result) => {
      if (result && "canceled" in result && !result.canceled) {
        void prepareAssets(result.assets);
      }
    });
    // Android can restore a picker result only once after recreating the activity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const saveDetails = () => {
    const values = incidentSchema.parse(getValues());
    updateDetails(values);
  };

  const continueFromDescription = async () => {
    if (!(await trigger())) return;
    saveDetails();
    setStep(1);
  };

  const locate = async () => {
    setLocating(true);
    try {
      const coordinates = await getCurrentCoordinates();
      setCoordinates(coordinates.latitude, coordinates.longitude);
    } catch (error) {
      Alert.alert(
        "Ubicación no disponible",
        error instanceof Error && error.message === "LOCATION_PERMISSION_DENIED"
          ? "Necesitamos permiso de ubicación para registrar la incidencia."
          : "Activa la ubicación del teléfono e inténtalo nuevamente.",
      );
    } finally {
      setLocating(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Habilita el acceso a la cámara para tomar una evidencia.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      cameraType: ImagePicker.CameraType.back,
    });
    if (!result.canceled) {
      await prepareAssets(result.assets, new Date().toISOString());
    }
  };

  const pickPhotos = async () => {
    const remaining = MAX_EVIDENCES - draft.evidences.length;
    if (remaining <= 0) {
      Alert.alert("Límite alcanzado", "Puedes adjuntar hasta 10 fotografías.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (!result.canceled) await prepareAssets(result.assets);
  };

  const removePhoto = (localId: string, uri: string) => {
    if (draft.serverIncident) {
      Alert.alert(
        "Borrador ya creado",
        "No puedes retirar evidencias después de iniciar el envío.",
      );
      return;
    }
    deleteIncidentImage(uri);
    removeEvidence(localId);
  };

  const send = () => {
    saveDetails();
    const currentDraft = useIncidentDraftStore.getState().draft;
    if (currentDraft.latitude === null || currentDraft.longitude === null) {
      setStep(1);
      return;
    }
    submitIncident.mutate(currentDraft, { onSuccess: () => setStep(4) });
  };

  const startAnother = () => {
    const nextDraft = useIncidentDraftStore.getState().draft;
    reset({
      originalMessage: nextDraft.originalMessage,
      address: nextDraft.address,
      addressReference: nextDraft.addressReference,
    });
    submitIncident.reset();
    setStep(0);
  };

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (step === 4 && submitIncident.data) {
    return (
      <View className="pt-safe flex-1 items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
        <View className="w-full items-center rounded-3xl bg-white p-7 dark:bg-gray-900">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <Feather name="check" size={30} color="#16a34a" />
          </View>
          <Text className="mt-5 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Incidencia enviada
          </Text>
          <Text className="mt-2 text-center text-gray-500 dark:text-gray-400">
            Guarda este código para consultar el avance de tu reporte.
          </Text>
          <View className="mt-5 w-full rounded-2xl bg-blue-50 px-5 py-4 dark:bg-blue-950">
            <Text className="text-center text-xs font-semibold tracking-widest text-blue-600 dark:text-blue-300">
              CÓDIGO DE SEGUIMIENTO
            </Text>
            <Text className="mt-1 text-center text-2xl font-bold text-blue-700 dark:text-blue-200">
              {submitIncident.data.trackingCode}
            </Text>
          </View>
          <Text className="mt-4 text-sm font-medium text-amber-700 dark:text-amber-300">
            Estado: En análisis
          </Text>
          <Pressable
            onPress={startAnother}
            className="mt-7 min-h-13 w-full items-center justify-center rounded-2xl bg-blue-600 px-5"
          >
            <Text className="font-semibold text-white">
              Reportar otra incidencia
            </Text>
          </Pressable>
          <Text className="mt-3 text-center text-xs text-gray-400">
            Consulta los detalles desde la pestaña Incidencias.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      contentContainerClassName="pb-safe flex-grow"
      contentContainerStyle={{ paddingBottom: 32 }}
      bottomOffset={20}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <View className="pt-safe bg-blue-600 px-5 pb-8 dark:bg-blue-950">
        <Text className="mt-5 text-xs font-semibold tracking-widest text-blue-100">
          NUEVA INCIDENCIA
        </Text>
        <Text className="mt-2 text-3xl font-bold text-white">
          Cuéntanos qué ocurrió
        </Text>
        <Text className="mt-2 leading-5 text-blue-100">
          Registra el problema, su ubicación y las evidencias disponibles.
        </Text>
      </View>

      <View className="px-5 py-5">
        <View className="mb-5 flex-row items-center justify-between">
          {STEPS.map((label, index) => (
            <View key={label} className="flex-1 items-center">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${index <= step ? "bg-blue-600 dark:bg-blue-500" : "bg-gray-200 dark:bg-gray-800"}`}
              >
                <Text
                  className={`text-xs font-bold ${index <= step ? "text-white" : "text-gray-500"}`}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                className={`mt-1 text-[10px] ${index === step ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View className="rounded-3xl bg-white p-5 dark:bg-gray-900">
          {step === 0 && (
            <View>
              <SectionTitle
                title="Describe la incidencia"
                subtitle="Incluye detalles que ayuden a identificar el problema."
              />
              <Controller
                control={control}
                name="originalMessage"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    textAlignVertical="top"
                    placeholder="Ejemplo: Hay acumulación de basura junto al parque desde hace varios días..."
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                    className={`mt-5 min-h-40 rounded-2xl border bg-gray-50 p-4 text-base leading-6 text-gray-900 dark:bg-gray-950 dark:text-white ${errors.originalMessage ? "border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                  />
                )}
              />
              <View className="mt-1 flex-row justify-between">
                <FieldError message={errors.originalMessage?.message} />
                <Text className="ml-auto text-xs text-gray-400">
                  {message.length}/5000
                </Text>
              </View>

              <FieldLabel text="Dirección (opcional)" />
              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Av. Principal 123"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                )}
              />
              <FieldError message={errors.address?.message} />

              <FieldLabel text="Referencia (opcional)" />
              <Controller
                control={control}
                name="addressReference"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Al costado del parque municipal"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                )}
              />
              <FieldError message={errors.addressReference?.message} />

              <PrimaryButton
                label="Continuar"
                icon="arrow-right"
                onPress={continueFromDescription}
              />
            </View>
          )}

          {step === 1 && (
            <View>
              <SectionTitle
                title="Ubicación del problema"
                subtitle="Usaremos la ubicación únicamente para registrar esta incidencia."
              />
              <View className="mt-5 items-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Feather name="map-pin" size={25} color="#2563eb" />
                </View>
                {draft.latitude !== null && draft.longitude !== null ? (
                  <>
                    <Text className="mt-3 font-semibold text-green-700 dark:text-green-300">
                      Ubicación obtenida
                    </Text>
                    <Text className="mt-1 text-center text-sm text-gray-600 dark:text-gray-300">
                      {draft.latitude.toFixed(6)}, {draft.longitude.toFixed(6)}
                    </Text>
                  </>
                ) : (
                  <Text className="mt-3 text-center text-sm text-gray-600 dark:text-gray-300">
                    Aún no hemos obtenido las coordenadas.
                  </Text>
                )}
                <Pressable
                  disabled={isLocating}
                  onPress={locate}
                  className="mt-5 min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 disabled:opacity-50"
                >
                  {isLocating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Feather name="crosshair" size={18} color="white" />
                  )}
                  <Text className="font-semibold text-white">
                    {draft.latitude === null
                      ? "Usar mi ubicación actual"
                      : "Actualizar ubicación"}
                  </Text>
                </Pressable>
              </View>
              <NavigationButtons
                onBack={() => setStep(0)}
                onNext={() => {
                  if (draft.latitude === null) {
                    Alert.alert(
                      "Ubicación requerida",
                      "Obtén tu ubicación antes de continuar.",
                    );
                    return;
                  }
                  setStep(2);
                }}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <SectionTitle
                title="Evidencias fotográficas"
                subtitle="Son opcionales. Puedes agregar hasta 10 imágenes."
              />
              <View className="mt-5 flex-row gap-3">
                <EvidenceAction
                  icon="camera"
                  label="Tomar foto"
                  onPress={takePhoto}
                  disabled={isPreparingImages}
                />
                <EvidenceAction
                  icon="image"
                  label="Galería"
                  onPress={pickPhotos}
                  disabled={isPreparingImages}
                />
              </View>
              {isPreparingImages && (
                <View className="mt-4 flex-row items-center justify-center gap-2">
                  <ActivityIndicator color="#2563eb" />
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Optimizando fotografías...
                  </Text>
                </View>
              )}
              <View className="mt-5 flex-row flex-wrap gap-3">
                {draft.evidences.map((evidence) => (
                  <View
                    key={evidence.localId}
                    className="w-[47%] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-950"
                  >
                    <Image
                      source={{ uri: evidence.uri }}
                      contentFit="cover"
                      style={{ width: "100%", height: 120 }}
                    />
                    <View className="flex-row items-center justify-between px-3 py-2">
                      <Text
                        numberOfLines={1}
                        className="mr-2 flex-1 text-xs text-gray-600 dark:text-gray-300"
                      >
                        {(evidence.sizeBytes / 1024 / 1024).toFixed(1)} MiB
                      </Text>
                      <Pressable
                        hitSlop={8}
                        onPress={() =>
                          removePhoto(evidence.localId, evidence.uri)
                        }
                      >
                        <Feather name="trash-2" size={16} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
              {draft.evidences.length === 0 && (
                <Text className="mt-5 text-center text-sm text-gray-400">
                  Puedes continuar sin fotografías.
                </Text>
              )}
              <NavigationButtons
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextLabel="Revisar"
                disabled={isPreparingImages}
              />
            </View>
          )}

          {step === 3 && (
            <View>
              <SectionTitle
                title="Revisa tu reporte"
                subtitle="Una vez enviado, no podrás agregar más evidencias."
              />
              <ReviewRow label="Descripción" value={draft.originalMessage} />
              <ReviewRow
                label="Dirección"
                value={draft.address || "No especificada"}
              />
              <ReviewRow
                label="Referencia"
                value={draft.addressReference || "No especificada"}
              />
              <ReviewRow
                label="Coordenadas"
                value={`${draft.latitude?.toFixed(6)}, ${draft.longitude?.toFixed(6)}`}
              />
              <ReviewRow
                label="Evidencias"
                value={`${draft.evidences.length} fotografía(s)`}
              />

              {submitIncident.isPending && (
                <View className="mt-5 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">
                  <ActivityIndicator color="#2563eb" />
                  <Text className="mt-2 text-center text-sm font-medium text-blue-700 dark:text-blue-200">
                    {getSendingMessage(draft.evidences)}
                  </Text>
                  <Text className="mt-1 text-center text-xs text-blue-500 dark:text-blue-300">
                    No cierres la aplicación durante la subida.
                  </Text>
                </View>
              )}

              {submitIncident.isError && (
                <View className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <Text className="font-semibold text-red-700 dark:text-red-300">
                    No se completó el envío
                  </Text>
                  <Text className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {getSubmitError(submitIncident.error)}
                  </Text>
                  <Text className="mt-1 text-xs text-red-500">
                    Puedes reintentar sin crear una incidencia duplicada.
                  </Text>
                </View>
              )}

              <NavigationButtons
                onBack={() => setStep(2)}
                onNext={send}
                nextLabel={submitIncident.isError ? "Reintentar" : "Enviar"}
                disabled={submitIncident.isPending}
              />
            </View>
          )}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View>
      <Text className="text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
        {subtitle}
      </Text>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <Text className="mt-5 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
      {text}
    </Text>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text className="mt-1 text-sm text-red-600 dark:text-red-400">
      {message}
    </Text>
  );
}

function PrimaryButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-7 min-h-13 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5"
    >
      <Text className="font-semibold text-white">{label}</Text>
      <Feather name={icon} size={18} color="white" />
    </Pressable>
  );
}

function NavigationButtons({
  onBack,
  onNext,
  nextLabel = "Continuar",
  disabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  disabled?: boolean;
}) {
  return (
    <View className="mt-7 flex-row gap-3">
      <Pressable
        onPress={onBack}
        disabled={disabled}
        className="min-h-13 flex-1 items-center justify-center rounded-2xl border border-gray-300 px-4 disabled:opacity-50 dark:border-gray-700"
      >
        <Text className="font-semibold text-gray-700 dark:text-gray-200">
          Atrás
        </Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        disabled={disabled}
        className="min-h-13 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 disabled:opacity-50"
      >
        <Text className="font-semibold text-white">{nextLabel}</Text>
      </Pressable>
    </View>
  );
}

function EvidenceAction({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className="min-h-24 flex-1 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950"
    >
      <Feather name={icon} size={23} color="#2563eb" />
      <Text className="mt-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
        {label}
      </Text>
    </Pressable>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-950">
      <Text className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
        {label}
      </Text>
      <Text className="mt-1 leading-5 text-gray-800 dark:text-gray-200">
        {value}
      </Text>
    </View>
  );
}

function getSendingMessage(
  evidences: ReturnType<
    typeof useIncidentDraftStore.getState
  >["draft"]["evidences"],
) {
  const confirmed = evidences.filter(
    (evidence) => evidence.status === "confirmed",
  ).length;
  const uploading = evidences.find(
    (evidence) =>
      evidence.status === "preparing" || evidence.status === "uploading",
  );
  if (uploading) {
    return `Subiendo evidencia ${confirmed + 1} de ${evidences.length}...`;
  }
  if (evidences.length > 0 && confirmed === evidences.length) {
    return "Enviando incidencia a análisis...";
  }
  return "Creando borrador seguro...";
}

function getSubmitError(error: unknown) {
  if (!(error instanceof Error)) return "Ocurrió un error inesperado.";
  if (error.message.includes("MINIO_UPLOAD_FAILED")) {
    return "No pudimos subir una fotografía a MinIO. Verifica la conexión y reintenta.";
  }
  return "Revisa tu conexión e inténtalo nuevamente.";
}

export default ReportPage;
