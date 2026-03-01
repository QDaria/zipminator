import * as React from 'react';

import { ZipminatorCryptoViewProps } from './ZipminatorCrypto.types';

export default function ZipminatorCryptoView(props: ZipminatorCryptoViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
