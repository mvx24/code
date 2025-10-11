import { useMemo } from 'react';

type OperatingSystem = 'Windows' | 'MacOS' | 'Linux' | 'iOS' | 'Android' | 'Unknown';

interface DeviceType {
  os: OperatingSystem;
  isTouchEnabled: boolean;
}

const detectOS = (): OperatingSystem => {
  if (typeof window === 'undefined') return 'Unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  // iOS detection
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'iOS';
  }

  // Android detection
  if (/android/.test(userAgent)) {
    return 'Android';
  }

  // MacOS detection
  if (/mac/.test(platform) || /macintosh/.test(userAgent)) {
    return 'MacOS';
  }

  // Windows detection
  if (/win/.test(platform)) {
    return 'Windows';
  }

  // Linux detection
  if (/linux/.test(platform)) {
    return 'Linux';
  }

  return 'Unknown';
};

const detectTouch = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
  );
};

function detectDeviceType(): DeviceType {
  return {
    os: detectOS(),
    isTouchEnabled: detectTouch(),
  };
}

function useDeviceType(): DeviceType {
  const deviceType = useMemo<DeviceType>(detectDeviceType, []);
  return deviceType;
}

export default useDeviceType;
