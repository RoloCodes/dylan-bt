import { BleManager, State } from 'react-native-ble-plx'

// Sets up ble scanning and returns function for controlling it externally
export default () => {
  const bleManager = new BleManager()
  let subscription = null
  let observer = {
    onStarted: () => {},
    onStateChanged: () => {},
    onDeviceDetected: () => {},
    onError: () => {},
  }

  const observe = (newObserver) => (observer = newObserver)

  const start = () => {
    if (subscription) {
      try {
        subscription.remove()
      } catch (error) {
        observer.onError(error)
      }
    }

    try {
      subscription = bleManager.onStateChange((state) => {
        observer.onStateChanged(state)

        if (state === State.PoweredOn) {
          try {
 
            bleManager.startDeviceScan(null, null, (error, device) => {
              if (error) {
                observer.onError(error)
                return
              }
              if (device) {
                observer.onDeviceDetected(device)
              }
            })
          } catch (error) {
            observer.onError(error)
          }
        }
      }, true)
      observer.onStarted(true)
    } catch (error) {
      observer.onError(error)
      stop()
    }
  }

  const stop = () => {
    if (subscription) {
      try {
        subscription.remove()
        bleManager.stopDeviceScan()
      } catch {
        observer.onError(error)
      }
      subscription = null
      observer.onStarted(false)
    }
  }

  return {
    start,
    stop,
    observe,
  }
}
