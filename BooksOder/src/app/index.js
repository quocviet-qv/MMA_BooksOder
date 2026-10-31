import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
export default function Index() {
  const { isLoggedIn, userRole } = useAuth();
  return <Redirect href={!isLoggedIn ? '/login' : userRole === 'admin' ? '/admin-dashboard' : '/home'} />;
}
