import type { DeviceDto } from './device'

export interface UsageDto {
  userId: number
  devices: DeviceDto[] | null
}
