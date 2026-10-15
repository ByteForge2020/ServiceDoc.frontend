import type { EstimateMasterListItem, EstimateType } from '../../api/estimateMasterListApi'
import type { DiscountType } from '../../app/shop/shopApi'
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
  id: string | null
  /** Scheduled jobs linked to this saved item (0 for a new one); the server deletes them when the item is removed. */
  jobCount: number
  subItem: boolean
  name: string
  type: EstimateType
  hours: string
  priceHr: string
  /** Price of one unit: typed for a Fixed item, hours x rate (read-only) for an Hourly one. */
  price: string
  /** Whole number, at least 1. */
  quantity: string
  /** Greater than 0, one decimal place. */
  complexity: string
  /** A percent or a money amount, depending on the work order's discount type. */
  discount: string
  /** Calculated (read-only): price x quantity x complexity minus the discount. The server recalculates it on save. */
  total: string
  /** Tax amount as shown (read-only). A snapshot: stored with the item and never recalculated after it is saved. */
  tax: string
  /**
   * Set only on an item added in this editing session while the shop's "price includes tax" setting is on: the tax
   * then follows the item's total until it is saved. null on every saved item, so history is never recalculated.
   */
  taxPercent: number | null
}

// Type/Hours/PriceHr/Price of a master list item, copied into a new row. The row is not linked to the master
// item afterwards, so editing it never changes the master list.
export type EstimateItemDefaults = Pick<EstimateMasterListItem, 'type' | 'hours' | 'priceHr' | 'price'>

function numberToField(value: number | null | undefined): string {
  return value != null ? String(value) : ''
}

export function createEstimateItemRow(
  subItem: boolean,
  name = '',
  defaults?: EstimateItemDefaults,
  taxPercent: number | null = null,
): EstimateItemRow {
  // Quantity 1, complexity 1 and no discount: the total is just the price.
  const price = numberToField(defaults?.price)

  return {
    key: crypto.randomUUID(),
    id: null,
    jobCount: 0,
    subItem,
    name,
    type: defaults?.type ?? 'Fixed',
    hours: numberToField(defaults?.hours),
    priceHr: numberToField(defaults?.priceHr),
    price,
    quantity: '1',
    complexity: '1',
    discount: '',
    total: price,
    tax: taxPercent !== null ? calculateTax(price, taxPercent) : '',
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
      id: item.id,
      jobCount: item.jobCount,
      subItem: item.subItem,
      name: item.name,
      type: item.type ?? 'Fixed',
      hours: item.hours != null ? String(item.hours) : '',
      priceHr: item.priceHr != null ? String(item.priceHr) : '',
      price: item.price != null ? String(item.price) : '',
      quantity: String(item.quantity),
      complexity: String(item.complexity),
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
  price: string
}

/**
 * Hours x hourly rate, rounded to cents. An empty hours or rate counts as zero; the price stays empty only when both
 * are empty. Mirrors the server (EstimateAmounts.ResolvePrice), which has the final say.
 */
export function calculateHourlyPrice(hours: string, priceHr: string): string {
  const h = toNullableNumber(hours)
  const p = toNullableNumber(priceHr)

  if (h === null && p === null) {
    return ''
  }

  return String(Math.round((h ?? 0) * (p ?? 0) * 100) / 100)
}

/**
 * Applies an edit to a row's type/hours/rate/price and returns the patch to store. For an Hourly row the price is
 * recalculated whenever the type, hours or rate changes; for a Fixed row nothing is recalculated, so hours and rate
 * are kept untouched and the typed-in price stands. Switching Fixed -> Hourly -> Fixed therefore loses nothing.
 */
export function resolveAmountPatch<T extends EstimateAmountFields>(row: T, patch: Partial<T>): Partial<T> {
  const next = { ...row, ...patch }
  const recalculates = 'type' in patch || 'hours' in patch || 'priceHr' in patch

  if (next.type === 'Hourly' && recalculates) {
    return { ...patch, price: calculateHourlyPrice(next.hours, next.priceHr) }
  }

  return patch
}

/** Tax for a total: total x rate / 100, rounded to cents (a total of 100 at 10% gives 10). Empty without a total. */
export function calculateTax(total: string, taxPercent: number): string {
  const value = toNullableNumber(total)

  return value === null ? '' : String(Math.round(((value * taxPercent) / 100) * 100) / 100)
}

type EstimateLineFields = Pick<EstimateItemRow, 'price' | 'quantity' | 'complexity' | 'discount'>

/** The quantity as a whole number of at least 1; anything else counts as 1. */
function quantityValue(row: Pick<EstimateItemRow, 'quantity'>): number {
  const value = Math.floor(toNullableNumber(row.quantity) ?? 1)

  return value >= 1 ? value : 1
}

/** The complexity multiplier; while it is empty or 0 (e.g. mid-typing) it counts as 1, which leaves the amount alone. */
function complexityValue(row: Pick<EstimateItemRow, 'complexity'>): number {
  const value = toNullableNumber(row.complexity) ?? 1

  return value > 0 ? value : 1
}

/** Price x quantity x complexity, rounded to cents, before any discount. null while the row has no price. */
export function calculateLineAmount(row: EstimateLineFields): number | null {
  const price = toNullableNumber(row.price)

  return price === null ? null : Math.round(price * quantityValue(row) * complexityValue(row) * 100) / 100
}

/** What the discount takes off, in money: a percent of the line amount, or the fixed amount itself. 0 without one. */
export function calculateDiscountAmount(row: EstimateLineFields, discountType: DiscountType): number {
  const amount = calculateLineAmount(row)
  const discount = toNullableNumber(row.discount) ?? 0

  if (amount === null) {
    return 0
  }

  return discountType === 'Percent' ? Math.round(amount * Math.min(discount, 100)) / 100 : discount
}

/** Line amount minus the discount, never below zero. Empty without a price. Mirrors the server, which has the final say. */
export function calculateLineTotal(row: EstimateLineFields, discountType: DiscountType): string {
  const amount = calculateLineAmount(row)

  if (amount === null) {
    return ''
  }

  return String(Math.max(0, Math.round((amount - calculateDiscountAmount(row, discountType)) * 100) / 100))
}

/**
 * Applies an edit to an estimate row and returns the patch to store: an Hourly row's price follows hours x rate, and the
 * total is recalculated from price, quantity, complexity and discount. A row added in this session while the shop's tax
 * setting is on carries `taxPercent`, and its tax follows its total; a saved row has none, so editing it never rewrites
 * its tax snapshot.
 */
export function resolveItemPatch(
  row: EstimateItemRow,
  patch: Partial<EstimateItemRow>,
  discountType: DiscountType,
): Partial<EstimateItemRow> {
  const next = { ...row, ...patch }
  const reprices = 'type' in patch || 'hours' in patch || 'priceHr' in patch

  const price = next.type === 'Hourly' && reprices ? calculateHourlyPrice(next.hours, next.priceHr) : next.price
  const total = calculateLineTotal({ ...next, price }, discountType)
  const resolved: Partial<EstimateItemRow> = { ...patch, price, total }

  if (row.taxPercent !== null) {
    resolved.tax = calculateTax(total, row.taxPercent)
  }

  return resolved
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
    id: row.id,
    subItem: row.subItem,
    name: row.name.trim(),
    type: row.type,
    hours: toNullableNumber(row.hours),
    priceHr: toNullableNumber(row.priceHr),
    price: toNullableNumber(row.price),
    quantity: quantityValue(row),
    complexity: complexityValue(row),
    discount: toNullableNumber(row.discount),
    tax: toNullableNumber(row.tax),
  }))
}

// Products are free-form rows, one per product on the order; there is no master list behind them.
export interface SparePartRow {
  key: string
  /** Server id of a saved product; null until it is saved. Sent back so the server keeps the same record. */
  id: string | null
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
    id: null,
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
      id: part.id,
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
      id: row.id,
      name: row.name.trim(),
      partNumber: row.partNumber.trim() || null,
      qty: toNullableNumber(row.qty),
      availQty: toNullableNumber(row.availQty),
      costU: toNullableNumber(row.costU),
      priceU: toNullableNumber(row.priceU),
    }))
}
