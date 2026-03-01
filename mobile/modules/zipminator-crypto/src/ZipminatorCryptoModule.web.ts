import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ZipminatorCrypto.types';

type ZipminatorCryptoModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ZipminatorCryptoModule extends NativeModule<ZipminatorCryptoModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ZipminatorCryptoModule, 'ZipminatorCryptoModule');
