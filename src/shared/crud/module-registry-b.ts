import {
  vehicles, transportRoutes, transportAssignments, transportAttendance, vehicleMaintenance, vehicleFuelLogs,
  hostels, hostelRooms, hostelAllocations, hostelAttendance, hostelDiscipline,
  inventoryItems, inventoryStockMovements, purchaseOrders, purchaseOrderItems, stocktakes, goodsReceipts,
  procurementVendors, procurementRequests,
  expenses, budgets, feeStructures, discounts, salaryStructures, payrollRuns, payslips,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 2/3 — Transport, Hostel, Inventory, Finance extensions. */
export const MODULE_REGISTRATIONS_B: ModuleRegistration[] = [
  { kind: 'Vehicle', table: vehicles as never, tableName: 'vehicles', nameColumn: 'plateNumber', permission: 'transport', route: 'vehicles' },
  { kind: 'TransportRoute', table: transportRoutes as never, tableName: 'transport_routes', permission: 'transport', route: 'transport-routes' },
  { kind: 'TransportAssignment', table: transportAssignments as never, tableName: 'transport_assignments', nameColumn: 'status', permission: 'transport', route: 'transport-assignments' },
  { kind: 'TransportAttendance', table: transportAttendance as never, tableName: 'transport_attendance', nameColumn: 'status', permission: 'transport', route: 'transport-attendance' },
  { kind: 'VehicleMaintenance', table: vehicleMaintenance as never, tableName: 'vehicle_maintenance', nameColumn: 'status', permission: 'transport', route: 'vehicle-maintenance' },
  { kind: 'VehicleFuelLog', table: vehicleFuelLogs as never, tableName: 'vehicle_fuel_logs', permission: 'transport', route: 'fuel-logs' },
  { kind: 'Hostel', table: hostels as never, tableName: 'hostels', permission: 'hostel', route: 'hostels' },
  { kind: 'HostelRoom', table: hostelRooms as never, tableName: 'hostel_rooms', nameColumn: 'roomNumber', permission: 'hostel', route: 'hostel-rooms' },
  { kind: 'HostelAllocation', table: hostelAllocations as never, tableName: 'hostel_allocations', nameColumn: 'status', permission: 'hostel', route: 'hostel-allocations' },
  { kind: 'HostelAttendance', table: hostelAttendance as never, tableName: 'hostel_attendance', nameColumn: 'status', permission: 'hostel', route: 'hostel-attendance' },
  { kind: 'HostelDiscipline', table: hostelDiscipline as never, tableName: 'hostel_discipline', nameColumn: 'status', permission: 'hostel', route: 'hostel-discipline' },
  { kind: 'InventoryItem', table: inventoryItems as never, tableName: 'inventory_items', permission: 'inventory', route: 'inventory-items' },
  { kind: 'StockMovement', table: inventoryStockMovements as never, tableName: 'inventory_stock_movements', nameColumn: 'status', permission: 'inventory', route: 'stock-movements' },
  { kind: 'PurchaseOrder', table: purchaseOrders as never, tableName: 'purchase_orders', nameColumn: 'status', permission: 'inventory', route: 'purchase-orders' },
  { kind: 'PurchaseOrderItem', table: purchaseOrderItems as never, tableName: 'purchase_order_items', permission: 'inventory', route: 'purchase-order-items' },
  { kind: 'Stocktake', table: stocktakes as never, tableName: 'stocktakes', nameColumn: 'status', permission: 'inventory', route: 'stocktakes' },
  { kind: 'GoodsReceipt', table: goodsReceipts as never, tableName: 'goods_receipts', nameColumn: 'status', permission: 'inventory', route: 'goods-receipts' },
  { kind: 'ProcurementVendor', table: procurementVendors as never, tableName: 'procurement_vendors', permission: 'inventory', route: 'vendors' },
  { kind: 'ProcurementRequest', table: procurementRequests as never, tableName: 'procurement_requests', nameColumn: 'status', permission: 'inventory', route: 'procurement-requests' },
  { kind: 'Expense', table: expenses as never, tableName: 'expenses', nameColumn: 'title', permission: 'finance', route: 'expenses' },
  { kind: 'Budget', table: budgets as never, tableName: 'budgets', nameColumn: 'category', permission: 'finance', route: 'budgets' },
  { kind: 'FeeStructure', table: feeStructures as never, tableName: 'fee_structures', permission: 'finance', route: 'fee-structures' },
  { kind: 'Discount', table: discounts as never, tableName: 'discounts', permission: 'finance', route: 'discounts' },
  { kind: 'SalaryStructure', table: salaryStructures as never, tableName: 'salary_structures', permission: 'finance', route: 'salary-structures' },
  { kind: 'PayrollRun', table: payrollRuns as never, tableName: 'payroll_runs', nameColumn: 'status', permission: 'finance', route: 'payroll-runs' },
  { kind: 'Payslip', table: payslips as never, tableName: 'payslips', nameColumn: 'status', permission: 'finance', route: 'payslips' },
];
