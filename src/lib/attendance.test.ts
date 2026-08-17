import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The door-desk rules (CLEANUP.md §3.2/§3.3). These were verified by hand
 * against a live event; these tests are so the next change to this file doesn't
 * need a live event to be trusted.
 *
 * Prisma is mocked: the interest here is the guard logic and the error strings
 * the route maps onto 404/409, not the queries.
 */
const db = {
  registration: { findUnique: vi.fn() },
  attendance: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const { recordTimeIn, recordTimeOut } = await import("./attendance");

const registrant = {
  id: "reg_1",
  eventId: "ev_1",
  fullName: "Juan Dela Cruz",
  studentNumber: "202312437",
  schoolEmail: "jdc@fit.edu.ph",
  yearLevel: 3,
  degreeProgram: "BSCS",
  section: "",
  professor: "",
  role: "MEMBER",
  userId: "u_1",
};

beforeEach(() => {
  for (const model of Object.values(db)) {
    for (const fn of Object.values(model)) fn.mockReset();
  }
});

describe("recordTimeIn", () => {
  it("refuses somebody with no registration", async () => {
    db.registration.findUnique.mockResolvedValue(null);
    await expect(recordTimeIn("999999999", "ev_1")).rejects.toThrow("User is not Registered");
    expect(db.attendance.create).not.toHaveBeenCalled();
  });

  it("refuses a second scan rather than raising a unique-constraint error", async () => {
    db.registration.findUnique.mockResolvedValue(registrant);
    db.attendance.findUnique.mockResolvedValue({ id: "att_1" });
    await expect(recordTimeIn("202312437", "ev_1")).rejects.toThrow("Already timed in");
    expect(db.attendance.create).not.toHaveBeenCalled();
  });

  it("writes the attendance row from the registration, not from its arguments", async () => {
    db.registration.findUnique.mockResolvedValue(registrant);
    db.attendance.findUnique.mockResolvedValue(null);
    db.attendance.create.mockResolvedValue({ id: "att_1" });

    await recordTimeIn("does-not-matter", "nor-this");

    const { data } = db.attendance.create.mock.calls[0][0];
    expect(data.studentNumber).toBe(registrant.studentNumber);
    expect(data.eventId).toBe(registrant.eventId);
    expect(data.fullName).toBe(registrant.fullName);
    expect(data.registration).toEqual({ connect: { id: "reg_1" } });
  });

  it("populates userId, which used to be left null on every row", async () => {
    db.registration.findUnique.mockResolvedValue(registrant);
    db.attendance.findUnique.mockResolvedValue(null);
    db.attendance.create.mockResolvedValue({ id: "att_1" });

    await recordTimeIn("202312437", "ev_1");

    // §4.6: the column existed, was nullable, and was always null.
    expect(db.attendance.create.mock.calls[0][0].data.userId).toBe("u_1");
  });

  it("stamps a real UTC instant rather than a shifted wall-clock string", async () => {
    db.registration.findUnique.mockResolvedValue(registrant);
    db.attendance.findUnique.mockResolvedValue(null);
    db.attendance.create.mockResolvedValue({ id: "att_1" });

    const before = Date.now();
    await recordTimeIn("202312437", "ev_1");
    const { timeIn } = db.attendance.create.mock.calls[0][0].data;

    // §3.1: the old helper re-parsed a Manila wall-clock string in the server's
    // zone, landing 8 hours ahead on a UTC host.
    expect(timeIn).toBeInstanceOf(Date);
    expect(timeIn.getTime()).toBeGreaterThanOrEqual(before);
    expect(timeIn.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe("recordTimeOut", () => {
  it("only updates rows that have not already been timed out", async () => {
    db.attendance.updateMany.mockResolvedValue({ count: 1 });
    await recordTimeOut("202312437", "ev_1");

    // §3.3: without `timeOut: null` in the filter, a second scan kept moving
    // the recorded departure later.
    expect(db.attendance.updateMany.mock.calls[0][0].where.timeOut).toBeNull();
  });

  it("reports a repeat scan as already timed out", async () => {
    db.attendance.updateMany.mockResolvedValue({ count: 0 });
    db.attendance.findFirst.mockResolvedValue({ id: "att_1" });
    await expect(recordTimeOut("202312437", "ev_1")).rejects.toThrow("Already timed out");
  });

  it("distinguishes never-timed-in from already-timed-out", async () => {
    db.attendance.updateMany.mockResolvedValue({ count: 0 });
    db.attendance.findFirst.mockResolvedValue(null);
    await expect(recordTimeOut("202312437", "ev_1")).rejects.toThrow(
      /no Attendance record/i
    );
  });

  it("returns the update result on success", async () => {
    db.attendance.updateMany.mockResolvedValue({ count: 1 });
    await expect(recordTimeOut("202312437", "ev_1")).resolves.toEqual({ count: 1 });
  });
});
