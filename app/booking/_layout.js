import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="history"
        options={{
          headerShown: false,
          header: () => null,
          headerStyle: { height: 0 },
        }}
      />
    </Stack>
  );
}
