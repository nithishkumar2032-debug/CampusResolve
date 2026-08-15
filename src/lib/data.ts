/**
 * Production data access — replaces demo-store.
 * All pages/actions should import from here.
 */
export {
  acceptTask,
  addComment,
  assignComplaint,
  createComplaint,
  createSignedEvidenceUrl,
  EVIDENCE_BUCKET,
  findProfileById,
  getAttachments,
  getComplaint,
  getEscalations,
  getEvents,
  getProfilesMap,
  getStats,
  listAllComplaints,
  listAllProfiles,
  listComplaintsForUser,
  listWorkers,
  resolveComplaint,
  reviewComplaint,
  uploadEvidenceFile,
  verifyComplaint,
} from "./repositories/complaints";

/** @deprecated use getProfilesMap — temporary for ticket pages */
export async function getStore() {
  const { getProfilesMap, listAllComplaints, getEscalations } = await import(
    "./repositories/complaints"
  );
  const profiles = await getProfilesMap();
  return {
    profiles,
    complaints: await listAllComplaints(),
    escalations: await getEscalations(),
    events: [],
    attachments: [],
    seed_version: 0,
    ticket_counter: 0,
  };
}
