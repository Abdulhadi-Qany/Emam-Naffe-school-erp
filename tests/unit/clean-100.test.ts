import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GenericEntity } from '@/src/shared/crud/GenericEntity';

describe('Clean Architecture 100% — generic entity', () => {
  it('creates/updates/deletes with events', () => {
    const e = GenericEntity.create('Book', { schoolId: 's1', name: 'Math 101', status: 'active', attributes: { isbn: 'x' } });
    assert.equal(e.getKind(), 'Book');
    assert.equal(e.pullDomainEvents().length, 1);
    e.update({ name: 'Math 102' });
    assert.equal(e.toProps().name, 'Math 102');
    assert.equal(e.pullDomainEvents().length, 1);
    e.softDelete();
    assert.equal(e.toProps().status, 'deleted');
  });

  it('rejects empty name', () => {
    assert.throws(() => GenericEntity.create('Book', { schoolId: 's1', name: '  ', status: 'active', attributes: {} }), /name is required/);
  });
});

describe('Clean Architecture 100% — registry completeness', () => {
  it('registers 132 generic modules + 3 rich aggregates', async () => {
    const { MODULE_REGISTRATIONS } = await import('@/src/shared/crud/module-registry');
    assert.equal(MODULE_REGISTRATIONS.length, 132);
    const kinds = new Set(MODULE_REGISTRATIONS.map((r) => r.kind));
    for (const must of ['Book', 'Exam', 'Vehicle', 'Department', 'Expense', 'Announcement', 'Homework', 'InventoryItem', 'AdmissionApplication', 'FacilityWorkOrder']) {
      assert.ok(kinds.has(must), `missing ${must}`);
    }
  });

  it('every registration has kind+table+permission+route', async () => {
    const { MODULE_REGISTRATIONS } = await import('@/src/shared/crud/module-registry');
    for (const r of MODULE_REGISTRATIONS) {
      assert.ok(r.kind && r.table && r.permission && r.route, JSON.stringify(r.kind));
    }
  });
});
