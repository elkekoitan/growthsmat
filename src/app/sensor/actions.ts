"use server";
// SmartGrowth OS — /sensor gerçek cihaz ve okuma Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createDevice, addReading, type DeviceInput, type CreateDeviceResult, type AddReadingResult } from "@/server/repositories/sensors";

export async function createDeviceAction(input: DeviceInput): Promise<CreateDeviceResult> {
  const { membership } = await requireMembership();
  const result = await createDevice(membership.workspaceId, input);
  revalidatePath("/sensor");
  return result;
}

export async function addReadingAction(deviceCode: string, value: number): Promise<AddReadingResult> {
  const { membership } = await requireMembership();
  const result = await addReading(membership.workspaceId, deviceCode, value);
  revalidatePath("/sensor");
  return result;
}
