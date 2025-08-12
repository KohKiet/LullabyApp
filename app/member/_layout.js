import { Stack } from "expo-router";

export default function MemberLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="nurses" options={{ headerShown: false }} />
      <Stack.Screen
        name="specialists"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
