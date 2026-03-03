import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.border,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Theme.colors.brandWarm,
        tabBarInactiveTintColor: Theme.colors.disabled,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'journal',
          tabBarIcon: ({ color, size }) => (
            <Feather name="sun" color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'feed',
          tabBarIcon: ({ color, size }) => (
            <Feather name="image" color={color} size={size - 2} />
          ),
        }}
      />
    </Tabs>
  );
}
