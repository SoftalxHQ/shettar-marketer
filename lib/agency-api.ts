import { apiFetch } from "@/lib/api";

export type AgencySummary = {
  agency_name?: string;
  commission_balance?: number;
  total_allocated?: number;
  team_members_count?: number;
  total_referrals?: number;
  verified_businesses?: number;
  referral_commission_earned?: number;
};

export type AgencyMember = {
  id: number;
  full_name: string;
  email: string;
  referrer_code: string;
  status: string;
  total_referrals?: number;
  verified_businesses?: number;
  referral_commission_earned?: number;
  balance?: number;
  commission_balance?: number;
};

export type AgencyAllocation = {
  id: number;
  member_id: number;
  member_name: string;
  amount: number;
  wallet_type: string;
  notes?: string | null;
  created_at: string;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAgencySummary(token: string) {
  const res = await apiFetch("/api/v1/marketers/me/agency", { headers: authHeaders(token) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load agency summary");
  return json.agency as AgencySummary;
}

export async function fetchAgencyMembers(token: string) {
  const res = await apiFetch("/api/v1/marketers/me/agency/members", { headers: authHeaders(token) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load team members");
  return json.members as AgencyMember[];
}

export async function createAgencyMember(
  token: string,
  member: { full_name: string; email: string; phone_number?: string },
) {
  const res = await apiFetch("/api/v1/marketers/me/agency/members", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ member }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to add team member");
  return json.member as AgencyMember;
}

export async function fetchMemberPerformance(token: string, memberId: number) {
  const res = await apiFetch(`/api/v1/marketers/me/agency/members/${memberId}/performance`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load member performance");
  return json as { member: AgencyMember; performance: Record<string, unknown> };
}

export async function allocateAgencyFunds(
  token: string,
  payload: { member_id: number; amount: number; wallet_type: string; notes?: string },
) {
  const res = await apiFetch("/api/v1/marketers/me/agency/allocate", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to release funds");
  return json.allocation as AgencyAllocation;
}

export async function fetchAgencyAllocations(token: string, page = 1) {
  const res = await apiFetch(`/api/v1/marketers/me/agency/allocations?page=${page}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load allocations");
  return json as { allocations: AgencyAllocation[]; meta?: { current_page: number; total_pages: number } };
}

export async function updateAgencyMemberStatus(
  token: string,
  memberId: number,
  payload: { status: "active" | "inactive"; reason?: string },
) {
  const res = await apiFetch(`/api/v1/marketers/me/agency/members/${memberId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update member status");
  return json.member as AgencyMember;
}
