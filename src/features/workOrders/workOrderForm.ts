import type { EstimateMasterListItem, EstimateType } from '../../api/estimateMasterListApi'
import type { Customer } from '../customers/types'
import type { Vehicle } from '../vehicles/types'
import type { CustomerFormState } from './components/CustomerInformationCard'
import type { VehicleFormState } from './components/VehicleInformationCard'
import type {
  CustomerPayload,
  Estimate,
  EstimateItemPayload,
  EstimatePayload,
  EstimateStatus,
  SparePart,
  SparePartPayload,
  VehiclePayload,
} from './types'

export const EMPTY_CUSTOMER: CustomerFormState = {
  customerId: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
}

export const EMPTY_VEHICLE: VehicleFormState = {
  vehicleId: null,
  brandId: null,
  brandName: '',
  modelId: null,
  modelName: '',
  year: null,
  vin: '',
  licensePlate: '',
  mileage: '',
}

export function customerToFormState(customer: Customer | null): CustomerFormState {
  if (!customer) {
    return EMPTY_CUSTOMER
  }

  return {
    customerId: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
  }
}

export function vehicleToFormState(vehicle: Vehicle | null): VehicleFormState {
  if (!vehicle) {
    return EMPTY_VEHICLE
  }

  return {
    vehicleId: vehicle.id,
    brandId: vehicle.brandId,
    brandName: vehicle.brandName ?? '',
    modelId: vehicle.modelId,
    modelName: vehicle.modelName ?? '',
    year: vehicle.year,
    vin: vehicle.vin ?? '',
    licensePlate: vehicle.licensePlate ?? '',
    mileage: vehicle.mileage != null ? String(vehicle.mileage) : '',
  }
}

export function buildCustomerPayload(customer: CustomerFormState): CustomerPayload | null {
  const hasAnyField =
    !!customer.customerId ||
    !!customer.firstName.trim() ||
    !!customer.lastName.trim() ||
    !!customer.email.trim() ||
    !!customer.phone.trim()

  if (!hasAnyField) {
    return null
  }

  return {
    customerId: customer.customerId,
    firstName: customer.firstName.trim() || null,
    lastName: customer.lastName.trim() || null,
    email: customer.email.trim() || null,
    phone: customer.phone.trim() || null,
  }
}

export function buildVehiclePayload(vehicle: VehicleFormState): VehiclePayload | null {
  const hasAnyField =
    !!vehicle.vehicleId ||
    !!vehicle.brandId ||
    !!vehicle.modelId ||
    vehicle.year != null ||
    !!vehicle.vin.trim() ||
    !!vehicle.licensePlate.trim() ||
    !!vehicle.mileage.trim()

  if (!hasAnyField) {
    return null
  }

  return {
    vehicleId: vehicle.vehicleId,
    brandId: vehicle.brandId,
    modelId: vehicle.modelId,
    year: vehicle.year,
    vin: vehicle.vin.trim() || null,
    licensePlate: vehicle.licensePlate.trim() || null,
    mileage: vehicle.mileage.trim() ? Number(vehicle.mileage) : null,
  }
}

export interface EstimateItemRow {
  key: string
  subItem: boolean
  name: string
  type: EstimateType
  hours: string
  priceHr: string
  discount: string
  total: string
  /** Tax amount as shown (read-only). A snapshot: stored with the item and never recalculated after it is saved. */
  tax: string
  /**
   * Set only on an item added in this editing session while the shop's "price includes tax" setting is on: the tax
   * then follows the item's total until it is saved. null on every saved item, so history is never recalculated.
   */
  taxPercent: number | null
}

// Type/Hours/PriceHr/Total of a master list item, copied into a new row. The row is not linked to the master
// item afterwards, so editing it never changes the master list.
export type EstimateItemDefaults = Pick<EstimateMasterListItem, 'type' | 'hours' | 'priceHr' | 'total'>

function numberToField(value: number | null | undefined): string {
  return value != null ? String(value) : ''
}

export function createEstimateItemRow(
  subItem: boolean,
  name = '',
  defaults?: EstimateItemDefaults,
  taxPercent: number | null = null,
): EstimateItemRow {
  const total = numberToField(defaults?.total)

  return {
    key: crypto.randomUUID(),
    subItem,
    name,
    type: defaults?.type ?? 'Fixed',
    hours: numberToField(defaults?.hours),
    priceHr: numberToField(defaults?.priceHr),
    discount: '',
    total,
    tax: taxPercent !== null ? calculateTax(total, taxPercent) : '',
    taxPercent,
  }
}

// An Estimate is exactly one root item (SubItem=false) plus its sub-items (SubItem=true).
export interface EstimateFormState {
  key: string
  id: string | null
  status: EstimateStatus
  root: EstimateItemRow
  subItems: EstimateItemRow[]
}

export function createEstimateFormState(
  name: string,
  defaults?: EstimateItemDefaults,
  taxPercent: number | null = null,
): EstimateFormState {
  return {
    key: crypto.randomUUID(),
    id: null,
    status: 'Draft',
    root: createEstimateItemRow(false, name, defaults, taxPercent),
    subItems: [],
  }
}

export function estimatesToFormState(estimates: Estimate[]): EstimateFormState[] {
  return [...estimates]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((estimate) => {
      const rows = estimateItemsToFormState(estimate)
      const rootIndex = rows.findIndex((row) => !row.subItem)

      return {
        key: estimate.id,
        id: estimate.id,
        status: estimate.status,
        root: rootIndex >= 0 ? rows[rootIndex] : createEstimateItemRow(false),
        subItems: rows.filter((_row, index) => index !== rootIndex),
      }
    })
}

function estimateItemsToFormState(estimate: Estimate): EstimateItemRow[] {
  return [...estimate.items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      key: item.id,
      subItem: item.subItem,
      name: item.name,
      type: item.type ?? 'Fixed',
      hours: item.hours != null ? String(item.hours) : '',
      priceHr: item.priceHr != null ? String(item.priceHr) : '',
      discount: item.discount != null ? String(item.discount) : '',
      total: item.total != null ? String(item.total) : '',
      tax: item.tax != null ? String(item.tax) : '',
      taxPercent: null,
    }))
}

// Accepts a decimal comma too, since shops type "1,5" as often as "1.5".
export function toNullableNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/** The fields that decide how an estimate row (or work catalog row) is priced; all as typed in the inputs. */
export interface EstimateAmountFields {
  type: EstimateType
  hours: string
  priceHr: string
  total: string
}

/**
 * Hours x hourly rate, rounded to cents. An empty hours or rate counts as zero; the total stays empty only when both
 * are empty. Mirrors the server (EstimateAmounts.ResolveTotal), which has the final say.
 */
export function calculateHourlyTotal(hours: string, priceHr: string): string {
  const h = toNullableNumber(hours)
  const p = toNullableNumber(priceHr)

  if (h === null && p === null) {
    return ''
  }

  return String(Math.round((h ?? 0) * (p ?? 0) * 100) / 100)
}

/**
 * Applies an edit to a row's type/hours/rate/total and returns the patch to store. For an Hourly row the total is
 * recalculated whenever the type, hours or rate changes; for a Fixed row nothing is recalculated, so hours and rate
 * are kept untouched and the typed-in total stands. Switching Fixed -> Hourly -> Fixed therefore loses nothing.
 */
export function resolveAmountPatch<T extends EstimateAmountFields>(row: T, patch: Partial<T>): Partial<T> {
  const next = { ...row, ...patch }
  const recalculates = 'type' in patch || 'hours' in patch || 'priceHr' in patch

  if (next.type === 'Hourly' && recalculates) {
    return { ...patch, total: calculateHourlyTotal(next.hours, next.priceHr) }
  }

  return patch
}

/** Tax for a total: total x rate / 100, rounded to cents (a total of 100 at 10% gives 10). Empty without a total. */
export function calculateTax(total: string, taxPercent: number): string {
  const value = toNullableNumber(total)

  return value === null ? '' : String(Math.round(((value * taxPercent) / 100) * 100) / 100)
}

/**
 * resolveAmountPatch for an estimate row, plus tax. A row added in this session while the shop setting is on carries
 * `taxPercent`, and its tax follows its total. A saved row has none, so editing it never rewrites its tax snapshot.
 */
export function resolveItemPatch(row: EstimateItemRow, patch: Partial<EstimateItemRow>): Partial<EstimateItemRow> {
  const amounts = resolveAmountPatch(row, patch)

  if (row.taxPercent === null || !('total' in amounts)) {
    return amounts
  }

  return { ...amounts, tax: calculateTax(amounts.total ?? row.total, row.taxPercent) }
}

export function buildEstimatesPayload(estimates: EstimateFormState[]): EstimatePayload[] {
  return estimates.map((estimate) => ({
    id: estimate.id,
    status: estimate.status,
    items: buildEstimateItemsPayload([
      { ...estimate.root, subItem: false },
      ...estimate.subItems.map((row) => ({ ...row, subItem: true })),
    ]),
  }))
}

function buildEstimateItemsPayload(rows: EstimateItemRow[]): EstimateItemPayload[] {
  return rows.map((row) => ({
    subItem: row.subItem,
    name: row.name.trim(),
    type: row.type,
    hours: toNullableNumber(row.hours),
    priceHr: toNullableNumber(row.priceHr),
    discount: toNullableNumber(row.discount),
    total: toNullableNumber(row.total),
    tax: toNullableNumber(row.tax),
  }))
}

// Products are free-form rows, one per product on the order; there is no master list behind them.
export interface SparePartRow {
  key: string
  name: string
  partNumber: string
  qty: string
  availQty: string
  costU: string
  priceU: string
}

export function createSparePartRow(): SparePartRow {
  return {
    key: crypto.randomUUID(),
    name: '',
    partNumber: '',
    qty: '1',
    availQty: '',
    costU: '',
    priceU: '',
  }
}

export function sparePartsToFormState(spareParts: SparePart[]): SparePartRow[] {
  return [...spareParts]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((part) => ({
      key: part.id,
      name: part.name,
      partNumber: part.partNumber ?? '',
      qty: part.qty != null ? String(part.qty) : '',
      availQty: part.availQty != null ? String(part.availQty) : '',
      costU: part.costU != null ? String(part.costU) : '',
      priceU: part.priceU != null ? String(part.priceU) : '',
    }))
}

// A row the user added but never typed into (apart from the default quantity) carries no information.
export function isSparePartRowBlank(row: SparePartRow): boolean {
  return (
    !row.name.trim() &&
    !row.partNumber.trim() &&
    !row.availQty.trim() &&
    !row.costU.trim() &&
    !row.priceU.trim() &&
    (!row.qty.trim() || row.qty.trim() === '1')
  )
}

// Rows with data but no name cannot be saved; the backend rejects them too.
export function isSparePartRowMissingName(row: SparePartRow): boolean {
  return !row.name.trim() && !isSparePartRowBlank(row)
}

export function sparePartRowTotal(row: SparePartRow): number | null {
  const qty = toNullableNumber(row.qty)
  const price = toNullableNumber(row.priceU)

  return qty != null && price != null ? Math.round(qty * price * 100) / 100 : null
}

export function buildSparePartsPayload(rows: SparePartRow[]): SparePartPayload[] {
  return rows
    .filter((row) => !isSparePartRowBlank(row))
    .map((row) => ({
      name: row.name.trim(),
      partNumber: row.partNumber.trim() || null,
      qty: toNullableNumber(row.qty),
      availQty: toNullableNumber(row.availQty),
      costU: toNullableNumber(row.costU),
      priceU: toNullableNumber(row.priceU),
    }))
}
