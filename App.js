import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình (Chúng ta sẽ tạo ở bước sau)
import DetailScreen from './screens/DetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import HomeScreen from './screens/HomeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack cho Trang chủ -> Chi tiết sách
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Trang chủ" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chi tiết" component={DetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ tabBarActiveTintColor: 'tomato', tabBarInactiveTintColor: 'gray' }}>
        <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Trang chủ' }} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Yêu thích' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}