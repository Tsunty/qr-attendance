import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as SecureStore from "expo-secure-store";
import API_URL from "../../components/constant"; // Проверьте путь к вашему файлу с IP

interface IAttendanceRecord {
  id: number;
  student_name: string;
  created_at: string;
  subject_title: string;
}

export default function HistoryScreen() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  
  const [records, setRecords] = useState<IAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Функция для форматирования даты в YYYY-MM-DD (для отправки на сервер)
  const formatDateForDB = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Загрузка данных с сервера
  const fetchHistory = async (selectedDate: Date) => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const dateString = formatDateForDB(selectedDate);

      const response = await fetch(`${API_URL}/api/attendance/history?date=${dateString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setRecords(data);
      } else {
        alert("Ошибка: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка сети при загрузке истории");
    } finally {
      setIsLoading(false);
    }
  };

  // Загружаем данные при первом открытии экрана
  useEffect(() => {
    fetchHistory(date);
  }, []);

  // Обработчик выбора даты в календаре
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false); // Прячем календарь (особенно нужно для Android)
    if (selectedDate) {
      setDate(selectedDate);
      fetchHistory(selectedDate); // Сразу загружаем новые данные
    }
  };

  // Карточка одного студента в списке
  const renderItem = ({ item }: { item: IAttendanceRecord }) => {
    // Форматируем время из строки базы данных (например: "14:30")
    const timeString = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View className="bg-white p-4 rounded-xl mb-3 border border-gray-200 shadow-sm flex-row justify-between items-center">
        <View>
          <Text className="font-bold text-lg text-gray-800">{item.student_name}</Text>
          <Text className="text-gray-500 text-sm mt-1">{item.subject_title}</Text>
        </View>
        <Text className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">
          {timeString}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-5">
      <Text className="text-2xl font-bold text-gray-800 mb-6">История посещений</Text>

      {/* Кнопка открытия календаря */}
      <View className="flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <Text className="text-gray-600 text-base">
          Выбрана дата: <Text className="font-bold text-black">{date.toLocaleDateString()}</Text>
        </Text>
        <TouchableOpacity 
          onPress={() => setShowPicker(true)}
          className="bg-blue-100 px-4 py-2 rounded-lg"
        >
          <Text className="text-blue-700 font-bold">Изменить</Text>
        </TouchableOpacity>
      </View>

      {/* Сам компонент календаря (показывается только когда showPicker === true) */}
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} // Нельзя выбрать дату из будущего
        />
      )}

      {/* Список присутствующих */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Text className="text-gray-400 text-lg">В этот день никого не было отмечено</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}