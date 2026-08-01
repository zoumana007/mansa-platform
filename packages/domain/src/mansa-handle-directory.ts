import { MansaHandle } from "./mansa-handle.js";

export type MansaHandleOwnerType = "USER" | "MERCHANT" | "AGENT" | "ORGANIZATION";

export type MansaHandleOwner = Readonly<{
  id: string;
  type: MansaHandleOwnerType;
}>;

export type MansaHandleAssignment = Readonly<{
  handle: MansaHandle;
  owner: MansaHandleOwner;
  assignedAt: Date;
}>;

export interface MansaHandleDirectory {
  findByHandle(handle: MansaHandle): Promise<MansaHandleAssignment | null>;
  findByOwner(owner: MansaHandleOwner): Promise<MansaHandleAssignment | null>;
  save(assignment: MansaHandleAssignment): Promise<void>;
}

export class MansaHandleAlreadyAssignedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MansaHandleAlreadyAssignedError";
  }
}

export class MansaHandleAssignmentService {
  constructor(
    private readonly directory: MansaHandleDirectory,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async assign(
    handle: MansaHandle,
    owner: MansaHandleOwner,
  ): Promise<MansaHandleAssignment> {
    const normalizedOwner = this.normalizeOwner(owner);
    const [handleAssignment, ownerAssignment] = await Promise.all([
      this.directory.findByHandle(handle),
      this.directory.findByOwner(normalizedOwner),
    ]);

    if (handleAssignment) {
      throw new MansaHandleAlreadyAssignedError(
        `${handle.toString()} is already assigned`,
      );
    }

    if (ownerAssignment) {
      throw new MansaHandleAlreadyAssignedError(
        `owner ${normalizedOwner.type}:${normalizedOwner.id} already has a handle`,
      );
    }

    const assignment: MansaHandleAssignment = Object.freeze({
      handle,
      owner: normalizedOwner,
      assignedAt: new Date(this.now().getTime()),
    });

    await this.directory.save(assignment);
    return assignment;
  }

  private normalizeOwner(owner: MansaHandleOwner): MansaHandleOwner {
    const id = owner.id.trim();

    if (!id) {
      throw new TypeError("owner id must not be empty");
    }

    return Object.freeze({ id, type: owner.type });
  }
}
