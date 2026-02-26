import { Text, View } from "react-native";
// import ScannerScreen from "./camera";
import LoginScreen from "./auth";

export default function Index() {
  return (<View className=" flex-1 mt-20 mx-10">
    <LoginScreen/>
  </View>
  );
}
