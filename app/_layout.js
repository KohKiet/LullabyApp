import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="appointment"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="notifications"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="member" options={{ headerShown: false }} />
      <Stack.Screen
        name="nurse_specialist"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen
        name="wallet/history"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="booking/history"
        options={{
          headerShown: false,
          header: () => null,
          headerStyle: { height: 0 },
        }}
      />
      <Stack.Screen
        name="work-schedule"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="booking" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
      <Stack.Screen name="nurse" options={{ headerShown: false }} />
    </Stack>
  );
}
