import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MemberHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Member Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold" 
  },
});
