'use server';

import { revalidatePath } from 'next/cache';
import { getRepository } from '@/lib/db/server';
import type { Activity, Lead, LeadQuery, Stage } from '@/lib/domain/lead';
import { activityInputSchema, leadInputSchema } from '@/lib/domain/validation';

/**
 * The server side of the database mode.
 *
 * Every action re-validates its input with the same schema the form
 * uses. The form's checks are a convenience for the person typing; this
 * is the one that decides what may be written.
 */

export async function listLeadsAction(query: LeadQuery = {}): Promise<Lead[]> {
  return getRepository().listLeads(query);
}

export async function getLeadAction(id: string): Promise<Lead | null> {
  return getRepository().getLead(id);
}

export async function createLeadAction(input: unknown): Promise<Lead> {
  const parsed = leadInputSchema.parse(input);
  const lead = await getRepository().createLead(parsed);
  revalidatePath('/');
  return lead;
}

export async function updateLeadAction(id: string, input: unknown): Promise<Lead> {
  const parsed = leadInputSchema.parse(input);
  const lead = await getRepository().updateLead(id, parsed);
  revalidatePath('/');
  return lead;
}

export async function moveLeadAction(id: string, stage: Stage): Promise<Lead> {
  const lead = await getRepository().moveLead(id, stage);
  revalidatePath('/');
  return lead;
}

export async function deleteLeadAction(id: string): Promise<void> {
  await getRepository().deleteLead(id);
  revalidatePath('/');
}

export async function listActivitiesAction(leadId?: string, limit?: number): Promise<Activity[]> {
  return getRepository().listActivities(leadId, limit);
}

export async function addActivityAction(input: unknown): Promise<Activity> {
  const parsed = activityInputSchema.parse(input);
  const activity = await getRepository().addActivity(parsed);
  revalidatePath('/');
  return activity;
}

export async function clearAction(): Promise<void> {
  await getRepository().clear();
  revalidatePath('/');
}
