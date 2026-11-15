import React from 'react';
import { Image } from 'react-native';

// Logo rumah sakit: timpa assets/logo.png sebelum build.
export function Logo({ size = 56, radius = 16 }: { size?: number; radius?: number }) {
  return (
    <Image source={require('../../assets/logo.png')} accessibilityLabel="Logo rumah sakit"
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#fff' }} />
  );
}
