import { Dispatch, SetStateAction, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from "react-native";

type SubjectSelectorPROPS = {
  useSelected: [string, Dispatch<SetStateAction<string>>];
  items: string[];
};

export default function DropSubjectSelector({ useSelected, items }: SubjectSelectorPROPS) {
  const [selectedSubject, setSelectedSubject] = useSelected;
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (item: string) => {
    setSelectedSubject(item);
    setIsOpen(false);
  };

  return (
    <View className="m-4">

      {/* Кнопка, на которую жмет пользователь */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="border border-gray-300 rounded-lg p-4 bg-white flex-row justify-between items-center"
      >
        <Text className={`${selectedSubject ? "text-black" : "text-gray-400"} text-center w-full `}>
          {selectedSubject || "Нажмите для выбора..."}
        </Text>
        <Text className="text-gray-400">▼</Text>
      </TouchableOpacity>

      {/* Модальное окно со списком (чтобы список был поверх всего) */}
      <Modal
        transparent={true}
        visible={isOpen}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          className="flex-1 justify-center items-center bg-black/40" 
          onPress={() => setIsOpen(false)}
        >
          <View className="w-4/5 bg-white rounded-2xl overflow-hidden shadow-xl">
            <View className="p-4 border-b border-gray-100 bg-gray-50">
              <Text className="font-bold text-center">Выберите предмет</Text>
            </View>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelect(item)}
                  className="p-4 border-b border-gray-50 active:bg-blue-50"
                >
                  <Text className={`text-center ${selectedSubject === item ? "text-blue-600 font-bold" : "text-gray-800"}`}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              onPress={() => setIsOpen(false)}
              className="p-4 bg-gray-100"
            >
              <Text className="text-center text-red-500 font-bold">Отмена</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}