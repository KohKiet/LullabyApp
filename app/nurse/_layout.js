import { Stack } from "expo-router";

export default function NurseLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="booking-history"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="medical-notes"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
