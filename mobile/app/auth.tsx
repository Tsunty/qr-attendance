// mobile/screens/LoginScreen.js
import React, { useState } from "react";
import { View, TextInput, Alert, Text, TouchableOpacity } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import API_URL from '../components/constant'


export default function LoginScreen({}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 1. Сохраняем токен в безопасное хранилище телефона
        await SecureStore.setItemAsync("userToken", data.token);

        // 2. Сохраняем имя учителя
        await SecureStore.setItemAsync("userName", data.user.name);

        // 3. Переходим на главный экран
        router.replace('/(tabs)/scanner');
      } else {
        Alert.alert("Ошибка", data.error || "Не удалось войти");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Ошибка сети", "Проверьте интернет или IP сервера");
    }
  };

  return (
    <View className="w-full h-full flex-1 mt-20">
      <Text className="font-extrabold text-3xl mb-4">Учёт посещаемости.</Text>
      <Text className="text-xl text-gray-400 mb-8">Вход для преподавателя</Text>

      <View>
        <TextInput
          className="w-full border border-gray-300 my-3 p-4 rounded-xl"
          placeholder="Логин"
          placeholderTextColor="#9CA3AF"
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
        />

        <TextInput
          className="w-full border border-gray-300 my-3 p-4 rounded-xl"
          placeholder="Пароль"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
      onPress={() => handleLogin()}
      className="bg-blue-500 py-3 px-5 rounded-xl items-center mt-8 active:bg-blue-600"
    >
      <Text className="text-white font-bold text-lg">
        Войти в систему
      </Text>
    </TouchableOpacity>
    </View>
  );
}
