import { PhoneNumber } from '../value-objects/PhoneNumber'
import { TazkiraNumber } from '../value-objects/TazkiraNumber'
import { Address } from './Address'
import { GuardianRelation } from '../enums/GuardianRelation'
import { DomainError } from '../errors/DomainError'

export interface GuardianProps {
  name: string
  relation: GuardianRelation
  occupation: string
  tazkiraNumber?: TazkiraNumber
  phoneNumber: PhoneNumber
  address?: Address
}

export class Guardian {
  private readonly props: GuardianProps

  private constructor(props: GuardianProps) {
    this.props = props
  }

  public static create(params: {
    name: string
    relation: GuardianRelation
    occupation: string
    tazkiraNumber?: TazkiraNumber
    phoneNumber: PhoneNumber
    address?: Address
  }): Guardian {
    if (!params.name || params.name.trim().length < 2) {
      throw new DomainError('Guardian name must be at least 2 characters')
    }
    if (!params.occupation || params.occupation.trim().length < 2) {
      throw new DomainError('Guardian occupation is required')
    }
    return new Guardian({
      name: params.name.trim(),
      relation: params.relation,
      occupation: params.occupation.trim(),
      tazkiraNumber: params.tazkiraNumber,
      phoneNumber: params.phoneNumber,
      address: params.address,
    })
  }

  public static reconstitute(props: GuardianProps): Guardian {
    return new Guardian(props)
  }

  public getName(): string {
    return this.props.name
  }

  public getRelation(): GuardianRelation {
    return this.props.relation
  }

  public getOccupation(): string {
    return this.props.occupation
  }

  public getTazkiraNumber(): TazkiraNumber | undefined {
    return this.props.tazkiraNumber
  }

  public getPhoneNumber(): PhoneNumber {
    return this.props.phoneNumber
  }

  public getAddress(): Address | undefined {
    return this.props.address
  }

  public toProps(): GuardianProps {
    return { ...this.props }
  }

  public updatePhoneNumber(phoneNumber: PhoneNumber): void {
    this.props.phoneNumber = phoneNumber
  }

  public updateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new DomainError('Guardian name must be at least 2 characters')
    }
    this.props.name = name.trim()
  }

  public updateAddress(address: Address): void {
    this.props.address = address
  }
}
