import React from 'react';
import { ScrollView, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Page({ children, gap = 14, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 24, gap }, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}
