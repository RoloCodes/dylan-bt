import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Switch,
  View,
  TouchableOpacity,
  Text,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Header, ListItem, ThemeProvider } from 'react-native-elements'
import { State } from 'react-native-ble-plx'
import Peripheral, { Characteristic, Service } from 'react-native-peripheral'
import scanner from './scanner'

const DEVICE_LIST_LIMIT = 50

const App = () => {
  const [bleState, setBleState] = useState(State.Unknown)
  const [error, setError] = useState('-')
  const [started, setStarted] = useState(false)
  const [devices, setDevices] = useState([])
  const [value, setValue] = useState('')

  const startAdvertising = useCallback(() => {
    Peripheral.onStateChanged(async (state) => {
      if (state === 'poweredOn') {
        const serviceUuid = 'ebed0e09-033a-4bfe-8dcc-20a04fad944e'
        const char1 = new Characteristic({
          uuid: 'c36e1c5a-fc6e-48c8-9a8e-d0b350399d0e',
          value: 'aGVsbG8=',
        })
        const char2 = new Characteristic({
          uuid: 'fbc47809-76ce-44fa-a2f0-676b95615472',
          onReadRequest: async () => value,
          onWriteRequest: async (val) => setValue(val),
        })
        try {
          await Peripheral.addService(
            new Service({
              uuid: serviceUuid,
              characteristics: [char1, char2],
            })
          )
          Peripheral.startAdvertising({
            name: 'I love dogs',
            serviceUuids: [serviceUuid],
          })
          console.log('bluetooth is working')
        } catch (error) {
          console.log(error)
        }
      }
    })
  })

  const { start, stop, observe } = useMemo(() => scanner(), [])

  useEffect(() => {
    observe(
      {
        onStarted: (startedState) => {
          console.log('startedState:', startedState)
          setStarted(startedState)
        },
        onStateChanged: (changedBleState) => {
          console.log('changedBleState', changedBleState)
          setBleState(changedBleState)
        },
        onDeviceDetected: (device) => {
          console.log('device', device.id, device.name, device.rssi)
          const found = devices.find((item) => item.id === device.id)
          if (!found) {
            setDevices([device].concat(devices.slice(0, DEVICE_LIST_LIMIT)))
          }
        },
        onError: (err) => {
          console.log('error', err)
          setError(err.toString())
        },
      },
      [observe, setStarted, setBleState, setDevices, devices, setError]
    )
  })

  useEffect(() => setError(''), [started])

  const toggleStarted = useCallback(() => {
    console.log('toggleStarted')
    if (started) {
      stop()
    } else {
      start()
    }
  }, [started, start, stop])

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.container}>
          <Header
            centerComponent={{ text: 'BLE Scanner', style: { color: '#fff' } }}
            leftComponent={
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={started ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleStarted}
                value={started}
              />
            }
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={startAdvertising} style={styles.button}>
              <Text>StartAdvertising</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusPanel}>
            <ListItem bottomDivider>
              <ListItem.Content>
                <ListItem.Title>BLE Status</ListItem.Title>
                <ListItem.Subtitle>{bleState}</ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
            <ListItem bottomDivider>
              <ListItem.Content>
                <ListItem.Title>Last Error</ListItem.Title>
                <ListItem.Subtitle>{error}</ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
          </View>
          <View style={styles.list}>
            <FlatList
              style={styles.list}
              data={devices}
              renderItem={({ item, index }) => (
                <ListItem bottomDivider key={index}>
                  <ListItem.Title>
                    {item.name || 'Unknown Device'}
                  </ListItem.Title>
                  <ListItem.Subtitle>RSSI: {item.rssi}</ListItem.Subtitle>
                </ListItem>
              )}
              keyExtractor={(_, index) => index.toString()}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusPanel: {
    flex: 0,
    marginBottom: 15,
  },
  list: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ddd',
  },
  buttonContainer: {
    alignItems: 'center',
    padding: 10,
  },
})

export default App
