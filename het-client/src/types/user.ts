export interface UserDto {
  id: number
  name: string
  surname: string
  email: string
  address: string | null
  alerting: boolean
  energyAlertingThreshold: number
}

export interface RegistrationDto {
  name: string
  surname: string
  email: string
  password: string
  address?: string
  alerting: boolean
  energyAlertingThreshold: number
}
