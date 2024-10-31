import { useEffect, useState } from 'react';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import './App.css';
import {
  DeviceActionStatus,
  DeviceSdkBuilder,
  type DeviceSessionId,
} from '@ledgerhq/device-management-kit';
import {
  GetAddressDAOutput,
  GetAddressDAReturnType,
  KeyringEth,
  KeyringEthBuilder,
} from '@ledgerhq/device-signer-kit-ethereum';
import { useDeviceSessionState } from './helpers';

function App() {
  // Workshop TODO 1: initialize the SDK
  const [sdk] = useState(new DeviceSdkBuilder().build());

  const [deviceSessionId, setSessionId] = useState<DeviceSessionId>();
  const [connectionError, setConnectionError] = useState<unknown>();
  const [ethereumAddress, setEthereumAddress] = useState<string>();
  const [getAddressError, setGetAddressError] = useState<unknown>();

  const onClickDiscoverDevices = async () => {
    try {
      setSessionId(undefined);
      // Workshop TODO 2: discover device
      const discoveredDevice = await firstValueFrom(sdk.startDiscovering());
      // Workshop TODO 3: connect discovered device & save device session id
      const sessionId = await sdk.connect({ deviceId: discoveredDevice.id });
      setConnectionError(undefined);
      setSessionId(sessionId);
    } catch (e) {
      setConnectionError(e);
    }
  };

  // Workshop TODO 4: instantiate Ethereum Keyring
  const keyringEth = deviceSessionId
    ? new KeyringEthBuilder({
        sdk,
        sessionId: deviceSessionId,
      }).build()
    : undefined;

  const onClickGetEthereumAddress = async () => {
    // Workshop TODO 5: implement the getAddress using the Ethereum Keyring
    if (!keyringEth) return;
    setEthereumAddress(undefined);
    setGetAddressError(undefined);
    const derivationPath = "44'/60'/0'/0";
    const getAddressResult = await lastValueFrom(
      keyringEth.getAddress(derivationPath).observable
    );
    console.log('getAddressResult', getAddressResult);
    if (getAddressResult.status !== DeviceActionStatus.Completed) {
      setGetAddressError(getAddressResult);
    } else {
      setEthereumAddress(getAddressResult.output.address);
    }
  };

  const deviceSessionState = useDeviceSessionState(sdk, deviceSessionId);

  return (
    <div className="card">
      <button onClick={onClickDiscoverDevices}>
        Discover & connect a device
      </button>
      {connectionError ? (
        <pre>
          Connection error:{'\n'}
          {JSON.stringify(connectionError, null, 2)}
        </pre>
      ) : deviceSessionId ? (
        <div>
          <p>Connected! SessionId: {deviceSessionId}</p>
          <p>Session status: {deviceSessionState?.deviceStatus ?? 'loading'}</p>
        </div>
      ) : (
        <p>'No active session. First discover and connect a device.'</p>
      )}
      <button disabled={!deviceSessionId} onClick={onClickGetEthereumAddress}>
        Get Ethereum address
      </button>
      {getAddressError ? (
        <>
          <p>Get address error:</p>
          <pre>{JSON.stringify(getAddressError, null, 2)}</pre>
        </>
      ) : (
        <>
          <p>Ethereum address:</p>
          <pre>{ethereumAddress ?? 'undefined'}</pre>
        </>
      )}
    </div>
  );
}

export default App;
