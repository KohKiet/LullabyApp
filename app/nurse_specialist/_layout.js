import { Stack } from "expo-router";

export default function NurseSpecialistLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="booking_history"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="workschedule"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
