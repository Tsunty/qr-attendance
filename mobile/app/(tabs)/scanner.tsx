import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import DropSubjectSelector from "@/components/ui/DropSelector";
import API_URL from "../../components/constant";
import * as SecureStore from "expo-secure-store";

interface ISubject {
  id: number;
  title: string;
}

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const lockScan = useRef(false);

  const [rawSubjects, setRawSubjects] = useState<ISubject[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const response = await fetch(`${API_URL}/my-subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setRawSubjects(data);
        setItems(data.map((s: ISubject) => s.title));
      } catch (err) {
        console.error("Ошибка загрузки предметов:", err);
      }
    };
    fetchSubjects();
  }, []);

  // 1. Состояние загрузки прав
  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // 2. Если права не получены — показываем экран запроса
  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <Text className="text-xl text-center mb-6 font-semibold">
          Для работы сканера нужен доступ к камере
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-600 px-8 py-4 rounded-2xl"
        >
          <Text className="text-white font-bold text-lg">РАЗРЕШИТЬ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startScan = () => {
    if (!selectedSubject) {
      Alert.alert("Внимание", "Сначала выберите предмет!");
      return;
    }
    lockScan.current = false;
    setIsScanning(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (lockScan.current) return;
    lockScan.current = true;
    
    setIsScanning(false);
    Vibration.vibrate();

    try {
      const token = await SecureStore.getItemAsync("userToken");
      const currentSubjectObj = rawSubjects.find(
        (s) => s.title === selectedSubject
      );

      if (!currentSubjectObj) throw new Error("Предмет не найден");

      const response = await fetch(`${API_URL}/api/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qrData: data,
          subjectId: currentSubjectObj.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Успешно", `Отметка поставлена!`);
      } else {
        Alert.alert("Ошибка", result.error || "Не удалось сохранить");
      }
    } catch (error) {
      Alert.alert("Ошибка", "Сбой соединения с сервером");
    }
  };

  return (
    <View className="flex-1 items-center p-5 bg-gray-50">
      <Text className="text-3xl font-semibold text-gray-800">Сканирование QR</Text>

      <View className="w-full my-6 z-50">
        <DropSubjectSelector
          useSelected={[selectedSubject, setSelectedSubject]}
          items={items}
        />
      </View>

      {/* Контейнер камеры */}
      <View
        className={`w-80 h-80 rounded-3xl overflow-hidden shadow-2xl mt-16 bg-black border-[6px] 
        ${isScanning ? "border-green-500" : "border-blue-700"}`}
      >
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back" // Ключевое исправление для Android
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        
        {!isScanning && (
          <View className="flex-1 bg-black/60 justify-center items-center">
            <Text className="text-white font-medium opacity-90">
              {selectedSubject ? "Нажмите кнопку ниже" : "Выберите предмет"}
            </Text>
          </View>
        )}
      </View>

      <Text className="mt-6 mb-8 text-gray-500 font-medium text-center">
        {selectedSubject
          ? isScanning
            ? "🔎 Наведите на QR-код..."
            : "Камера готова к работе"
          : "Выберите предмет из списка"}
      </Text>

      <TouchableOpacity
        onPress={startScan}
        disabled={isScanning || !selectedSubject}
        activeOpacity={0.7}
        className={`px-16 py-4 rounded-2xl shadow-lg ${
          isScanning || !selectedSubject ? "bg-blue-500" : "bg-blue-600"
        }`}
      >
        <Text className="text-white font-bold text-lg uppercase tracking-widest">
          {isScanning ? "Идет поиск..." : "СКАНИРОВАТЬ"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}