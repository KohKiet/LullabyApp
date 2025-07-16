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
    </Stack>
  );
}
