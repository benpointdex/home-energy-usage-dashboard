export type DeviceType = 'THERMOSTAT' | 'HEATER' | 'FRIDGE' | 'AC' | 'WASHER' | 'OTHER'

export interface DeviceDto {
  id: number
  name: string
  type: DeviceType | string
  location: string
  userId: number
  energyConsumed: number | null
  status: 'ON' | 'OFF'
  dailyUsage?: Record<string, number> | null
}

export interface DeviceFormInput {
  name: string
  type: DeviceType
  location: string
}
