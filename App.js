import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình
import CartScreen from './screens/CartScreen';
import DetailScreen from './screens/DetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import HomeScreen from './screens/HomeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. Gom cụm 3 thanh Tab ở dưới cùng lại với nhau
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'bag-handle' : 'bag-handle-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E25842', // Màu cam đỏ
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Yêu thích' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
    </Tab.Navigator>
  );
}

// 2. Bao bọc tất cả bằng 1 Stack chính (Global Stack)
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Màn hình mặc định lúc vào app là cụm 3 Tab (ẩn thanh tiêu đề) */}
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        
        {/* Trang Chi tiết nằm ngoài cùng, tab nào gọi nó cũng được */}
        <Stack.Screen name="Chi tiết" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}