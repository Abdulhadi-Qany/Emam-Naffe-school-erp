import { DomainError } from '../errors/DomainError'

export interface AddressProps {
  province: string
  district: string
  village: string
  houseNumber?: string
  landmark?: string
}

export class Address {
  private readonly props: AddressProps

  private constructor(props: AddressProps) {
    this.props = props
  }

  public static create(params: {
    province: string
    district: string
    village: string
    houseNumber?: string
    landmark?: string
  }): Address {
    if (!params.province || params.province.trim().length < 2) {
      throw new DomainError('Province is required')
    }
    if (!params.district || params.district.trim().length < 2) {
      throw new DomainError('District is required')
    }
    if (!params.village || params.village.trim().length < 2) {
      throw new DomainError('Village/Area is required')
    }
    return new Address({
      province: params.province.trim(),
      district: params.district.trim(),
      village: params.village.trim(),
      houseNumber: params.houseNumber?.trim(),
      landmark: params.landmark?.trim(),
    })
  }

  public static reconstitute(props: AddressProps): Address {
    return new Address(props)
  }

  public getProvince(): string {
    return this.props.province
  }

  public getDistrict(): string {
    return this.props.district
  }

  public getVillage(): string {
    return this.props.village
  }

  public getHouseNumber(): string | undefined {
    return this.props.houseNumber
  }

  public getLandmark(): string | undefined {
    return this.props.landmark
  }

  public getFullAddress(): string {
    return [
      this.props.houseNumber,
      this.props.village,
      this.props.district,
      this.props.province,
    ]
      .filter(Boolean)
      .join(', ')
  }

  public toProps(): AddressProps {
    return { ...this.props }
  }

  public equals(other: Address): boolean {
    return (
      this.props.province === other.props.province &&
      this.props.district === other.props.district &&
      this.props.village === other.props.village &&
      this.props.houseNumber === other.props.houseNumber
    )
  }
}
