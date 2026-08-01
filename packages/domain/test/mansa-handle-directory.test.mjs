import assert from "node:assert/strict";
import test from "node:test";

import {
  MansaHandle,
  MansaHandleAlreadyAssignedError,
  MansaHandleAssignmentService,
} from "../dist/index.js";

class InMemoryMansaHandleDirectory {
  assignments = [];

  async findByHandle(handle) {
    return (
      this.assignments.find((assignment) => assignment.handle.equals(handle)) ??
      null
    );
  }

  async findByOwner(owner) {
    return (
      this.assignments.find(
        (assignment) =>
          assignment.owner.id === owner.id &&
          assignment.owner.type === owner.type,
      ) ?? null
    );
  }

  async save(assignment) {
    this.assignments.push(assignment);
  }
}

const owner = { id: " user-007 ", type: "USER" };
const fixedDate = new Date("2026-08-01T00:00:00.000Z");

test("attribue un identifiant disponible à un propriétaire", async () => {
  const directory = new InMemoryMansaHandleDirectory();
  const service = new MansaHandleAssignmentService(
    directory,
    () => fixedDate,
  );

  const assignment = await service.assign(MansaHandle.create("@zoumana"), owner);

  assert.equal(assignment.handle.toString(), "@zoumana");
  assert.deepEqual(assignment.owner, { id: "user-007", type: "USER" });
  assert.equal(assignment.assignedAt.toISOString(), fixedDate.toISOString());
  assert.equal(directory.assignments.length, 1);
});

test("refuse un identifiant déjà attribué", async () => {
  const directory = new InMemoryMansaHandleDirectory();
  const service = new MansaHandleAssignmentService(directory, () => fixedDate);
  const handle = MansaHandle.create("@zoumana");

  await service.assign(handle, owner);

  await assert.rejects(
    () => service.assign(handle, { id: "merchant-1", type: "MERCHANT" }),
    MansaHandleAlreadyAssignedError,
  );
});

test("refuse un second identifiant pour le même propriétaire", async () => {
  const directory = new InMemoryMansaHandleDirectory();
  const service = new MansaHandleAssignmentService(directory, () => fixedDate);

  await service.assign(MansaHandle.create("@zoumana"), owner);

  await assert.rejects(
    () => service.assign(MansaHandle.create("@camara"), owner),
    MansaHandleAlreadyAssignedError,
  );
});

test("refuse un propriétaire sans identifiant interne", async () => {
  const directory = new InMemoryMansaHandleDirectory();
  const service = new MansaHandleAssignmentService(directory, () => fixedDate);

  await assert.rejects(
    () => service.assign(MansaHandle.create("@zoumana"), { id: " ", type: "USER" }),
    TypeError,
  );
});
