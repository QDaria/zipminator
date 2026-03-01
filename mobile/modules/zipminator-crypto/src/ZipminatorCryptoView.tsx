import { requireNativeView } from 'expo';
import * as React from 'react';

import { ZipminatorCryptoViewProps } from './ZipminatorCrypto.types';

const NativeView: React.ComponentType<ZipminatorCryptoViewProps> =
  requireNativeView('ZipminatorCrypto');

export default function ZipminatorCryptoView(props: ZipminatorCryptoViewProps) {
  return <NativeView {...props} />;
}
