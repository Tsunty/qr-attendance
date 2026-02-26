import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabsLayout() {
    console.log("✅ TABS LAYOUT УСПЕШНО ЗАГРУЖЕН!");
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'red',
        
        headerShown: true, // Показывать ли верхний заголовок
      }}
    >
      {/* Первая вкладка: Сканер (имя файла scanner.tsx) */}
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Сканер',
          tabBarIcon: ({ color }) => <FontAwesome name="qrcode" size={24} color={color} />,
        }}
      />
      
      {/* Вторая вкладка: История (имя файла history.tsx) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'История',
          tabBarIcon: ({ color }) => <FontAwesome name="history" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}